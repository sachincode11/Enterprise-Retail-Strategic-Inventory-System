import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { transactionService } from '../services';
import { StatusBadge, Loader, ChatFAB } from '../components/UI';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';
import AppHeader from '../components/AppHeader';
const FILTERS = ['All', 'This Week', 'This Month', 'Refunds'];
const filterKey = { All: 'all', 'This Week': 'week', 'This Month': 'month', Refunds: 'refunds' };

// Generate simple CSV receipt content
const generateReceiptCSV = (transactions) => {
  const rows = [
    ['TXN No', 'Store', 'Date', 'Items', 'Total (NPR)', 'Status', 'Payment'],
    ...transactions.map(t => [
      t.txnNo, t.store, t.date, t.items, t.total, t.status, t.paymentMethod,
    ]),
  ];
  return rows.map(r => r.join(',')).join('\n');
};

// Download transactions as CSV
const downloadReport = async (transactions) => {
  try {
    const csv = generateReceiptCSV(transactions);
    const fileName = `invo6_history_${Date.now()}.csv`;

    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // 1. WRITE FILE LOCALLY (REAL SAVE)
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 2. AND ALSO SHARE OPTION (USER CHOOSES DOWNLOAD LOCATION)
    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Download Purchase History',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      Alert.alert(
        'Saved Successfully',
        `File saved in app storage:\n${fileUri}`
      );
    }
  } catch (err) {
    console.log(err);
    Alert.alert('Error', 'Could not export file');
  }
};
export default function HistoryScreen({ navigation }) {
  const { Colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await transactionService.getTransactions({
      period: filterKey[activeFilter],
      search,
    });
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeFilter, search]);

  // Group by month label
  const grouped = transactions.reduce((acc, txn) => {
    const key = txn.month;
    if (!acc[key]) acc[key] = [];
    acc[key].push(txn);
    return acc;
  }, {});
  const sections = Object.entries(grouped);

  const renderTxn = (txn) => (
    <View key={txn.id} style={[styles.txnCard, { backgroundColor: Colors.bgCard, ...Shadow.sm }]}>
      <View style={styles.txnTop}>
        <View style={styles.txnLeft}>
          <Text style={[styles.txnStore, { color: Colors.textPrimary }]}>{txn.store}</Text>
          <Text style={[styles.txnDate, { color: Colors.textMuted }]}>{txn.date} · {txn.time}</Text>
        </View>
        <View style={styles.txnRight}>
          <Text style={[styles.txnAmount, { color: Colors.textPrimary }]}>NPR {txn.total}</Text>
          <StatusBadge status={txn.status} />
        </View>
      </View>
      <View style={[styles.txnDivider, { backgroundColor: Colors.border }]} />
      <View style={styles.txnMeta}>
        <Text style={[styles.txnMetaText, { color: Colors.textMuted }]}>
          {txn.items} items · {txn.paymentMethod} · #{txn.txnNo}
        </Text>
        <TouchableOpacity
          style={[styles.receiptBtn, { borderColor: Colors.border }]}
          onPress={() => navigation.navigate('Receipt', { transactionId: txn.id })}
          activeOpacity={0.8}
        >
          <Text style={[styles.receiptBtnText, { color: Colors.textPrimary }]}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AppHeader title="Personal Info" />
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Purchase History</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={i => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => {
            const isActive = activeFilter === item;
            return (
              <TouchableOpacity
                style={[
                  styles.tab,
                  { backgroundColor: Colors.bgCard, borderColor: Colors.border },
                  isActive && { 
                    backgroundColor: Colors.accentPrimary, 
                    borderColor: Colors.accentPrimary,
                    ...Shadow.md
                  },
                ]}
                onPress={() => setActiveFilter(item)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabText,
                  { color: Colors.textSecondary },
                  isActive && { color: Colors.white, fontFamily: Typography.fontFamily.semiBold },
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
        <Text style={[styles.searchIcon, { color: Colors.textMuted }]}>⌕</Text>
        <TextInput
          style={[styles.searchInput, { color: Colors.textPrimary }]}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={[styles.clearIcon, { color: Colors.textMuted }]}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}><Loader /></View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={([month]) => month}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyIcon, { color: Colors.textMuted }]}>≡</Text>
              <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No transactions found</Text>
            </View>
          }
          ListFooterComponent={
            transactions.length > 0 ? (
              <TouchableOpacity
                style={[styles.downloadBtn, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}
                onPress={() => downloadReport(transactions)}
                activeOpacity={0.8}
              >
                <Text style={[styles.downloadBtnText, { color: Colors.textPrimary }]}>
                  Export History as CSV
                </Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item: [month, txns] }) => (
            <View>
              <Text style={[styles.monthLabel, { color: Colors.textMuted }]}>{month}</Text>
              {txns.map(txn => renderTxn(txn))}
            </View>
          )}
        />
      )}

      {/* Sticky Chat FAB */}
      <ChatFAB onPress={() => navigation.navigate('Chat')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
  flex: 1,
  overflow: 'visible',
},
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold },

  tabsWrapper: {
    height: 60,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tabs: { 
    paddingHorizontal: Spacing.xl, 
    gap: Spacing.md, 
    alignItems: 'center' 
  },
  tab: {
    paddingHorizontal: Spacing.xl, 
    paddingVertical: 10,
    borderRadius: Radius.full, 
    borderWidth: 1.5,
  },
  tabText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.xl, marginVertical: Spacing.md,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.lg,
    borderWidth: 1.5, height: 52,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  searchIcon: { fontSize: 20, marginRight: Spacing.sm, opacity: 0.6 },
  searchInput: {
    flex: 1, fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  clearIcon: { fontSize: 22, paddingLeft: Spacing.sm, opacity: 0.5 },

  content: { paddingHorizontal: Spacing.xl, paddingBottom: 80 },
  monthLabel: {
    fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },

  txnCard: {
    borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  txnTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  txnLeft: { flex: 1 },
  txnStore: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold },
  txnDate: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, marginTop: 3 },
  txnRight: { alignItems: 'flex-end', gap: Spacing.xs },
  txnAmount: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold },
  txnDivider: { height: 1, marginBottom: Spacing.md },
  txnMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  txnMetaText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular },
  receiptBtn: {
    borderWidth: 1.5, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 5,
  },
  receiptBtnText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyIcon: { fontSize: 40, fontFamily: Typography.fontFamily.regular },
  emptyText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },

  downloadBtn: {
    margin: Spacing.xl,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  downloadBtnText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold },
});
