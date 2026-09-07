import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { COLORS } from '../../theme/colors';

export default function ContactSupport() {
  const navigation = useNavigation();
  useHideTabBar(navigation);
  const insets = useSafeAreaInsets();

  const scrollRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const canSend = useMemo(() => inputMessage.trim().length > 0, [inputMessage]);

  const handleSend = () => {
    const text = inputMessage.trim();
    if (!text) return;

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
      },
    ]);
    setInputMessage('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ArrowLeft size={22} color="#000" />
              </TouchableOpacity>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title}>Contact Support</Text>
                <Text style={styles.subtitle}>We usually reply in a few time</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.chatArea}
              contentContainerStyle={styles.chat}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyTitle}>Start a conversation</Text>
                  <Text style={styles.emptyText}>
                    Send your issue and our support team will reply shortly.
                  </Text>
                </View>
              ) : (
                messages.map(item => (
                  <View key={item.id} style={styles.bubbleRow}>
                    <View style={styles.rightBubble}>
                      <Text style={styles.rightBubbleText}>{item.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
              <TextInput
                placeholder="Type Message..."
                style={styles.input}
                value={inputMessage}
                onChangeText={setInputMessage}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                placeholderTextColor="#9CA3AF"
                multiline
                blurOnSubmit={false}
                maxLength={600}
              />
              <TouchableOpacity
                style={[styles.send, !canSend && styles.sendDisabled]}
                onPress={handleSend}
                disabled={!canSend}
                activeOpacity={0.8}
              >
                <Send color="#FFFFFF" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF3',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    marginTop: 2,
    fontSize: FONT_SIZES.xs,
    color: '#6B7280',
  },
  chatArea: {
    flex: 1,
  },
  chat: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    justifyContent: 'flex-end',
  },
  emptyStateCard: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  rightBubble: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 16,
    alignSelf: 'flex-end',
    marginVertical: 5,
    maxWidth: '82%',
  },
  bubbleRow: {
    width: '100%',
  },
  rightBubbleText: {
    color: '#fff',
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderColor: '#ECEFF3',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: 14,
    paddingBottom: 14,
    minHeight: 52,
    maxHeight: 120,
    fontSize: FONT_SIZES.sm,
    color: '#111827',
  },
  send: {
    marginLeft: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
  },
  sendDisabled: {
    opacity: 0.45,
  },
});
