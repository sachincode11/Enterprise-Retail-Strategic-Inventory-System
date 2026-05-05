import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius } from '../constants/theme';

export default function Input({
  label, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, autoCapitalize, returnKeyType,
  style,
}) {
  const { Colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);
  const [secure, setSecure] = useState(secureTextEntry);
  return (
    <View style={[inputStyles.wrapper, style]}>
      {label && (
        <Text style={[inputStyles.label, { color: Colors.textSecondary }]}>{label}</Text>
      )}
      <View style={[
        inputStyles.row,
        {
          backgroundColor: Colors.bgBase,
          borderColor: focused ? Colors.accentPrimary : Colors.border,
        },
      ]}>
        <TextInput
          style={[inputStyles.input, { color: Colors.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
          returnKeyType={returnKeyType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Text>
              {secure ? '👁️' : '🙈'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.lg },
  label: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  eyeBtn: { padding: 4 },
  eye: { fontSize: 14 },
});
