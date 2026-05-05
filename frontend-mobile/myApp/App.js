import React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/hooks/useAuth';
import { ThemeProvider, useTheme } from './src/hooks/useTheme';
import RootNavigator from './src/navigation';

function AppContent() {
  const { isDark, Colors } = useTheme();
  return (
    <AuthProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </AuthProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMMono_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
          <ActivityIndicator color="#1e3a5f" size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
