import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ ADDED

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Shadow } from '../constants/theme';

// Screens
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPScreen from '../screens/OTPScreen';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import OffersScreen from '../screens/OffersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReceiptScreen from '../screens/ReceiptScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import SecurityScreen from '../screens/SecurityScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import { Loader } from '../components/UI';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Icons ─────────────────────────────
const TAB_ICONS = {
  Home:      { active: '⌂' },
  History:   { active: '≡' },
  Analytics: { active: '↗' },
  Deals:     { active: '◈' },
  Profile:   { active: '◯' },
};

// ─── Custom Tab Bar ───────────────────
function CustomTabBar({ state, navigation }) {
  const { Colors } = useTheme();
  const insets = useSafeAreaInsets(); // ✅ MAIN FIX

  return (
    <View
      style={[
        tabStyles.container,
        {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,

          // ✅ PERFECT SAFE SPACING
          paddingBottom: insets.bottom + 10,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const icon = TAB_ICONS[route.name] || TAB_ICONS.Profile;

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            activeOpacity={0.75}
          >
            {isFocused && (
              <View
                style={[
                  tabStyles.activeIndicator,
                  { backgroundColor: Colors.accentPrimary },
                ]}
              />
            )}

            <Text
              style={[
                tabStyles.icon,
                { color: isFocused ? Colors.accentPrimary : Colors.textMuted },
              ]}
            >
              {icon.active}
            </Text>

            <Text
              style={[
                tabStyles.label,
                {
                  color: isFocused ? Colors.accentPrimary : Colors.textMuted,
                  fontFamily: isFocused
                    ? Typography.fontFamily.semiBold
                    : Typography.fontFamily.medium,
                },
              ]}
            >
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────
const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    ...Shadow.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -Spacing.md,
    width: 24,
    height: 2.5,
    borderRadius: 2,
  },
  icon: { fontSize: 18 },
  label: { fontSize: 10 },
});

// ─── Main Tabs ─────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Deals" component={OffersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Auth Stack ───────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}

// ─── App Stack ────────────────────────
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}

const linking = {
  prefixes: ['http://localhost:8081', 'ersis://'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          Login: 'login',
          Register: 'register',
          OTP: 'otp/:email/:purpose/:autoResend',
          PrivacyPolicy: 'privacy-policy',
        },
      },
      AppStack: {
        screens: {
          MainTabs: {
            path: '',
            screens: {
              Home: 'home',
              History: 'history',
              Analytics: 'analytics',
              Deals: 'deals',
              Profile: 'profile',
            },
          },
          Receipt: 'receipt/:transactionId',
          Chat: 'chat',
          Notifications: 'notifications',
          PersonalInfo: 'profile/info',
          Security: 'profile/security',
          Preferences: 'profile/preferences',
          OTP: 'verify/:email/:purpose/:autoResend',
          PrivacyPolicy: 'privacy',
        },
      },
    },
  },
};

// ─── Root Navigator ───────────────────
export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { Colors } = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.bgCard,
        }}
      >
        <Loader />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AppStack" component={AppStack} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AuthStack" component={AuthStack} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}