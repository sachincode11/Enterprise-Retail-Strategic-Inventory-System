import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Smart API Configuration
 * 
 * Automatically detects the backend URL:
 * - Web: localhost
 * - Emulator/Physical Device: Automatically detects the host IP from Expo
 */
const getBaseUrl = () => {
  // 1. Web always uses localhost
  if (Platform.OS === 'web') return 'http://localhost:8000/api/v1';

  // 2. Try to get the host IP from Expo's manifest
  // hostUri typically looks like "192.168.1.50:8081"
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.hostUri;
  
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000/api/v1`;
  }

  // 3. Fallback for Android Emulator if hostUri is missing
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000/api/v1';

  // 4. Final fallback
  return 'http://localhost:8000/api/v1';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 15000, // Increased timeout for slow ML cold starts
};
