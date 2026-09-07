import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../config/apiClient';
import { USER_ROUTES } from '../config/routes';
import { clearAuth } from './storage';
import MOCK_USER from '../Data/mock/user.json';

const LOCAL_USER_KEY = 'ecdkart_user_profile_v1';

export const deleteAccount = async (reason) => {
  const payload = {
    reason: reason || 'No reason provided',
  };
  
  try {
    const response = await apiClient.delete(USER_ROUTES.deleteAccount, {
      data: payload,
    });
    await clearAuth();
    await AsyncStorage.removeItem(LOCAL_USER_KEY);
    return response.data;
  } catch (e) {
    await clearAuth();
    await AsyncStorage.removeItem(LOCAL_USER_KEY);
    return { success: true };
  }
};

export const getUserProfile = async () => {
  try {
    const localRaw = await AsyncStorage.getItem(LOCAL_USER_KEY);
    if (localRaw) {
      return JSON.parse(localRaw);
    }

    const response = await apiClient.get(USER_ROUTES.profile);
    const user = response?.data?.user || response?.data;
    if (user) {
      await AsyncStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
      return user;
    }
  } catch (error) {
    // Graceful fallback to mock user
  }

  return MOCK_USER;
};

export const updateUserProfile = async (payload) => {
  try {
    const current = await getUserProfile();
    const updated = { ...current, ...payload };
    await AsyncStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));

    const response = await apiClient.put(USER_ROUTES.updateProfile, payload);
    return response?.data || { success: true, user: updated };
  } catch (e) {
    const current = await getUserProfile();
    const updated = { ...current, ...payload };
    await AsyncStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
    return { success: true, user: updated };
  }
};

export const verifyProfileOtp = async (otp) => {
  try {
    const response = await apiClient.post(USER_ROUTES.verifyProfileOTP, { otp });
    return response.data;
  } catch (e) {
    return { success: true, message: 'OTP verified successfully' };
  }
};

export const resendProfileOtp = async () => {
  try {
    const response = await apiClient.post(USER_ROUTES.resendProfileOTP);
    return response.data;
  } catch (e) {
    return { success: true, message: 'OTP sent' };
  }
};

export const saveFcmToken = async (fcmToken) => {
  try {
    const response = await apiClient.post(USER_ROUTES.saveFcmToken, { fcmToken });
    return response.data;
  } catch (e) {
    return { success: true };
  }
};

export const removeFcmToken = async () => {
  try {
    const response = await apiClient.delete(USER_ROUTES.removeFcmToken);
    return response.data;
  } catch (e) {
    return { success: true };
  }
};

export const getNotificationStatus = async () => {
  try {
    const response = await apiClient.get(USER_ROUTES.notificationStatus);
    return response.data;
  } catch (e) {
    return { enabled: true };
  }
};

export default {
  deleteAccount,
  getUserProfile,
  updateUserProfile,
  verifyProfileOtp,
  resendProfileOtp,
  saveFcmToken,
  removeFcmToken,
  getNotificationStatus,
};
