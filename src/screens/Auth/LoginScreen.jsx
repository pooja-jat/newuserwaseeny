import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { login, checkVerificationStatus } from '../../services/authService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import MaterialTextInput from "../../components/input/MaterialTextInput";
import { useAuth } from '../../context/AuthContext';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
import { COLORS } from '../../theme/colors';
            
export default function LoginScreen() {
  const [email, setEmail] = useState('lakshykod@gmail.com');
  const [password, setPassword] = useState('Hii@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();

  useEffect(() => {
    const prefillEmail = route?.params?.email || route?.params?.prefillEmail;
    if (prefillEmail) setEmail(prefillEmail);
  }, [route?.params?.email, route?.params?.prefillEmail]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID_HERE',
      offlineAccess: true,
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google User:', userInfo);
    } catch (error) {
      console.log('Google Sign-In Error:', error);
    }
  };

  const handleEmailChange = text => {
    const value = text ?? '';
    const digitsOnly = value.replace(/\D/g, '');
    if (value.length > 0 && digitsOnly.length === value.length) {
      setEmail(digitsOnly.slice(0, 16));
      return;
    }
    setEmail(value);
  };

  const validate = () => {
    let valid = true;
    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError('Enter a valid email');
      valid = false;
    } else {
      setEmailError('');
    }
    
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);

    try {
      const result = await login(email, password);
      console.log("Login result", result);
      if (result.success) {
        Toast.show({
          type: 'topSuccess',
          text1: 'Login Successful',
          text2: 'Welcome back!',
        });
        navigation.replace('MainTabs');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: result.message,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        text2: 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/BgImg.png')}
            style={styles.topImage}
            resizeMode="cover"
            blurRadius={2}
          />

          <View style={styles.headerOverlay} />
          <View style={styles.headerBottomFade} />

          <Image
            source={require('../../assets/images/ECDKART_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Log in to continue your meal journey
          </Text>

          <MaterialTextInput
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            placeholder="Enter your email"
            error={!!emailError}
            errorText={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <MaterialTextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            error={!!passwordError}
            errorText={passwordError}
            rightIcon={showPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Pressable onPress={() => navigation.navigate('ForgetPass')}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.btnText}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <Pressable style={styles.googleBtn} onPress={signInWithGoogle}>
            <Image
              source={require('../../assets/icons/google.png')}
              style={styles.googleIcon}
              resizeMode="contain"
            />
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          <Text style={styles.footer}>
            Don't have an account?{' '}
            <Text
              style={styles.register}
              onPress={() => navigation.navigate('Signup')}
            >
              Sign Up
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    height: hp(26),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  topImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  headerBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(8.75),
    backgroundColor: 'rgba(245,250,248,0.85)',
  },
  logo: {
    alignSelf: 'center',
    width: wp(60),
    height: hp(14),
    marginTop: hp(4),
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(6.67),
    paddingTop: hp(2),
    zIndex: 1,
  },
  title: {
    fontSize: FONT.xxl,
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: hp(0.5),
    marginBottom: hp(2.5),
  },
  forgot: {
    fontSize: FONT.xs,
    color: COLORS.accent,
    textAlign: 'right',
    marginBottom: hp(2),
    fontWeight: '600',
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: scale(14),
    paddingVertical: hp(2),
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: FONT.md,
    fontWeight: '700',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(2),
    columnGap: wp(3.33),
  },
  orLine: {
    flex: 1,
    height: hp(0.125),
    backgroundColor: COLORS.border,
  },
  orText: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
  },
  googleBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    paddingVertical: hp(1.75),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: wp(2.78),
    marginBottom: hp(1.5),
  },
  googleIcon: {
    width: wp(5),
    height: hp(2.25),
  },
  googleText: {
    fontSize: FONT.sm,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    marginTop: hp(1.25),
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    marginBottom: hp(2.5),
  },
  register: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorText: {
    fontSize: FONT.xs,
    color: COLORS.error,
    marginTop: hp(-0.75),
    marginBottom: hp(1.25),
  },
});
