import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { offerService, transactionService } from '../services';
import { Card, Loader, ProgressBar, ChatFAB } from '../components/UI';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import { useFocusEffect } from '@react-navigation/native';

// Loyalty points logic: 10 pts per NPR 1000; 500 pts = NPR 500 discount
const POINTS_PER_THOUSAND = 10;
const REDEMPTION_THRESHOLD = 500;
const REDEMPTION_VALUE = 500;

const TABS = ['All', 'Deals', 'Loyalty'];

export default function OffersScreen({ navigation }) {
  const { Colors } = useTheme();
  const [activeTab, setActiveTab] = useState('All');
  const [offers, setOffers] = useState([]);
  const [summary, setSummary] = useState({ loyaltyPoints: 0 });
  const [loading, setLoading] = useState(true);

  // Derive loyalty state from summary
  const loyaltyPoints = summary.loyaltyPoints || 0;
  const nextRedemptionAt = REDEMPTION_THRESHOLD;
  const pointsProgress = loyaltyPoints / nextRedemptionAt;
  const redeemable = loyaltyPoints >= REDEMPTION_THRESHOLD;
  const pointsToGo = Math.max(0, REDEMPTION_THRESHOLD - loyaltyPoints);

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [offersData, summaryData] = await Promise.all([
        offerService.getOffers(activeTab === 'All' ? 'All' : activeTab),
        transactionService.getMonthSummary()
      ]);
      
      let filtered = offersData;
      if (activeTab === 'Deals') filtered = offersData.filter(o => o.type !== 'loyalty');
      if (activeTab === 'Loyalty') filtered = offersData.filter(o => o.type === 'loyalty');
      
      setOffers(filtered);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [activeTab])
  );

  const featured = offers.find(o => o.featured);
  const rest = offers.filter(o => !o.featured && o.type !== 'loyalty');

  const StatusPill = ({ status }) => {
    if (!status) return null;
    const map = {
      Active: { bg: '#f0fdf4', text: '#166534' },
      New:    { bg: '#eff6ff', text: '#1e40af' },
      Soon:   { bg: '#f5f3ff', text: '#5b21b6' },
    }[status] || { bg: Colors.bgBase, text: Colors.textMuted };
    return (
      <View style={[pillStyle.pill, { backgroundColor: map.bg }]}>
        
        <Text style={[pillStyle.text, { color: map.text }]}>{status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AppHeader />
        
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Deals & Rewards</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              { backgroundColor: Colors.bgCard, borderColor: Colors.border },
              activeTab === tab && { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.tabText,
              { color: Colors.textSecondary },
              activeTab === tab && { color: Colors.white },
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><Loader /></View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadData}
              colors={[Colors.accentPrimary]}
              tintColor={Colors.accentPrimary}
            />
          }
        >

          {/* Loyalty Points Card — always visible */}
          {(activeTab === 'All' || activeTab === 'Loyalty') && (
            <>
              <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>LOYALTY REWARDS</Text>
              <Card style={styles.loyaltyCard}>
                <View style={styles.loyaltyTop}>
                  <View>
                    <Text style={[styles.loyaltyPoints, { color: Colors.textPrimary }]}>
                      {loyaltyPoints} <Text style={styles.loyaltyUnit}>pts</Text>
                    </Text>
                    <Text style={[styles.loyaltyEarn, { color: Colors.textMuted }]}>
                      Earn {POINTS_PER_THOUSAND} pts per NPR 1,000 spent
                    </Text>
                  </View>
                  {redeemable ? (
                    <View style={[styles.redeemBadge, { backgroundColor: Colors.success }]}>
                      <Text style={styles.redeemBadgeText}>Redeem</Text>
                    </View>
                  ) : (
                    <View style={[styles.redeemBadge, { backgroundColor: Colors.bgBase }]}>
                      <Text style={[styles.redeemBadgeText, { color: Colors.textMuted }]}>
                        {pointsToGo} to go
                      </Text>
                    </View>
                  )}
                </View>

                <ProgressBar
                  value={loyaltyPoints}
                  max={nextRedemptionAt}
                  color={redeemable ? Colors.success : Colors.accentPrimary}
                  style={styles.loyaltyBar}
                />

                <View style={styles.loyaltyFooter}>
                  <Text style={[styles.loyaltyFooterText, { color: Colors.textMuted }]}>
                    {loyaltyPoints}/{nextRedemptionAt} pts
                  </Text>
                  <Text style={[styles.loyaltyFooterText, { color: Colors.textMuted }]}>
                    Next reward: NPR {REDEMPTION_VALUE} off
                  </Text>
                </View>
              </Card>
            </>
          )}

          {/* Featured Deal */}
          {featured && (activeTab === 'All' || activeTab === 'Deals') && (
            <>
              <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>FEATURED DEAL</Text>
              <Card style={[styles.featuredCard, { borderColor: Colors.accentPrimary, borderWidth: 1.5 }]}>
                <View style={styles.featuredHeader}>
                  <View style={[styles.featuredBadge, { backgroundColor: Colors.accentPrimary }]}>
                    <Text style={styles.featuredBadgeText}>Best Deal</Text>
                  </View>
                  <Text style={[styles.featuredTitle, { color: Colors.textPrimary }]}>
                    {featured.title}
                  </Text>
                </View>
                <Text style={[styles.featuredDesc, { color: Colors.textSecondary }]}>
                  {featured.description}
                </Text>
                <View style={[styles.featuredFooter, { borderTopColor: Colors.border }]}>
                  <Text style={[styles.featuredFooterText, { color: Colors.textMuted }]}>
                    Valid at all partner stores · Limited time
                  </Text>
                </View>
              </Card>
            </>
          )}

          {/* More Deals */}
          {rest.length > 0 && (activeTab === 'All' || activeTab === 'Deals') && (
            <>
              <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>MORE DEALS</Text>
              {rest.map(offer => (
                <Card key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerRow}>
                    <View style={[styles.offerIconBox, { backgroundColor: Colors.bgBase }]}>
                      <Text style={[styles.offerIconText, { color: Colors.accentPrimary }]}>
                        {offer.type === 'cashback' ? 'C' : '%'}
                      </Text>
                    </View>
                    <View style={styles.offerInfo}>
                      <Text style={[styles.offerTitle, { color: Colors.textPrimary }]}>{offer.title}</Text>
                      <Text style={[styles.offerDesc, { color: Colors.textMuted }]}>{offer.description}</Text>
                      {offer.autoApplied && (
                        <View style={[styles.autoPill, { backgroundColor: Colors.bgBase, borderColor: Colors.border }]}>
                          <Text style={[styles.autoPillText, { color: Colors.textMuted }]}>Auto-applied</Text>
                        </View>
                      )}
                    </View>
                    <StatusPill status={offer.status} />
                  </View>
                </Card>
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Sticky Chat FAB */}
      <ChatFAB onPress={() => navigation.navigate('Chat')} />
    </SafeAreaView>
  );
}

const pillStyle = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  text: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold },
});

const styles = StyleSheet.create({
  screen: { flex: 1,overflow: 'visible', },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold },

  tabsScroll: {
    height: 90,
    flexGrow: 0,
  },

  tabs: {
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    height: 70,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
},
  tabText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium },

  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  sectionLabel: {
    fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },

  loyaltyCard: { marginBottom: Spacing.xl, padding: Spacing.xl },
  loyaltyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  loyaltyPoints: { fontSize: Typography.fontSize.xxl, fontFamily: Typography.fontFamily.semiBold },
  loyaltyUnit: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.medium },
  loyaltyEarn: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, marginTop: 2 },
  redeemBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  redeemBadgeText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: '#fff' },
  loyaltyBar: { marginBottom: Spacing.sm },
  loyaltyFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  loyaltyFooterText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular },

  featuredCard: { marginBottom: Spacing.xl },
  featuredHeader: { padding: Spacing.xl, paddingBottom: Spacing.md },
  featuredBadge: {
    alignSelf: 'flex-start', borderRadius: Radius.sm,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: Spacing.md,
  },
  featuredBadgeText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: '#fff' },
  featuredTitle: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold },
  featuredDesc: {
    fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg,
  },
  featuredFooter: {
    borderTopWidth: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  featuredFooterText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular },

  offerCard: { marginBottom: Spacing.sm, padding: Spacing.lg },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  offerIconBox: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  offerIconText: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold },
  offerInfo: { flex: 1 },
  offerTitle: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold },
  offerDesc: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, marginTop: 2 },
  autoPill: {
    alignSelf: 'flex-start', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 2,
    marginTop: 5, borderWidth: 1,
  },
  autoPillText: { fontSize: 10, fontFamily: Typography.fontFamily.mono },
});
