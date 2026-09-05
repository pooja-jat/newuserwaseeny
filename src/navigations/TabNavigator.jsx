import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';

import HomeStack from './HomeStack';
import OrdersStack from './OrdersStack';
import SearchStack from './SearchStack';
import ProfileStack from './ProfileStack';

import HomeIcon from '../assets/icons/home.png';
import OrdersIcon from '../assets/icons/orders.png';
import SearchIcon from '../assets/icons/search.png';
import UserIcon from '../assets/icons/user.png';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondaryGreen,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={HomeIcon}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? COLORS.primary : COLORS.secondaryGreen,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={OrdersIcon}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? COLORS.primary : COLORS.secondaryGreen,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={SearchIcon}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? COLORS.primary : COLORS.secondaryGreen,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={UserIcon}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? COLORS.primary : COLORS.secondaryGreen,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

