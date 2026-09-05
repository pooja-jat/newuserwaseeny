import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkVerificationStatus as checkVerificationStatusApi, loginApi, logoutApi } from '../services/authService';
import Toast from 'react-native-toast-message';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  onSocketEvent,
} from '../services/realtime/socketClient';
import {
  initializePushNotifications,
  teardownPushNotifications,
} from '../services/push/firebaseMessagingService';
import MOCK_USER from '../Data/mock/user.json';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const socketUnsubscribers = React.useRef([]);

  const cleanupSocketListeners = React.useCallback(() => {
    socketUnsubscribers.current.forEach(unsubscribe => {
      try {
        unsubscribe?.();
      } catch (error) {
        console.error('[AuthContext] socket unsubscribe error', error?.message || error);
      }
    });
    socketUnsubscribers.current = [];
  }, []);

  const setupSocketListeners = React.useCallback(() => {
    cleanupSocketListeners();

    socketUnsubscribers.current = [
      onSocketEvent('connected', payload => {
        console.log('[Socket] server connected payload', payload);
      }),
      onSocketEvent('notification:new', notification => {
        Toast.show({
          type: 'success',
          text1: notification?.title || 'Notification',
          text2: notification?.message || '',
        });
      }),
      onSocketEvent('order:status', payload => {
        Toast.show({
          type: 'success',
          text1: 'Order Update',
          text2: payload?.message || `Status: ${payload?.status || 'updated'}`,
        });
      }),
      onSocketEvent('order:cancelled', payload => {
        Toast.show({
          type: 'error',
          text1: 'Order Cancelled',
          text2: payload?.reason || 'Your order was cancelled',
        });
      }),
    ];
  }, [cleanupSocketListeners]);

  const bootstrapRealtimeAndPush = React.useCallback(async () => {
    console.log('[AuthContext] 🚀 Bootstrapping realtime and push...');
    
    try {
      await connectSocket();
      setupSocketListeners();
      setRealtimeReady(true);
      console.log('[AuthContext] ✅ Socket ready');
    } catch (error) {
      console.error('[AuthContext] ❌ Socket initialization failed:', error?.message || error);
      setRealtimeReady(false);

      // If the socket self-heals (token was renewed in background), flip
      // realtimeReady to true once the deferred connect event fires.
      const s = getSocket();
      if (s) {
        s.once('connect', () => {
          setupSocketListeners();
          setRealtimeReady(true);
          console.log('[AuthContext] ✅ Socket self-healed and ready');
        });
      }
    }

    const pushResult = await initializePushNotifications();
    if (pushResult?.enabled) {
      console.log('[AuthContext] ✅ Push notifications enabled');
    } else {
      console.warn('[AuthContext] ⚠️ Push notifications disabled:', pushResult?.reason);
    }
  }, [setupSocketListeners]);

  const teardownRealtimeAndPush = React.useCallback(async ({ removeRemoteToken = false } = {}) => {
    cleanupSocketListeners();
    disconnectSocket();
    setRealtimeReady(false);
    await teardownPushNotifications({ removeRemoteToken });
  }, [cleanupSocketListeners]);

  const checkAuthStatus = React.useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      let storedToken = await AsyncStorage.getItem('auth_token');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Fallback demo user from JSON for local frontend testing
        setUser(MOCK_USER);
      }

      if (storedToken) {
        try {
          await bootstrapRealtimeAndPush();
        } catch (e) {
          console.warn('[AuthContext] Realtime/Push skipped in local mode');
        }
      }
    } catch (error) {
      console.warn('[AuthContext] Error in checkAuthStatus:', error?.message);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [bootstrapRealtimeAndPush]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email, password) => {
    try {
      console.log('[AuthContext] 🔐 Login attempt for:', email);
      const response = await loginApi({ email, password });
      console.log('[AuthContext] ✅ Login response received:', response.data);
      
      const { user: authenticatedUser, token, accessToken } = response.data;
      
      const authToken = token || accessToken;
      if (authToken) {
        await AsyncStorage.setItem('auth_token', authToken);
        console.log('[AuthContext] ✅ Auth token saved to AsyncStorage:', authToken.substring(0, 20) + '...');
        
        // Verify it was saved
        const savedToken = await AsyncStorage.getItem('auth_token');
        if (savedToken) {
          console.log('[AuthContext] ✅ Token verified in AsyncStorage');
        } else {
          console.error('[AuthContext] ❌ Token NOT saved in AsyncStorage!');
        }
      }

      if (authenticatedUser) {
        await AsyncStorage.setItem('userData', JSON.stringify(authenticatedUser));
        setUser(authenticatedUser);
        console.log('[AuthContext] ✅ User data saved');

        if (authToken) {
          console.log('[AuthContext] 🚀 Bootstrapping realtime and push...');
          await bootstrapRealtimeAndPush();
        } else {
          console.warn('[AuthContext] ⚠️ No token in login response — cannot connect socket');
        }
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('[AuthContext] ❌ Login failed:', error?.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Something went wrong, please try again',
      };
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout API error:', error);
    }
    await teardownRealtimeAndPush({ removeRemoteToken: true });
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
  };

  useEffect(() => {
    return () => {
      teardownRealtimeAndPush({ removeRemoteToken: false });
    };
  }, [teardownRealtimeAndPush]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
        isInitialized,
        realtimeReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);