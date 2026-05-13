import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const COLORS = {
  primary: "#871B17",
  primaryDark: "#6F1512",
  background: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#EFEFEF",
  lightGray: "#F3F4F6",
  textPrimary: "#1D1D1F",
  textSecondary: "#707070",
  timeText: "#A8A8A8",
  white: "#FFFFFF",
};

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
};

function getCurrentTime() {
  const now = new Date();

  return now.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Chatbot() {
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      from: "bot",
      text: "مرحبًا بك، كيف أقدر أساعدك اليوم؟",
      time: getCurrentTime(),
    },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = () => {
    const userText = input.trim();
    if (!userText) return;

    const userMessage: Message = {
      id: Date.now(),
      from: "user",
      text: userText,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    inputRef.current?.blur();
    Keyboard.dismiss();

    /*
      هنا لاحقًا تربطين موديل الذكاء الاصطناعي.
      بدل الرد التجريبي تحت، تحطين استدعاء الـ AI.
    */

    setTimeout(() => {
      const botReply: Message = {
        id: Date.now() + 1,
        from: "bot",
        text: "تم استلام رسالتك.",
        time: getCurrentTime(),
      };

      setMessages((prev) => [...prev, botReply]);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>المساعد</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.headerDivider} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            scrollRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.from === "user";

            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.userMessageRow : styles.botMessageRow,
                ]}
              >
                {!isUser ? (
                  <View style={styles.smallBotIcon}>
                    <Feather
                      name="message-circle"
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>
                ) : null}

                <View
                  style={[
                    styles.messageGroup,
                    isUser ? styles.userMessageGroup : styles.botMessageGroup,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isUser
                          ? styles.userMessageText
                          : styles.botMessageText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.messageTime,
                      isUser ? styles.userMessageTime : styles.botMessageTime,
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="اكتبي رسالتك..."
              placeholderTextColor="#A0A0A0"
              value={input}
              onChangeText={setInput}
              multiline
              textAlign="right"
              selectionColor={COLORS.primary}
              returnKeyType="send"
              blurOnSubmit={false}
            />

            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={sendMessage}
              activeOpacity={0.85}
              disabled={!input.trim()}
            >
              <Feather name="arrow-up" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    height: 60,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row-reverse",
    backgroundColor: COLORS.background,
  },

  headerSide: {
    width: 40,
    height: 40,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    letterSpacing: 0.2,
    lineHeight: 26,
    includeFontPadding: false,
  },

  headerDivider: {
    height: 1,
    backgroundColor: "#F2F2F2",
  },

  keyboardView: {
    flex: 1,
  },

  chatArea: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },

  messageRow: {
    width: "100%",
    marginBottom: 14,
  },

  userMessageRow: {
    alignItems: "flex-start",
  },

  botMessageRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },

  smallBotIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  messageGroup: {
    maxWidth: "78%",
  },

  userMessageGroup: {
    alignItems: "flex-start",
  },

  botMessageGroup: {
    alignItems: "flex-end",
  },

  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    borderWidth: 1,
  },

  botBubble: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.border,
    borderTopRightRadius: 6,
  },

  userBubble: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderTopLeftRadius: 6,
  },

  messageText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "right",
  },

  botMessageText: {
    color: COLORS.textPrimary,
  },

  userMessageText: {
    color: COLORS.white,
  },

  messageTime: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.timeText,
    marginTop: 4,
    opacity: 0.75,
  },

  userMessageTime: {
    textAlign: "left",
    marginLeft: 7,
  },

  botMessageTime: {
    textAlign: "right",
    marginRight: 7,
  },

  inputContainer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
    backgroundColor: COLORS.background,
  },

  inputRow: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: 7,
    paddingRight: 16,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 42,
    fontSize: 14.5,
    color: COLORS.textPrimary,
    fontWeight: "700",
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 8,
    textAlignVertical: "center",
  },

  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === "android" ? 0.16 : 0.22,
    shadowRadius: 8,
    elevation: 4,
  },

  sendBtnDisabled: {
    opacity: 0.45,
  },
});