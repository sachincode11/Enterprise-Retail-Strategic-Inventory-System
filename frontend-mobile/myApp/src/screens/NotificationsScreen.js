import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationService } from '../services';
import { Loader } from '../components/UI';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';
import AppHeader from '../components/AppHeader';
const TYPE_ICON = {
  transaction: '↗',
  offer:       '%',
  loyalty:     '◈',
  system:      '◎',
};

export default function NotificationsScreen({ navigation }) {
  const { Colors } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setLoading(false);
    })();
  }, []);

  const markRead = async (id) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await notificationService.markRead(id);
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      // Parallelize mark read calls
      await Promise.all(unreadIds.map(id => notificationService.markRead(id)));
    } catch (e) {
      console.error("Failed to mark all read:", e);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: item.read ? Colors.bgCard : Colors.accentLight,
          borderColor: item.read ? Colors.border : Colors.accentPrimary,
          ...Shadow.sm,
        },
      ]}
      onPress={() => markRead(item.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, {
        backgroundColor: item.read ? Colors.bgBase : Colors.bgCard,
      }]}>
        <Text style={[styles.icon, { color: Colors.accentPrimary }]}>
          {TYPE_ICON[item.type] || '◎'}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: Colors.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.body, { color: Colors.textSecondary }]}>{item.body}</Text>
        <Text style={[styles.time, { color: Colors.textMuted }]}>{item.timeLabel}</Text>
      </View>
      {!item.read && (
        <View style={[styles.unreadDot, { backgroundColor: Colors.accentPrimary }]} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: Colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: Colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={[styles.markAll, { color: Colors.accentPrimary }]}>Mark all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><Loader /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No notifications yet</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

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
  markAll: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium },

  list: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: Radius.md, padding: Spacing.lg,
    borderWidth: 1, gap: Spacing.md,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  icon: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold },
  info: { flex: 1 },
  title: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, marginBottom: 3 },
  body: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, lineHeight: 20, marginBottom: 5 },
  time: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  emptyText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },
});
