import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { transactionService, offerService, notificationService } from '../services';
import { Card, Avatar, SectionHeader, StatusBadge, Loader, ChatFAB } from '../components/UI';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';
import AppHeader from '../components/AppHeader';
// Clean icon symbols (no emojis)

const NAV_ACTIONS = [
  { key: 'History',   icon: '≡',  label: 'History' },
  { key: 'Analytics', icon: '↗',  label: 'Analytics' },
  { key: 'Deals',     icon: '%',  label: 'Deals' },
  { key: 'Profile',   icon: '◯',  label: 'Profile' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { Colors } = useTheme();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [featuredOffer, setFeaturedOffer] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING,' : hour < 17 ? 'GOOD AFTERNOON,' : 'GOOD EVENING,';

  const load = async () => {
    try {
      const [sum, txns, offer, notifs] = await Promise.all([
        transactionService.getMonthSummary(),
        transactionService.getRecentTransactions(3),
        offerService.getFeaturedOffer(),
        notificationService.getNotifications(),
      ]);
      setSummary(sum);
      setTransactions(txns);
      setFeaturedOffer(offer);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: Colors.bgBase }]}>
      <Loader />
    </View>
  );

  const firstName = user?.fullName?.split(' ')[0] || 'User';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentPrimary}
          />
        }
      >
        {/* Top Bar — greeting moved slightly down via paddingTop */}
        <View style={styles.topBar}>
          <View style={styles.greetingBlock}>
           
            <Text style={[styles.greeting, { color: Colors.textMuted }]}>{greeting}</Text>
            <Text style={[styles.name, { color: Colors.textPrimary }]}>{firstName}</Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={[styles.notifIcon, { color: Colors.textSecondary }]}>◇</Text>
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar initials={user?.avatar || 'U'} size={40} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Offer Banner */}
        {featuredOffer && (
          <TouchableOpacity
            style={[styles.offerBanner, { backgroundColor: Colors.accentPrimary }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Deals')}
          >
            <View style={styles.offerIconBox}>
              <Text style={styles.offerIconText}>%</Text>
            </View>
            <View style={styles.offerInfo}>
              <Text style={styles.offerLabel}>TODAY'S DEAL</Text>
              <Text style={styles.offerTitle}>{featuredOffer.title}</Text>
              <Text style={styles.offerSub}>Valid at partner stores · Tap to view</Text>
            </View>
            <Text style={styles.offerChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* Monthly Summary Card */}
        {summary && (
          <Card style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>THIS MONTH</Text>
            <View style={styles.summaryRow}>
              <View>
                <Text style={[styles.summaryAmount, { color: Colors.textPrimary }]}>
                  NPR {(summary.total || 0).toLocaleString()}
                </Text>
                <Text style={[styles.summaryChange, { color: Colors.textMuted }]}>
                  +{summary.change}% from last month
                </Text>
              </View>
              <View style={styles.chartIcon}>
                {[0.4, 0.6, 0.8, 1].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.chartBar,
                      { height: 24 * h, opacity: 0.3 + h * 0.7, backgroundColor: Colors.accentPrimary },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={[styles.statsDivider, { backgroundColor: Colors.border }]} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: Colors.textMuted }]}>TRANSACTIONS</Text>
                <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{summary.txnCount}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: Colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: Colors.textMuted }]}>AVG. SPEND</Text>
                <Text style={[styles.statValue, { color: Colors.textPrimary }]}>NPR {summary.avgSpend}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: Colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: Colors.textMuted }]}>SAVED</Text>
                <Text style={[styles.statValue, { color: Colors.success }]}>NPR {summary.saved}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Quick Nav */}
        <View style={styles.quickNav}>
          {NAV_ACTIONS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.quickNavItem}
              onPress={() => navigation.navigate(item.key)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickNavIcon, { backgroundColor: Colors.bgCard, ...Shadow.sm }]}>
                <Text style={[styles.quickNavIconText, { color: Colors.accentPrimary }]}>
                  {item.icon}
                </Text>
              </View>
              <Text style={[styles.quickNavLabel, { color: Colors.textSecondary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <SectionHeader
          title="Recent Transactions"
          action="See all"
          onAction={() => navigation.navigate('History')}
        />
        {transactions.map(txn => (
          <TouchableOpacity
            key={txn.id}
            style={[styles.txnRow, { backgroundColor: Colors.bgCard, ...Shadow.sm }]}
            onPress={() => navigation.navigate('Receipt', { transactionId: txn.id })}
            activeOpacity={0.8}
          >
            <View style={[styles.txnIconBox, { backgroundColor: Colors.bgBase }]}>
              <Text style={[styles.txnIconText, { color: Colors.textSecondary }]}>S</Text>
            </View>
            <View style={styles.txnInfo}>
              <Text style={[styles.txnStore, { color: Colors.textPrimary }]}>{txn.store}</Text>
              <Text style={[styles.txnDate, { color: Colors.textMuted }]}>{txn.dateLabel}</Text>
            </View>
            <View style={styles.txnRight}>
              <Text style={[styles.txnAmount, { color: Colors.textPrimary }]}>−NPR {txn.total}</Text>
              <StatusBadge status={txn.status} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky Chat FAB */}
      <ChatFAB onPress={() => navigation.navigate('Chat')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Top bar — extra top padding pushes greeting down slightly
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  greetingBlock: {},
  greeting: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    letterSpacing: 1,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semiBold,
    marginTop: 2,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  notifBtn: {
    position: 'relative', width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  notifIcon: { fontSize: 16 },
  notifBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#ef4444', borderRadius: 5, width: 10, height: 10,
  },
  notifBadgeText: { color: '#fff', fontSize: 7, fontFamily: Typography.fontFamily.semiBold, textAlign: 'center' },

  offerBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  offerIconBox: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  offerIconText: { fontSize: 16, color: '#fff', fontFamily: Typography.fontFamily.semiBold },
  offerInfo: { flex: 1 },
  offerLabel: {
    fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold,
    color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, marginBottom: 2,
  },
  offerTitle: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: '#fff' },
  offerSub: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  offerChevron: { fontSize: 22, color: 'rgba(255,255,255,0.7)' },

  summaryCard: { marginBottom: Spacing.lg, padding: Spacing.xl },
  summaryLabel: {
    fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 1, marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.lg,
  },
  summaryAmount: { fontSize: Typography.fontSize.xxl, fontFamily: Typography.fontFamily.semiBold },
  summaryChange: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, marginTop: 4 },
  chartIcon: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  chartBar: { width: 8, borderRadius: 4 },

  statsDivider: { height: 1, marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32 },
  statLabel: { fontSize: 10, fontFamily: Typography.fontFamily.semiBold, letterSpacing: 0.6, marginBottom: 3 },
  statValue: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },

  quickNav: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  quickNavItem: { alignItems: 'center', gap: Spacing.xs },
  quickNavIcon: {
    width: 56, height: 56, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  quickNavIconText: { fontSize: 18, fontFamily: Typography.fontFamily.semiBold },
  quickNavLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium },

  txnRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  txnIconBox: {
    width: 40, height: 40, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  txnIconText: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold },
  txnInfo: { flex: 1 },
  txnStore: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },
  txnDate: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, marginTop: 2 },
  txnRight: { alignItems: 'flex-end', gap: Spacing.xs },
  txnAmount: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold },
});
