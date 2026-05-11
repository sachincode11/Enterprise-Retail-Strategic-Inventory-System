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
import { Toast, Avatar } from '../components/UI';
import { Typography, Spacing, Radius } from '../constants/theme';


export default function PersonalInfoScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { Colors } = useTheme();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Load latest data on mount
  React.useEffect(() => {
    if (refreshUser) {
      refreshUser();
    }
  }, []);

  // Sync form with user data when it changes (e.g. after refresh or login)
  React.useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const update = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const showToast = (message, type = 'success') => setToast({ visible: true, message, type });

  const handleSave = async () => {
    if (!form.fullName.trim()) return showToast('Name cannot be empty.', 'error');
    const phoneRegex = /^9\d{9}$/;

    if (!phoneRegex.test(form.phone)) {
      return showToast('Phone must be 10 digits and start with 9.', 'error');
    }
    try {
      setSaving(true);
      // API-ready: replace with real endpoint
      await userService.updateProfile(user?.id, {
        fullName: form.fullName,
        phone: form.phone,
      });
      if (refreshUser) await refreshUser();
      showToast('Profile updated successfully!');
    } catch (_) {
      showToast('Failed to update profile.', 'error');
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

      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: Colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: Colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Personal Information</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: Colors.border }]}>
            <Avatar initials={user?.avatar || 'U'} size={72} />
          </View>
       
        </View>

        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>PROFILE DETAILS</Text>

        <Input
          label="FULL NAME"
          placeholder="Your full name"
          value={form.fullName}
          onChangeText={update('fullName')}
          autoCapitalize="words"
        />
        <Input
          label="EMAIL ADDRESS (unchangeable)"
          placeholder="you@email.com"
          value={form.email}
          editable={false}   
          keyboardType="email-address"
        />
        <Input
          label="PHONE NUMBER"
          placeholder=" 98XXXXXXXXX"
          value={form.phone}
          onChangeText={update('phone')}
          keyboardType="phone-pad"
        />

        {/* Verified badge */}
        {user?.verified && (
          <View style={[styles.verifiedBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <View style={[styles.verifiedDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.verifiedText, { color: '#166534' }]}>
              Account verified — email and phone confirmed
            </Text>
          </View>
        )}

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
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

  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.sm },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  changePhoto: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },

  sectionLabel: {
    fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 1, marginBottom: Spacing.lg,
  },

  verifiedBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  verifiedDot: { width: 8, height: 8, borderRadius: 4 },
  verifiedText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, flex: 1 },

  saveBtn: { width: '100%', marginTop: Spacing.sm },
});
