import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Avatar, Card, ChatFAB } from '../components/UI';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';
import AppHeader from '../components/AppHeader';
const MenuItem = ({ iconChar, label, onPress, danger, Colors }) => (
  <TouchableOpacity
    style={[styles.menuItem]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.menuIconBox, { backgroundColor: Colors.bgBase }]}>
      <Text style={[styles.menuIcon, { color: Colors.textSecondary }]}>{iconChar}</Text>
    </View>
    <Text style={[styles.menuLabel, { color: danger ? Colors.error : Colors.textPrimary }]}>
      {label}
    </Text>
    <Text style={[styles.menuChevron, { color: Colors.textMuted }]}>›</Text>
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { Colors } = useTheme();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar & Info */}
        <View style={styles.avatarSection}>
          <AppHeader />
          <View style={[styles.avatarRing, { borderColor: Colors.border }]}>
            <Avatar initials={user?.avatar || 'U'} size={72} />
          </View>
          <Text style={[styles.name, { color: Colors.textPrimary }]}>{user?.fullName}</Text>
          <Text style={[styles.email, { color: Colors.textMuted }]}>{user?.email}</Text>
          {user?.verified && (
            <View style={[styles.verifiedRow]}>
              <View style={[styles.verifiedDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.verifiedText, { color: Colors.textMuted }]}>VERIFIED ACCOUNT</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: Colors.bgCard, ...Shadow.sm }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{user?.orders ?? 24}</Text>
            <Text style={[styles.statLabel, { color: Colors.textMuted }]}>ORDERS</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: Colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.textPrimary }]}>
              {(user?.totalSpent ?? 4820).toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: Colors.textMuted }]}>NPR SPENT</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: Colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{user?.totalSaved ?? 340}</Text>
            <Text style={[styles.statLabel, { color: Colors.textMuted }]}>NPR SAVED</Text>
          </View>
        </View>

        {/* Account Section */}
        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>ACCOUNT</Text>
        <Card style={[styles.menuCard, { backgroundColor: Colors.bgCard }]} padding={false}>
          <MenuItem
            iconChar="◉" label="Personal Information"
            onPress={() => navigation.navigate('PersonalInfo')} Colors={Colors}
          />
          <View style={[styles.menuDivider, { backgroundColor: Colors.border }]} />
          <MenuItem
            iconChar="◎" label="Security & Password"
            onPress={() => navigation.navigate('Security')} Colors={Colors}
          />
          <View style={[styles.menuDivider, { backgroundColor: Colors.border }]} />
          <MenuItem
            iconChar="◧" label="Preferences"
            onPress={() => navigation.navigate('Preferences')} Colors={Colors}
          />
        </Card>

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: Colors.bgCard, borderColor: '#fecaca' }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.signOutText, { color: Colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        {/* Support Footer */}
        <View style={[styles.footerSection, { borderTopColor: Colors.border }]}>
          <Text style={[styles.footerTitle, { color: Colors.textMuted }]}>
            For issues, contact support
          </Text>
          <Text style={[styles.footerContact, { color: Colors.textSecondary }]}>
            Phone: +977-9801234567
          </Text>
          <Text style={[styles.footerContact, { color: Colors.textSecondary }]}>
            Email: support@invo6.com
          </Text>
        </View>

        <Text style={[styles.version, { color: Colors.textMuted }]}>
          Version 1.0.0 · Invo6 Customer App
        </Text>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky Chat FAB */}
      <ChatFAB onPress={() => navigation.navigate('Chat')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },

  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  name: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold },
  email: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, marginTop: 2 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  verifiedDot: { width: 6, height: 6, borderRadius: 3 },
  verifiedText: { fontSize: 10, fontFamily: Typography.fontFamily.semiBold, letterSpacing: 1 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.xl,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold },
  statLabel: { fontSize: 10, fontFamily: Typography.fontFamily.medium, letterSpacing: 0.6, marginTop: 3 },
  statDivider: { width: 1, height: 36 },

  sectionLabel: {
    fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  menuCard: { marginBottom: Spacing.xl, borderRadius: Radius.lg, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  menuIconBox: {
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  menuIcon: { fontSize: 16, fontFamily: Typography.fontFamily.medium },
  menuLabel: { flex: 1, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },
  menuChevron: { fontSize: 20 },
  menuDivider: { height: 1, marginLeft: Spacing.lg + 36 + Spacing.md },

  signOutBtn: {
    borderRadius: Radius.lg, padding: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  signOutText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold },

  footerSection: {
    borderTopWidth: 1, paddingTop: Spacing.xl, marginBottom: Spacing.lg,
    alignItems: 'center', gap: Spacing.xs,
  },
  footerTitle: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, marginBottom: Spacing.xs },
  footerContact: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular },

  version: {
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.lg,
  },
});
