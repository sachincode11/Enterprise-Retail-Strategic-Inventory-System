import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Input from '../components/Input';
import { Toast } from '../components/UI';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { Typography, Spacing, Radius } from '../constants/theme';

export default function RegisterScreen({ navigation }) {
  const { Colors } = useTheme();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const update = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const showToast = (msg, type = 'error') => setToast({ visible: true, message: msg, type });


  
  const handleContinue = async () => {
    if (!form.fullName.trim()) return showToast('Please enter your full name.');

    //  Email validation
    if (!form.email.trim()) return showToast('Please enter your email address.');
    if (!form.email.endsWith('@gmail.com')) {
      return showToast('Email must be a valid @gmail.com address.');
    }

    //  Phone validation
    if (!form.phone.trim()) return showToast('Please enter your phone number.');

    const phoneRegex = /^9\d{9}$/; // starts with 9 and total 10 digits
    if (!phoneRegex.test(form.phone)) {
      return showToast('Phone must be 10 digits and start with 9.');
    }

    //  Password validation
    if (form.password.length < 8) {
      return showToast('Password must be at least 8 characters.');
    }

    if (form.password !== form.confirmPassword) {
      return showToast('Passwords do not match.');
    }

    if (!agreed) {
      return showToast('Please agree to Terms & Privacy Policy.');
    }

    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      showToast('Registration successful! Check your email for OTP.', 'success');
      
      // Navigate to OTP screen with form data
      setTimeout(() => {
        navigation.navigate('OTP', { 
          formData: { ...form, purpose: 'email_verification' } 
        });
      }, 1500);
    } catch (e) {
      showToast(e.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgCard }]} edges={['top']}>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backBtn, { borderColor: Colors.border }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.backIcon, { color: Colors.textPrimary }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.brand, { color: Colors.textPrimary }]}>Invo6</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepBar, { backgroundColor: Colors.accentPrimary }]} />
            <View style={[styles.stepBar, { backgroundColor: Colors.border }]} />
          </View>
          <Text style={[styles.stepLabel, { color: Colors.textMuted }]}>STEP 1 OF 2</Text>

          {/* Title */}
          <Text style={[styles.title, { color: Colors.textPrimary }]}>
            Create{'\n'}account.
          </Text>

          {/* Form */}
          <Input
            label="FULL NAME"
            placeholder="Your full name"
            value={form.fullName}
            onChangeText={update('fullName')}
            autoCapitalize="words"
          />
          <Input
            label="EMAIL ADDRESS"
            placeholder="you@email.com"
            value={form.email}
            onChangeText={update('email')}
            keyboardType="email-address"
          />
          <Input
            label="PHONE NUMBER"
            placeholder="+977 98XXXXXXXXX"
            value={form.phone}
            onChangeText={update('phone')}
            keyboardType="phone-pad"
          />
          <Input
            label="PASSWORD"
            placeholder="Min 8 characters"
            value={form.password}
            onChangeText={update('password')}
            secureTextEntry
          />
          <Input
            label="CONFIRM PASSWORD"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChangeText={update('confirmPassword')}
            secureTextEntry
          />

          {/* Terms */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreed(v => !v)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.checkbox,
              { borderColor: agreed ? Colors.accentPrimary : Colors.border },
              agreed && { backgroundColor: Colors.accentPrimary },
            ]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            
            <Text style={[styles.termsText, { color: Colors.textSecondary }]}>
            I agree to{' '}
            <Text
              style={[styles.termsLink, { color: Colors.textPrimary }]}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              Terms of Service
            </Text>
            {' & '}
            <Text
              style={[styles.termsLink, { color: Colors.textPrimary }]}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              Privacy Policy
            </Text>
          </Text>
          </TouchableOpacity>
          
          <Button
            title="Continue to Verification"
            onPress={handleContinue}
            loading={loading}
            style={styles.btn}
          />

          {/* Sign In link */}
          <View style={styles.signInRow}>
            <Text style={[styles.signInText, { color: Colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.signInLink, { color: Colors.textPrimary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Spacing.xl, marginBottom: Spacing.xl,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 22, lineHeight: 26 },
  brand: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold },

  stepRow: { flexDirection: 'row', gap: 4, height: 3, marginBottom: Spacing.sm },
  stepBar: { flex: 1, borderRadius: Radius.full, height: 3 },
  stepLabel: {
    fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 0.8, marginBottom: Spacing.xl,
  },

  title: { fontSize: 34, fontFamily: Typography.fontFamily.semiBold, lineHeight: 42, marginBottom: Spacing.xxl },

  termsRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: Spacing.sm, marginBottom: Spacing.xl, marginTop: Spacing.sm,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkmark: { color: '#fff', fontSize: 12, fontFamily: Typography.fontFamily.semiBold },
  termsText: { flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, lineHeight: 20 },
  termsLink: { fontFamily: Typography.fontFamily.semiBold },

  btn: { width: '100%', marginBottom: Spacing.xl },
  signInRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signInText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular },
  signInLink: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },
});
