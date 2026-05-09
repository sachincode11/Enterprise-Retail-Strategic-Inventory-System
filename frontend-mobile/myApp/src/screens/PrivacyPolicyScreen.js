import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.screen}>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>‹ Back</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Privacy Policy & Terms</Text>

        <Text style={styles.text}>
{`Effective 

Welcome to Invo6. This Privacy Policy and Terms & Conditions explain how we collect, use, and protect your information when you use our application.

-------------------------
PRIVACY POLICY
-------------------------

1. Information We Collect

We collect the following types of information to provide better services:

a) Personal Information:
- Name
- Email address
- Phone number
- Business details
- Login credentials

b) Business Data:
- Invoice records
- Sales data
- Customer information entered by users
- Inventory and stock data

c) Technical Data:
- Device information
- IP address
- App usage statistics
- Cookies and tracking data

2. How We Use Your Information

We use your data to:
- Provide and maintain the app
- Generate invoices and reports
- Improve user experience
- Monitor performance and detect issues
- Send important notifications (e.g., low stock alerts)

3. Data Storage and Security

We take reasonable security measures to protect your data. However:
- No system is 100% secure
- You are responsible for keeping your login credentials safe

We use encryption, secure APIs, and protected servers wherever possible.

4. Data Sharing

We DO NOT sell your personal data.

We may share data only in these cases:
- With your consent
- To comply with legal obligations
- To protect system security and prevent fraud

5. User-Generated Data

Invo6 allows you to input customer and business data. You are responsible for:
- Ensuring you have permission to store such data
- Managing the accuracy of entered data

6. Cookies and Tracking

We may use cookies or similar technologies to:
- Improve performance
- Analyze usage patterns

You can disable cookies in your device settings.

7. Data Retention

We retain your data as long as:
- Your account is active
- Needed for legal or operational purposes

You may request deletion of your data at any time.

8. Your Rights

You have the right to:
- Access your data
- Update or correct information
- Request deletion
- Withdraw consent

9. Third-Party Services

We may use third-party APIs (e.g., analytics, cloud storage). These services have their own privacy policies.

10. Changes to Policy

We may update this policy at any time. Continued use of the app means you accept the changes.

-------------------------
TERMS & CONDITIONS
-------------------------

1. Acceptance of Terms

By using Invo6, you agree to comply with these terms. If you do not agree, do not use the app.

2. Use of Service

You agree to:
- Use the app legally
- Provide accurate information
- Not misuse or hack the system

3. Account Responsibility

You are responsible for:
- Maintaining account security
- All activity under your account

4. Prohibited Activities

You must NOT:
- Use the app for illegal activities
- Attempt to reverse engineer the app
- Distribute harmful code or malware
- Access unauthorized data

5. Intellectual Property

All content, design, and features of Invo6 are owned by us and protected by law.

6. Service Availability

We aim to provide continuous service but:
- We do not guarantee uptime
- Maintenance or issues may occur

7. Limitation of Liability

Invo6 is provided "as is". We are not liable for:
- Data loss
- Business losses
- Service interruptions

8. Termination

We may suspend or terminate accounts if:
- Terms are violated
- Suspicious activity is detected

9. Updates and Modifications

We may update features or policies anytime without prior notice.

10. Governing Law

These terms are governed by applicable laws in your region.

-------------------------

If you have any questions, contact us at:
support@invo6.com

By using Invo6, you acknowledge that you have read and agreed to this Privacy Policy and Terms & Conditions.`}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#fff' },
  back: { fontSize: 18, marginBottom: 20, color: '#007AFF' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  text: { fontSize: 14, lineHeight: 22, color: '#333' },
});