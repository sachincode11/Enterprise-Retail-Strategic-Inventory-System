import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { transactionService } from '../services';
import { StatusBadge, Loader, Card } from '../components/UI';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';

// Generate printable receipt text
const buildReceiptText = (txn) => {
  const divider = '─'.repeat(36);
  const line = (label, value) =>
    `${label.padEnd(20)}${String(value).padStart(16)}`;

  return [
    '           INVO6',
    `     Tax Invoice / Receipt`,
    divider,
    `Store: ${txn.store}`,
    `Date : ${txn.date}  ${txn.time}`,
    `TXN  : #${txn.txnNo}`,
    divider,
    ...txn.lineItems.map(i => line(i.name, `NPR ${i.price}`)),
    divider,
    line('Subtotal', `NPR ${txn.subtotal}`),
    txn.discount > 0 ? line('Discount', `-NPR ${txn.discount}`) : null,
    txn.tax > 0 ? line(`Tax (${txn.taxRate}%)`, `NPR ${txn.tax}`) : null,
    line('TOTAL', `NPR ${txn.total}`),
    divider,
    `Payment : ${txn.paymentMethod}`,
    `Status  : ${txn.status}`,
    divider,
    '     Thank you for your purchase!',
    '       support@invo6.com',
  ].filter(Boolean).join('\n');
};

const downloadReceipt = async (txn) => {
  try {
    const content = buildReceiptText(txn);
    const fileName = `receipt_${txn.txnNo || txn.id}.txt`;

    // Web Download Logic
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      return;
    }

    // Native Download/Share Logic
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: `Receipt #${txn.txnNo}`,
      });
    } else {
      Alert.alert('Saved', `Receipt saved to: ${fileUri}`);
    }
  } catch (err) {
    console.error("Download Error:", err);
    Alert.alert('Error', 'Could not export receipt. Please try again.');
  }
};

export default function ReceiptScreen({ navigation, route }) {
  const { Colors } = useTheme();
  const { transactionId } = route.params || {};
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await transactionService.getTransactionById(transactionId);
      setTxn(data);
      setLoading(false);
    })();
  }, [transactionId]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors.bgBase }]}>
        <Loader />
      </View>
    );
  }

  if (!txn) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgBase }]} edges={['top']}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: Colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: Colors.textMuted }]}>Receipt not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const savings = txn.discount > 0 ? txn.discount : null;

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
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Receipt</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Store info */}
        <View style={[styles.storeCard, { backgroundColor: Colors.accentPrimary }]}>
          <View style={[styles.storeIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.storeIconText}>S</Text>
          </View>
          <Text style={styles.storeName}>{txn.store}</Text>
          <Text style={styles.storeMeta}>{txn.date} · {txn.time}</Text>
          <View style={styles.storeStatusRow}>
            <StatusBadge status={txn.status} />
          </View>
        </View>

        {/* TXN meta */}
        <Card style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: Colors.textMuted }]}>TXN NUMBER</Text>
              <Text style={[styles.metaValue, { color: Colors.textPrimary, fontFamily: Typography.fontFamily.mono }]}>
                #{txn.txnNo}
              </Text>
            </View>
            <View style={[styles.metaDiv, { backgroundColor: Colors.border }]} />
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: Colors.textMuted }]}>PAYMENT</Text>
              <Text style={[styles.metaValue, { color: Colors.textPrimary }]}>{txn.paymentMethod}</Text>
            </View>
            <View style={[styles.metaDiv, { backgroundColor: Colors.border }]} />
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: Colors.textMuted }]}>ITEMS</Text>
              <Text style={[styles.metaValue, { color: Colors.textPrimary }]}>{txn.lineItems?.length}</Text>
            </View>
          </View>
        </Card>

        {/* Line items */}
        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>PURCHASED ITEMS</Text>
        <Card style={styles.itemsCard} padding={false}>
          {txn.lineItems?.map((item, i) => (
            <React.Fragment key={i}>
              <View style={styles.lineItem}>
                <View style={styles.itemLeft}>
                  <Text style={[styles.itemName, { color: Colors.textPrimary }]}>{item.name}</Text>
                  {item.qty > 1 && (
                    <Text style={[styles.itemQty, { color: Colors.textMuted }]}>
                      {item.qty} x NPR {item.unitPrice}
                    </Text>
                  )}
                </View>
                <Text style={[styles.itemPrice, { color: Colors.textPrimary }]}>
                  NPR {item.price}
                </Text>
              </View>
              {i < txn.lineItems.length - 1 && (
                <View style={[styles.itemDivider, { backgroundColor: Colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </Card>

        {/* Summary */}
        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>SUMMARY</Text>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: Colors.textPrimary }]}>NPR {txn.subtotal}</Text>
          </View>
          {txn.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>−NPR {txn.discount}</Text>
            </View>
          )}
          {txn.tax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>
                Tax ({txn.taxRate}%)
              </Text>
              <Text style={[styles.summaryValue, { color: Colors.textPrimary }]}>NPR {txn.tax}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { borderTopColor: Colors.border }]}>
            <Text style={[styles.totalLabel, { color: Colors.textPrimary }]}>Total Paid</Text>
            <Text style={[styles.totalValue, { color: Colors.textPrimary }]}>NPR {txn.total}</Text>
          </View>
          {savings && (
            <View style={[styles.savingsBadge, { backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.savingsText, { color: Colors.success }]}>
                You saved NPR {savings} on this order
              </Text>
            </View>
          )}
        </Card>

        {/* Download Button */}
        <TouchableOpacity
          style={[styles.downloadBtn, { backgroundColor: Colors.accentPrimary, ...Shadow.md }]}
          onPress={() => downloadReceipt(txn)}
          activeOpacity={0.85}
        >
          <Text style={styles.downloadBtnText}>Download Receipt</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 22, lineHeight: 26 },
  backRow: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  headerTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold },
  errorText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular },

  content: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },

  storeCard: {
    borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  storeIconBox: {
    width: 56, height: 56, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  storeIconText: { fontSize: 24, fontFamily: Typography.fontFamily.semiBold, color: '#fff' },
  storeName: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: '#fff', marginBottom: 4 },
  storeMeta: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: 'rgba(255,255,255,0.75)', marginBottom: Spacing.md },
  storeStatusRow: {},

  metaCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaItem: { flex: 1, alignItems: 'center' },
  metaDiv: { width: 1, height: 36 },
  metaLabel: { fontSize: 10, fontFamily: Typography.fontFamily.semiBold, letterSpacing: 0.6, marginBottom: 4 },
  metaValue: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },

  sectionLabel: {
    fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 1, marginBottom: Spacing.sm,
  },

  itemsCard: { marginBottom: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden' },
  lineItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: Spacing.lg,
  },
  itemLeft: { flex: 1, marginRight: Spacing.md },
  itemName: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },
  itemQty: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, marginTop: 2 },
  itemPrice: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold },
  itemDivider: { height: 1, marginHorizontal: Spacing.lg },

  summaryCard: { marginBottom: Spacing.xl, padding: Spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular },
  summaryValue: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: Spacing.md, marginTop: Spacing.sm },
  totalLabel: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold },
  totalValue: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold },
  savingsBadge: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: Radius.sm, alignItems: 'center' },
  savingsText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },

  downloadBtn: {
    borderRadius: Radius.lg, padding: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.sm,
  },
  downloadBtnText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: '#fff' },
});
