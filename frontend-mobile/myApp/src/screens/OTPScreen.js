import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import { Toast } from '../components/UI';
import { Typography, Spacing, Radius } from '../constants/theme';

const OTP_LENGTH = 6;

export default function OTPScreen({ navigation, route }) {
  const { Colors } = useTheme();
  const { register } = useAuth();
  const { formData } = route.params || {};
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
  const inputs = useRef([]);

  const showToast = (msg, type = 'error') => setToast({ visible: true, message: msg, type });

  // Countdown timer for OTP resend
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => c > 0 ? c - 1 : 0);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (val, index) => {
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1); // only last char
    setOtp(newOtp);
    if (val && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join(''); //  FIX

    if (code.length < OTP_LENGTH) {
      return showToast('Please enter the full 6-digit code.');
    }

    //  DEMO MODE (before backend)
    const DEMO_OTP = '123456';

    if (code !== DEMO_OTP) {
      return showToast('Invalid OTP code.');
    }

    try {
      setLoading(true);
      await register(formData);
      showToast('Account verified!', 'success');
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(60);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
    showToast('New OTP sent to your email.', 'success');
    // Replace with: await authService.resendOTP({ email: formData.email })
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: Colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backIcon, { color: Colors.textPrimary }]}>‹</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>
            Verify your{'\n'}account
          </Text>
          <Text style={[styles.sub, { color: Colors.textSecondary }]}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={{ color: Colors.textPrimary, fontFamily: Typography.fontFamily.semiBold }}>
              {formData?.email || 'your email'}
            </Text>
          </Text>

          {/* OTP Inputs */}
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => (inputs.current[i] = ref)}
                style={[
                  styles.otpBox,
                  {
                    backgroundColor: Colors.bgBase,
                    borderColor: digit ? Colors.accentPrimary : Colors.border,
                    color: Colors.textPrimary,
                  },
                ]}
                value={digit}
                onChangeText={val => handleChange(val, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Demo hint */}
          <Text style={[styles.hint, { color: Colors.textMuted }]}>
            Demo code: 123456
          </Text>

          <Button
            title="Verify Account"
            onPress={handleVerify}
            loading={loading}
            style={styles.verifyBtn}
          />

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={[styles.resendText, { color: Colors.textMuted }]}>
              Didn't receive a code?{' '}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
              <Text style={[
                styles.resendLink,
                { color: countdown > 0 ? Colors.textMuted : Colors.accentPrimary },
              ]}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },

  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 22, lineHeight: 26 },

  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl },
  title: { fontSize: 34, fontFamily: Typography.fontFamily.semiBold, lineHeight: 42, marginBottom: Spacing.md },
  sub: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, lineHeight: 24, marginBottom: Spacing.xxxl },

  otpRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  otpBox: {
    flex: 1, height: 56, borderRadius: Radius.md, borderWidth: 1.5,
    fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold,
  },

  hint: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, marginBottom: Spacing.xl, textAlign: 'center' },
  verifyBtn: { width: '100%', marginBottom: Spacing.xl },

  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular },
  resendLink: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },
});
