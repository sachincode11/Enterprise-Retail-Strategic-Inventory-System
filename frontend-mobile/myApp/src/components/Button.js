import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius } from '../constants/theme';

export default function Button({ title, onPress, loading, style, variant = 'primary', disabled }) {
  const { Colors } = useTheme();
  const isDisabled = disabled || loading;

  const bgColor = variant === 'secondary' ? Colors.bgBase : Colors.accentPrimary;
  const textColor = variant === 'secondary' ? Colors.textPrimary : Colors.white;
  const borderStyle = variant === 'secondary'
    ? { borderWidth: 1.5, borderColor: Colors.border }
    : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: bgColor, opacity: isDisabled ? 0.6 : 1 },
        borderStyle,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 15,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 0.3,
  },
});
