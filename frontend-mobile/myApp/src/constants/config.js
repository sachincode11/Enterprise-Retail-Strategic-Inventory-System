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
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.hostUri;
  
  const url = hostUri ? `http://${hostUri.split(':')[0]}:8000/api/v1` : 
              Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 
              'http://localhost:8000/api/v1';

  console.log(`[Config] Detected Backend URL: ${url}`);
  return url;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 15000, // Increased timeout for slow ML cold starts
};
