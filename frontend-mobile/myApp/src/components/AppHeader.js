import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Spacing } from '../constants/theme';

export default function AppHeader() {
  const { Colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: Colors.bgBase }]}>
      
      {/* CENTER LOGO */}
      <Image
        source={require('../assets/fulllogo.png')}
        style={styles.logo}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',   // ✅ centers horizontally
    justifyContent: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  logo: {
    width: 180,   // adjust if too big/small
    height: 90,
    resizeMode: 'contain',
  },
});