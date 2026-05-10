import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';

// ─── Card ──────────────────────────────────────────────────
export function Card({ children, style, onPress, padding = true }) {
  const { Colors } = useTheme();
  const cardStyle = [
    styles.card,
    { backgroundColor: Colors.bgCard, ...Shadow.sm },
    padding && styles.cardPadding,
    style,
  ];
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

// ─── Loader ────────────────────────────────────────────────
export function Loader({ size = 40 }) {
  const { Colors } = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={loaderStyles.center}>
      <Animated.View
        style={[
          loaderStyles.ring,
          {
            width: size, height: size, borderRadius: size / 2,
            borderColor: Colors.accentPrimary, opacity: pulse,
          },
          { transform: [{ rotate }] },
        ]}
      />
    </View>
  );
}

// ─── Toast ─────────────────────────────────────────────────
export function Toast({ message, type = 'success', visible, onHide }) {
  const { Colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(onHide);
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;
  const bg = type === 'success' ? Colors.success : type === 'error' ? Colors.error : Colors.warning;

  return (
    <Animated.View
      style={[
        toastStyles.container,
        { backgroundColor: bg, transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={toastStyles.text}>{message}</Text>
    </Animated.View>
  );
}

// ─── Progress Bar ──────────────────────────────────────────
export function ProgressBar({ value, max, color, style }) {
  const { Colors } = useTheme();
  const barColor = color || Colors.accentPrimary;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, { toValue: pct, duration: 700, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={[pbStyles.track, { backgroundColor: Colors.border }, style]}>
      <Animated.View
        style={[pbStyles.bar, { backgroundColor: barColor, flex: width }]}
      />
    </View>
  );
}

// ─── Avatar ────────────────────────────────────────────────
export function Avatar({ initials, size = 44 }) {
  const { Colors } = useTheme();
  return (
    <View style={[
      avStyles.container,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.accentPrimary }
    ]}>
      <Text style={[avStyles.text, { fontSize: size * 0.35, color: Colors.white }]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Status Badge ──────────────────────────────────────────
export function StatusBadge({ status }) {
  const colors = {
    Paid:      { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
    completed: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
    Refunded:  { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    refunded:  { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    Pending:   { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
    pending:   { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
    cancelled: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    Active:    { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
    New:       { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
    Soon:      { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' },
  };
  const c = colors[status] || { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
  return (
    <View style={[bdgStyles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[bdgStyles.text, { color: c.text }]}>{status}</Text>
    </View>
  );
}

// ─── Section Header ────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  const { Colors } = useTheme();
  return (
    <View style={shStyles.row}>
      <Text style={[shStyles.title, { color: Colors.textPrimary }]}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[shStyles.action, { color: Colors.accentPrimary }]}>{action} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Global Chat FAB ───────────────────────────────────────
export function ChatFAB({ onPress }) {
  const { Colors } = useTheme();
  return (
    <TouchableOpacity
      style={[fabStyles.fab, { backgroundColor: Colors.accentPrimary, ...Shadow.lg }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={fabStyles.icon}>AI</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg },
  cardPadding: { padding: Spacing.lg },
});

const loaderStyles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  ring: {
    borderWidth: 2.5,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    zIndex: 999,
  },
  text: {
    color: '#ffffff',
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});

const pbStyles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: Radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bar: { borderRadius: Radius.full },
});

const avStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: Typography.fontFamily.semiBold },
});

const bdgStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  text: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
  },
});

const shStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
  },
  action: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
});

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
