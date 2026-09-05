import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const navigation = useNavigation();
  const { isInitialized, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      navigation.replace('LanguageSelect');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, isInitialized]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />

      {/* LOGO */}
      <Image
        source={require('../../assets/images/ECDKART_Logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* PRIMARY GREEN CURVE (SVG) */}
      <View style={styles.svgContainer}>
        <Svg
          width={width}
          height={height * 0.6}
          viewBox="0 0 375 300"
          preserveAspectRatio="none"
        >
          <Path
            d="
              M0 80
              C 90 0, 285 0, 375 80
              L 375 300
              L 0 300
              Z
            "
            fill={COLORS.primary}
          />
        </Svg>
      </View>

      <Image
        source={require('../../assets/images/Noodle.png')}
        style={styles.noodle}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },

  logo: {
    width: width * 0.75,
    height: width * 0.4,
    marginTop: height * 0.12,
    zIndex: 10,
  },

  svgContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: height * 0.6,
  },

  noodle: {
    position: 'absolute',
    bottom: height * 0.099,
    right: 0,
    width: width * 0.99,
    height: width * 0.95,
    zIndex: 5,
  },
});

