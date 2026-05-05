import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsService } from '../services';
import { Card, Loader, ProgressBar, ChatFAB } from '../components/UI';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';
import AppHeader from '../components/AppHeader';

const PERIODS = ['Weekly', 'Monthly', 'Yearly'];
const { width } = Dimensions.get('window');

// Animated bar for the chart
const SpendingBar = ({ label, amount, maxAmount, isActive, onPress, Colors }) => {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const pct = maxAmount > 0 ? amount / maxAmount : 0;
  const targetH = Math.max(pct * 100, 4);

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: targetH,
      duration: 500,
      delay: 80,
      useNativeDriver: false,
    }).start();
  }, [targetH]);

  return (
    <TouchableOpacity style={barStyles.group} onPress={onPress} activeOpacity={0.8}>
      <Text style={[barStyles.amount, { color: isActive ? Colors.textPrimary : Colors.textMuted }]}>
        {amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount}
      </Text>
      <Animated.View
        style={[
          barStyles.bar,
          {
            height: heightAnim,
            backgroundColor: isActive ? Colors.accentPrimary : Colors.border,
          },
        ]}
      />
      <Text style={[barStyles.label, {
        color: isActive ? Colors.textPrimary : Colors.textMuted,
        fontFamily: isActive ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
      }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const barStyles = StyleSheet.create({
  group: { alignItems: 'center', gap: 4, flex: 1 },
  amount: { fontSize: 9, fontFamily: Typography.fontFamily.mono },
  bar: { width: 20, borderRadius: 4, minHeight: 4 },
  label: { fontSize: 10 },
});

export default function AnalyticsScreen({ navigation }) {
  const { Colors } = useTheme();
  const [period, setPeriod] = useState('Monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBar, setActiveBar] = useState(2);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setActiveBar(2);
      const d = await analyticsService.getAnalytics(period.toLowerCase());
      setData(d);
      setLoading(false);
    })();
  }, [period]);

  if (loading || !data) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors.bgBase }]}>
        <Loader />
      </View>
    );
  }

  const maxTrend = Math.max(...data.trend.map(t => t.amount));
  const totalCategory = data.categories.reduce((s, c) => s + c.amount, 0);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Analytics</Text>
        </View>

        {/* Period Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: Colors.bgCard, ...Shadow.sm }]}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.tab,
                period === p && [styles.tabActive, { backgroundColor: Colors.accentPrimary }],
              ]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.75}
            >
              <Text style={[
                styles.tabText,
                { color: period === p ? Colors.white : Colors.textSecondary },
              ]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>TOTAL SPENT</Text>
            <Text style={[styles.summaryAmount, { color: Colors.textPrimary }]}>
              NPR {data.totalSpent.toLocaleString()}
            </Text>
            <Text style={[styles.summaryChange, { color: Colors.textMuted }]}>
              +{data.spentChange}% vs prior
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>TOTAL SAVED</Text>
            <Text style={[styles.summaryAmount, { color: Colors.textPrimary }]}>
              NPR {data.totalSaved.toLocaleString()}
            </Text>
            <Text style={[styles.summaryChange, { color: Colors.success }]}>
              +{data.savedChange}%
            </Text>
          </Card>
        </View>

        {/* Spending Trend Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: Colors.textPrimary }]}>Spending Trend</Text>
            <Text style={[styles.chartPeriod, { color: Colors.textMuted }]}>
              {period === 'Weekly' ? 'This Week'
                : period === 'Monthly' ? 'W1 · W2 · W3 · W4'
                : 'Q1 · Q2 · Q3 · Q4'}
            </Text>
          </View>

          {/* Bar Chart */}
          <View style={styles.chartArea}>
            {data.trend.map((item, i) => (
              <SpendingBar
                key={i}
                label={item.week}
                amount={item.amount}
                maxAmount={maxTrend}
                isActive={activeBar === i}
                onPress={() => setActiveBar(i)}
                Colors={Colors}
              />
            ))}
          </View>

          {/* Selected bar detail */}
          {data.trend[activeBar] && (
            <View style={[styles.barDetail, { backgroundColor: Colors.bgBase }]}>
              <Text style={[styles.barDetailLabel, { color: Colors.textMuted }]}>
                {data.trend[activeBar].week}
              </Text>
              <Text style={[styles.barDetailAmount, { color: Colors.textPrimary }]}>
                NPR {data.trend[activeBar].amount.toLocaleString()}
              </Text>
            </View>
          )}
        </Card>

        {/* By Category */}
        <Card style={styles.categoryCard}>
          <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>By Category</Text>
          {data.categories.map((cat, i) => (
            <View key={i} style={styles.categoryRow}>
              <View style={styles.categoryLabelRow}>
                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                <Text style={[styles.categoryName, { color: Colors.textPrimary }]}>{cat.name}</Text>
                <Text style={[styles.categoryPct, { color: Colors.textMuted }]}>
                  {Math.round((cat.amount / totalCategory) * 100)}%
                </Text>
                <Text style={[styles.categoryAmount, { color: Colors.textPrimary }]}>
                  NPR {cat.amount.toLocaleString()}
                </Text>
              </View>
              <ProgressBar
                value={cat.amount}
                max={totalCategory}
                color={cat.color}
                style={styles.categoryBar}
              />
            </View>
          ))}
        </Card>

        {/* Top Store */}
        <Card style={styles.storeCard}>
          <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Top Store</Text>
          <View style={styles.storeRow}>
            <View style={[styles.storeIconBox, { backgroundColor: Colors.bgBase }]}>
              <Text style={[styles.storeIconText, { color: Colors.accentPrimary }]}>S</Text>
            </View>
            <View style={styles.storeInfo}>
              <Text style={[styles.storeName, { color: Colors.textPrimary }]}>{data.topStore.name}</Text>
              <Text style={[styles.storeMeta, { color: Colors.textMuted }]}>
                {data.topStore.visits} visits · NPR {data.topStore.spent.toLocaleString()} spent
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky Chat FAB */}
      <ChatFAB onPress={() => navigation.navigate('Chat')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },

  header: { paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold },

  tabsContainer: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center',
  },
  tabActive: {},
  tabText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium },

  summaryRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  summaryCard: { flex: 1, padding: Spacing.lg },
  summaryLabel: { fontSize: 10, fontFamily: Typography.fontFamily.semiBold, letterSpacing: 0.8, marginBottom: Spacing.xs },
  summaryAmount: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, marginBottom: 2 },
  summaryChange: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium },

  chartCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  chartTitle: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold },
  chartPeriod: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular },
  chartArea: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
    height: 130, borderBottomWidth: 1, borderColor: '#e2e8f0',
    paddingBottom: Spacing.sm, marginBottom: Spacing.md,
  },
  barDetail: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  barDetailLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium },
  barDetailAmount: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },

  categoryCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, marginBottom: Spacing.lg },
  categoryRow: { marginBottom: Spacing.md },
  categoryLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, gap: Spacing.sm },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryName: { flex: 1, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular },
  categoryPct: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium },
  categoryAmount: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },
  categoryBar: { height: 6, marginLeft: Spacing.lg },

  storeCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md },
  storeIconBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  storeIconText: { fontSize: 18, fontFamily: Typography.fontFamily.semiBold },
  storeInfo: { flex: 1 },
  storeName: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold },
  storeMeta: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, marginTop: 2 },
});
