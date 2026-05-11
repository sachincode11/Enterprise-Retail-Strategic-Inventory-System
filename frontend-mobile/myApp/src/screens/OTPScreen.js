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
  const { user, verifyOTP, resendOTP } = useAuth();
  const { formData, email: paramEmail, purpose: paramPurpose, autoResend } = route.params || {};
  const email = paramEmail || formData?.email || user?.email;
  const purpose = paramPurpose || formData?.purpose || 'email_verification';
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

  // Auto-resend if requested
  useEffect(() => {
    if (autoResend === 'true' || autoResend === true || formData?.autoResend) {
      handleResend();
    }
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
    const code = otp.join('');

    if (code.length < OTP_LENGTH) {
      return showToast('Please enter the full 6-digit code.');
    }

    try {
      setLoading(true);
      await verifyOTP({
        email,
        otp_code: code,
        purpose
      });
      showToast('Account verified!', 'success');
      
      // If user was already logged in (from Profile screen), go back
      if (user) {
        setTimeout(() => navigation.goBack(), 1500);
      }
    } catch (e) {
      showToast(e.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    try {
      await resendOTP({
        email,
        purpose
      });
      setCountdown(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
      showToast('New OTP sent to your email.', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to resend OTP.');
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
              {email || 'your account'}
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

          {/* Verification hint */}
          <Text style={[styles.hint, { color: Colors.textMuted }]}>
            Checking your email for the code...
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

  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  backIcon: { fontSize: 28, lineHeight: 32 },

  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl },
  title: { fontSize: 36, fontFamily: Typography.fontFamily.semiBold, lineHeight: 44, marginBottom: Spacing.md, letterSpacing: -0.5 },
  sub: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, lineHeight: 26, marginBottom: Spacing.xxxxl },

  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  otpBox: {
    width: 50, height: 64, borderRadius: Radius.lg, borderWidth: 2,
    fontSize: 24, fontFamily: Typography.fontFamily.semiBold,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },

  hint: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, marginBottom: Spacing.xxl, textAlign: 'center', opacity: 0.7 },
  verifyBtn: { width: '100%', height: 56, borderRadius: Radius.xl, marginBottom: Spacing.xl },

  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  resendText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular },
  resendLink: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, textDecorationLine: 'underline' },
});
