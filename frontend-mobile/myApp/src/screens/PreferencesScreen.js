import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';

export default function PreferencesScreen({ navigation }) {
  const { Colors, isDark, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: Colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: Colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Preferences</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.menuCard, { backgroundColor: Colors.bgCard, ...Shadow.sm }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.bgBase }]}>
              <Text style={[styles.rowIconText, { color: Colors.textSecondary }]}>
                {isDark ? '●' : '○'}
              </Text>
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>Dark Mode</Text>
              <Text style={[styles.rowSub, { color: Colors.textMuted }]}>
                {isDark ? 'Currently dark theme' : 'Currently light theme'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: Colors.border, true: Colors.accentPrimary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>NOTIFICATIONS</Text>
        <View style={[styles.menuCard, { backgroundColor: Colors.bgCard, ...Shadow.sm }]}>
          {[
            { label: 'Transaction Alerts', sub: 'Get notified on purchases', enabled: true },
            { label: 'Deals & Offers', sub: 'New deals from partner stores', enabled: true },
          ].map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.bgBase }]}>
                  <View style={[styles.notifDot, {
                    backgroundColor: item.enabled ? Colors.success : Colors.textMuted,
                  }]} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.rowSub, { color: Colors.textMuted }]}>{item.sub}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => {}} // Ready for state management
                  trackColor={{ false: Colors.border, true: Colors.accentPrimary }}
                  thumbColor={Colors.white}
                />
              </View>
              {i < arr.length - 1 && (
                <View style={[styles.divider, { backgroundColor: Colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Data */}
        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}> PRIVACY</Text>
        <View style={[styles.menuCard, { backgroundColor: Colors.bgCard, ...Shadow.sm }]}>
          {[
            { label: 'Privacy Policy', sub: 'Read our data handling policy' },
          ].map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.row}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('PrivacyPolicy')}>
              
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.rowSub, { color: Colors.textMuted }]}>{item.sub}</Text>
                </View>
                <Text style={[styles.chevron, { color: Colors.textMuted }]}>›</Text>
              </TouchableOpacity>
              {i < arr.length - 1 && (
                <View style={[styles.divider, { backgroundColor: Colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 22, lineHeight: 26 },
  headerTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold },

  content: { paddingHorizontal: Spacing.xl, paddingBottom: 60 },
  sectionLabel: {
    fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md,
  },

  menuCard: {
    borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, gap: Spacing.md,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconText: { fontSize: 14, fontFamily: Typography.fontFamily.medium },
  notifDot: { width: 8, height: 8, borderRadius: 4 },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },
  rowSub: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, marginTop: 2 },
  divider: { height: 1, marginLeft: Spacing.lg + 36 + Spacing.md },
  chevron: { fontSize: 20 },
});
