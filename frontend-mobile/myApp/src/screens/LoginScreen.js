import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import Button from '../components/Button';
import Input from '../components/Input';
import { Toast } from '../components/UI';
import { Typography, Spacing, Radius } from '../constants/theme';
import AppHeader from '../components/AppHeader';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { Colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const showToast = (message, type = 'error') => setToast({ visible: true, message, type });

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) return showToast('Please enter your email address.');
    if (!password) return showToast('Please enter your password.');

    try {
      setLoading(true);

      await login({
        email: cleanEmail,
        password,
      });

    } catch (e) {
      if (e.status === 403 && e.message.toLowerCase().includes('not verified')) {
        showToast('Your account is not verified. Redirecting...', 'success');
        setTimeout(() => {
          navigation.navigate('OTP', { 
            formData: { 
              email: cleanEmail, 
              purpose: 'email_verification',
              autoResend: true 
            } 
          });
        }, 1500);
      } else {
        showToast(e.message);
      }
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
           
          </View>
          <AppHeader />
          {/* Welcome */}
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeTitle, { color: Colors.textPrimary }]}>
              Welcome{'\n'}back.
            </Text>
            <Text style={[styles.welcomeSub, { color: Colors.textSecondary }]}>
              Sign in to your account
            </Text>
          </View>

          {/* Form */}
          <Input
            label="EMAIL ADDRESS"
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Input
            label="PASSWORD"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.forgotRow}>
            <Text style={[styles.forgotText, { color: Colors.textSecondary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.signInBtn}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: Colors.border }]} />
            <Text style={[styles.dividerText, { color: Colors.textMuted }]}>or continue with</Text>
            <View style={[styles.divider, { backgroundColor: Colors.border }]} />
          </View>

          {/* Google Sign-In (UI ready, backend placeholder) */}
          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: Colors.border, backgroundColor: Colors.bgCard }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.googleG, { color: Colors.textPrimary }]}>G</Text>
            <Text style={[styles.googleText, { color: Colors.textPrimary }]}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: Colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: Colors.textPrimary }]}>Register</Text>
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
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xl, marginBottom: Spacing.xxxl,
  },
  brand: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold },
  infoBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  infoBtnText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },

  welcomeSection: { marginBottom: Spacing.xxxl },
  welcomeTitle: { fontSize: 36, fontFamily: Typography.fontFamily.semiBold, lineHeight: 44, marginBottom: Spacing.sm },
  welcomeSub: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular },

  forgotRow: { alignItems: 'flex-end', marginTop: -Spacing.sm, marginBottom: Spacing.xl },
  forgotText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium },

  signInBtn: { width: '100%', marginBottom: Spacing.xl },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  divider: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: Spacing.md, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1.5, marginBottom: Spacing.xl,
  },
  googleG: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold },
  googleText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium },

  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular },
  registerLink: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },
});
