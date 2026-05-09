import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatService } from '../services';
import { mockChatMessages, mockChatSuggestions } from '../mock/data';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';
import AppHeader from '../components/AppHeader';

const TypingIndicator = ({ Colors }) => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(d, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      )
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={typingStyles.row}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[typingStyles.dot, { backgroundColor: Colors.textMuted, transform: [{ translateY: d }] }]}
        />
      ))}
    </View>
  );
};

const typingStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

// Render **bold** markdown
const parseMarkdown = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontFamily: Typography.fontFamily.semiBold }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
};

export default function ChatScreen({ navigation }) {
  const { Colors } = useTheme();
  const [messages, setMessages] = useState(mockChatMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', text: content };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    scrollToBottom();

    try {
      const reply = await chatService.sendMessage(content, messages);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: reply,
      }]);
    } catch (_) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: "Sorry, I couldn't process that right now. Please try again.",
      }]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[msgStyles.row, isUser && msgStyles.rowUser]}>
        {!isUser && (
          <View style={[msgStyles.avatar, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
            <Text style={[msgStyles.avatarText, { color: Colors.accentPrimary }]}>AI</Text>
          </View>
        )}
        <View style={[
          msgStyles.bubble,
          isUser
            ? [msgStyles.bubbleUser, { backgroundColor: Colors.accentPrimary }]
            : [msgStyles.bubbleBot, { backgroundColor: Colors.bgCard, borderColor: Colors.border }],
        ]}>
          <Text style={[
            msgStyles.text,
            { color: isUser ? Colors.white : Colors.textPrimary },
          ]}>
            {parseMarkdown(item.text)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.bgCard, borderBottomColor: Colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: Colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: Colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: Colors.accentPrimary }]}>
            <Text style={styles.headerAvatarText}>AI</Text>
          </View>
          <View>
            <Text style={[styles.headerName, { color: Colors.textPrimary }]}>Invo6 Assistant</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.onlineText, { color: Colors.textMuted }]}>Online · AI-powered</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Quick suggestion chips */}
      <View style={[styles.suggestionsRow, { backgroundColor: Colors.bgCard, borderBottomColor: Colors.border }]}>
        {mockChatSuggestions.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, { backgroundColor: Colors.bgBase, borderColor: Colors.border }]}
            onPress={() => send(s)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, { color: Colors.textSecondary }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          renderItem={renderMessage}
          ListFooterComponent={isTyping ? (
            <View style={msgStyles.row}>
              <View style={[msgStyles.avatar, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
                <Text style={[msgStyles.avatarText, { color: Colors.accentPrimary }]}>AI</Text>
              </View>
              <View style={[msgStyles.bubble, msgStyles.bubbleBot, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
                <TypingIndicator Colors={Colors} />
              </View>
            </View>
          ) : null}
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: Colors.bgCard, borderTopColor: Colors.border }]}>
          <TextInput
            style={[styles.textInput, {
              backgroundColor: Colors.bgBase,
              borderColor: Colors.border,
              color: Colors.textPrimary,
            }]}
            placeholder="Ask about orders, deals, stores..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() ? Colors.accentPrimary : Colors.border },
            ]}
            onPress={() => send()}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const msgStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.md },
  rowUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  avatarText: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold },
  bubble: { maxWidth: '75%', borderRadius: Radius.lg, padding: Spacing.md + 2 },
  bubbleBot: { borderWidth: 1 },
  bubbleUser: {},
  text: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, lineHeight: 22 },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 22, lineHeight: 26 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: '#fff' },
  headerName: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular },

  suggestionsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    gap: Spacing.sm, borderBottomWidth: 1,
  },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5,
  },
  chipText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium },

  messageList: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1, minHeight: 44, maxHeight: 120,
    borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular,
    borderWidth: 1,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { fontSize: 18, color: '#fff', fontFamily: Typography.fontFamily.semiBold },
});
