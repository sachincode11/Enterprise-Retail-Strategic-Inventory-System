import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { userService } from '../services';
import Input from '../components/Input';
import Button from '../components/Button';
import { Toast } from '../components/UI';
import { Typography, Spacing, Radius } from '../constants/theme';
import { useFocusEffect } from '@react-navigation/native';

export default function SecurityScreen({ navigation }) {
  const { user } = useAuth();
  const { Colors } = useTheme();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const update = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const showToast = (msg, type = 'success') => setToast({ visible: true, message: msg, type });

  const { refreshUser } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
    }, [])
  );

  const handleSave = async () => {
    if (!form.currentPassword) return showToast('Enter your current password.', 'error');
    if (form.newPassword.length < 8) return showToast('New password must be at least 8 characters.', 'error');
    if (form.newPassword !== form.confirmPassword) return showToast('Passwords do not match.', 'error');
    try {
      setSaving(true);
      await userService.updatePassword(user?.id, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      showToast('Password updated successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setSaving(false);
    }
  };
  const handleForgotPassword = async () => {
    try {
      setSaving(true);

      await userService.forgotPassword(user?.email);

      showToast('Temporary password sent to your email.');
    } catch (e) {
      showToast('Failed to send reset email.', 'error');
    } finally {
      setSaving(false);
    }
  };
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: Colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: Colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Security & Password</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account info row */}
        <View style={[styles.accountRow, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
          <View>
            <Text style={[styles.accountLabel, { color: Colors.textMuted }]}>ACCOUNT</Text>
            <Text style={[styles.accountEmail, { color: Colors.textPrimary }]}>{user?.email}</Text>
          </View>
          <View style={[
            styles.verifiedBadge, 
            { backgroundColor: user?.verified ? '#f0fdf4' : '#fff7ed' }
          ]}>
            <Text style={[
              styles.verifiedText, 
              { color: user?.verified ? '#166534' : '#9a3412' }
            ]}>
              {user?.verified ? 'Verified' : 'Unverified'}
            </Text>
          </View>
        </View>

        {/* Section title */}
        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>CHANGE PASSWORD</Text>

        <Input
          label="CURRENT PASSWORD"
          placeholder="Enter current password"
          value={form.currentPassword}
          onChangeText={update('currentPassword')}
          secureTextEntry
        />
        <Input
          label="NEW PASSWORD"
          placeholder="Min 8 characters"
          value={form.newPassword}
          onChangeText={update('newPassword')}
          secureTextEntry
        />
        <Input
          label="CONFIRM NEW PASSWORD"
          placeholder="Re-enter new password"
          value={form.confirmPassword}
          onChangeText={update('confirmPassword')}
          secureTextEntry
        />

        {/* Password strength hint */}
        <View style={[styles.hintBox, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
          <Text style={[styles.hintTitle, { color: Colors.textPrimary }]}>Password requirements</Text>
          {[
            'At least 8 characters long',
            'Mix of uppercase and lowercase letters',
            'Include at least one number',
          ].map((hint, i) => (
            <View key={i} style={styles.hintRow}>
              <View style={[styles.hintDot, { backgroundColor: Colors.textMuted }]} />
              <Text style={[styles.hintText, { color: Colors.textSecondary }]}>{hint}</Text>
            </View>
          ))}
        </View>

        <Button
          title="Update Password"
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />

        {/* Forgot password link */}
        <TouchableOpacity style={styles.forgotRow}
        onPress={handleForgotPassword}>
          <Text style={[styles.forgotText, { color: Colors.accentPrimary }]}>
            Forgot current password? Reset via email
          </Text>
        </TouchableOpacity>
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

  accountRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.xl,
  },
  accountLabel: { fontSize: 10, fontFamily: Typography.fontFamily.semiBold, letterSpacing: 0.8, marginBottom: 3 },
  accountEmail: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },
  verifiedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  verifiedText: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: '#166534' },

  sectionLabel: {
    fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 1, marginBottom: Spacing.lg,
  },

  hintBox: {
    padding: Spacing.lg, borderRadius: Radius.md, borderWidth: 1,
    marginBottom: Spacing.xl, marginTop: Spacing.sm,
  },
  hintTitle: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, marginBottom: Spacing.sm },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  hintDot: { width: 4, height: 4, borderRadius: 2 },
  hintText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular },

  saveBtn: { width: '100%', marginTop: Spacing.sm },
  forgotRow: { alignItems: 'center', marginTop: Spacing.lg },
  forgotText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium },
});
