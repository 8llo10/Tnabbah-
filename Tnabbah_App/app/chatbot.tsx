import { Feather, Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../providers/AuthProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { useCars } from "../providers/CarsProvider";
import { useAppSettings } from "../providers/AppSettingsProvider";
import {
  Alexandria_400Regular,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  useFonts,
} from "@expo-google-fonts/alexandria";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { Animated, Alert } from "react-native";

const CHATBOT_API_URL = "http://207.180.244.27:4010/chat";

const SESSION_ID = `session-${Date.now()}-${Math.random()
  .toString(36)
  .slice(2, 10)}`;


const CHAT_STORAGE_KEY = "tnabbah_chat_messages";

const makeSessionsKey = (userId?: string | null) =>
  `tnabbah_chat_sessions_${userId ?? "anon"}`;

const makeMessagesKey = (userId: string | null | undefined, sessionId: string) =>
  `tnabbah_chat_messages_${userId ?? "anon"}_${sessionId}`;

const FONT_REGULAR = "Alexandria_400Regular";
const FONT_SEMIBOLD = "Alexandria_600SemiBold";
const FONT_BOLD = "Alexandria_700Bold";

const LIGHT_COLORS = {
  primary: "#871B17",
  primaryDark: "#6F1512",
  background: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#EFEFEF",
  lightGray: "#F3F4F6",
  textPrimary: "#1D1D1F",
  textSecondary: "#707070",
  timeText: "#A8A8A8",
  placeholder: "#A0A0A0",
  backIcon: "#5F5F5F",
  white: "#FFFFFF",
  shadow: "#000000",
  inputShadowOpacity: 0.03,
  sendShadowOpacity: Platform.OS === "android" ? 0.16 : 0.22,
};

const DARK_COLORS = {
  primary: "#B63A34",
  primaryDark: "#871B17",
  primaryLight: "#C8564E",
  background: "#151515",
  surface: "#202020",
  border: "#383838",
  lightGray: "#292929",
  textPrimary: "#FFFFFF",
  textSecondary: "#C7C7C7",
  timeText: "#A8A8A8",
  placeholder: "#8E8E8E",
  backIcon: "#F2F2F2",
  white: "#FFFFFF",
  shadow: "#000000",
  inputShadowOpacity: 0,
  sendShadowOpacity: 0.16,
};

type AppColors = typeof LIGHT_COLORS & Partial<typeof DARK_COLORS>;

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
};

function getCurrentTime(language: "AR" | "EN") {
  const now = new Date();

  return now.toLocaleTimeString(
    language === "AR" ? "ar-SA-u-nu-arab" : "en-US-u-nu-latn",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export default function Chatbot() {
  const { session, profile } = useAuth();
  const userId = session?.user?.id ?? null;
  const { t, isArabic, language } = useLanguage();
  const {
    activeCarId,
    connectedCarId,
    userCars,
  } = useCars();
  const { darkModeEnabled } = useAppSettings();
  const { width } = useWindowDimensions();

  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
  });

  const COLORS = darkModeEnabled ? DARK_COLORS : LIGHT_COLORS;
  const styles = useMemo(() => createStyles(COLORS, isArabic), [COLORS, isArabic]);
  const params = useLocalSearchParams<{ carId?: string }>();
  const incomingCarId = params.carId;

  const effectiveCarId = incomingCarId || activeCarId || null;

  const currentCar =
    userCars.find((car) => car.car_id === effectiveCarId) || null;

  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const welcomeMessageId = useRef(Date.now());

  const [messages, setMessages] = useState<Message[]>([
    {
      id: welcomeMessageId.current,
      from: "bot",
      text: t.chatWelcome,
      time: getCurrentTime(language),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeSessionId, setActiveSessionId] = useState(SESSION_ID);
  const [chatSessions, setChatSessions] = useState<any[]>([
    {
      id: SESSION_ID,
      title: "محادثة جديدة",
      updatedAt: Date.now(),
    },
  ]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const drawerAnim = useRef(
    new Animated.Value(isArabic ? -320 : 320)
  ).current;

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: sidebarOpen
        ? 0
        : isArabic
          ? -320
          : 320,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(makeSessionsKey(userId)).then((saved) => {
      if (!saved) {
        const newId = `session-${Date.now()}`;
        setChatSessions([
          { id: newId, title: "محادثة جديدة", updatedAt: Date.now() },
        ]);
        setActiveSessionId(newId);
        return;
      }

      try {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length) {
          setChatSessions(parsed);
          setActiveSessionId(parsed[0].id);
        }
      } catch { }
    });
  }, [userId]);

  useEffect(() => {
    AsyncStorage.getItem(
      makeMessagesKey(userId, activeSessionId)
    ).then((saved) => {

      if (!saved) {
        setMessages([
          {
            id: Date.now(),
            from: "bot",
            text: t.chatWelcome,
            time: getCurrentTime(language),
          },
        ]);

        return;
      }

      try {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch { }
    });
  }, [userId, activeSessionId]);

  useEffect(() => {
    AsyncStorage.setItem(
      makeMessagesKey(userId, activeSessionId),
      JSON.stringify(messages)
    );
  }, [messages, userId, activeSessionId]);

  useEffect(() => {
    AsyncStorage.setItem(
      makeSessionsKey(userId),
      JSON.stringify(chatSessions)
    );
  }, [chatSessions, userId]);
  /* 
    useEffect(() => {
      AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);
   */
  const isWide = width >= 760;
  const textAlign = isArabic ? "right" : "left";
  const rowDirection = isArabic ? "row-reverse" : "row";
  const backIconName = isArabic ? "chevron-forward" : "chevron-back";
  const userAlign = isArabic ? "flex-start" : "flex-end";
  const botAlign = isArabic ? "flex-end" : "flex-start";
  const userBubbleTail = isArabic
    ? styles.userBubbleArabic
    : styles.userBubbleEnglish;
  const botBubbleTail = isArabic
    ? styles.botBubbleArabic
    : styles.botBubbleEnglish;

  useEffect(() => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === welcomeMessageId.current
          ? {
            ...msg,
            text: t.chatWelcome,
            time: getCurrentTime(language),
          }
          : msg,
      ),
    );
  }, [t.chatWelcome, language]);

  const fetchBotReply = async (userText: string): Promise<string> => {
    try {
      if (!session?.user?.id) {
        return t.chatLoginRequired;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let res: Response;

      try {
        res = await fetch(CHATBOT_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            message: userText,

            userId: session?.user?.id,

            carId: effectiveCarId,

            userCarId: currentCar?.id ?? null,

            connectedCarId,

            currentCar,

            userCars,

            email: session?.user?.email,

            fullName: profile?.full_name ?? null,

            sessionId: activeSessionId,

            language,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const raw = (await res.text()).trim();

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}${raw ? `: ${raw.slice(0, 120)}` : ""}`,
        );
      }

      if (!raw) {
        return t.chatNoAssistantReply;
      }

      let data: any = null;

      try {
        data = JSON.parse(raw);
      } catch {
        return raw;
      }

      const pickReply = (obj: any): string | null => {
        if (!obj) return null;
        if (typeof obj === "string") return obj;

        return (
          obj?.output ??
          obj?.response ??
          obj?.reply ??
          obj?.text ??
          obj?.message ??
          obj?.answer ??
          obj?.data?.output ??
          obj?.data?.text ??
          null
        );
      };

      const reply = Array.isArray(data) ? pickReply(data[0]) : pickReply(data);

      if (typeof reply === "string" && reply.trim()) return reply;

      return JSON.stringify(data);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return t.chatTimeout;
      }

      if (err?.message?.includes("Network request failed")) {
        return t.chatNetworkError;
      }

      return `${t.chatConnectionError} ${err?.message ?? ""}`.trim();
    }
  };

  const sendQuickMessage = async (text: string) => {
    if (isLoading) return;

    setInput(text);

    const userMessage: Message = {
      id: Date.now(),
      from: "user",
      text,
      time: getCurrentTime(language),
    };

    setMessages((prev) => [...prev, userMessage]);

    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
            ...s,
            title:
              s.title === "محادثة جديدة"
                ? text.slice(0, 30)
                : s.title,
            updatedAt: Date.now(),
          }
          : s
      )
    );
    setIsLoading(true);

    const replyText = await fetchBotReply(text);

    const botReply: Message = {
      id: Date.now() + 1,
      from: "bot",
      text: replyText,
      time: getCurrentTime(language),
    };

    setMessages((prev) => [...prev, botReply]);
    setInput("");
    setIsLoading(false);
  };

  const sendMessage = async () => {
    const userText = input.trim();
    if (!userText || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      from: "user",
      text: userText,
      time: getCurrentTime(language),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
            ...s,
            title:
              s.title === "محادثة جديدة"
                ? userText.slice(0, 30)
                : s.title,
            updatedAt: Date.now(),
          }
          : s
      )
    );
    setInput("");
    setIsLoading(true);

    inputRef.current?.blur();
    Keyboard.dismiss();

    const replyText = await fetchBotReply(userText);

    const botReply: Message = {
      id: Date.now() + 1,
      from: "bot",
      text: replyText,
      time: getCurrentTime(language),
    };

    setMessages((prev) => [...prev, botReply]);
    setIsLoading(false);
  };

  const clearChat = () => {
    Alert.alert(
      "حذف المحادثة",
      "تبغين تحذفين سجل المحادثة؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(makeMessagesKey(userId, activeSessionId)); setMessages([
              {
                id: Date.now(),
                from: "bot",
                text: t.chatWelcome,
                time: getCurrentTime(language),
              },
            ]);
          },
        },
      ],
    );
  };

  const shareChat = async () => {
    const text = messages
      .map((m) => `${m.from === "user" ? "أنا" : "مساعد تنبّه"}: ${m.text}`)
      .join("\n\n");

    await Clipboard.setStringAsync(text);
    Alert.alert("تم النسخ", "تم نسخ المحادثة، تقدرين تشاركينها الآن.");
  };

  const goBackHome = () => {
    router.replace("/(tabs)/home" as any);
  };

  if (!fontsLoaded) return null;

  const renderAssistantIcon = () => (
    <View style={styles.smallBotIcon}>
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={18}
        color={COLORS.primary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <StatusBar
        barStyle={darkModeEnabled ? "light-content" : "dark-content"}
        backgroundColor={COLORS.background}
      />

      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={[
            styles.backButton,
            { alignItems: isArabic ? "flex-end" : "flex-start" },
          ]}
          onPress={goBackHome}
        >
          <Ionicons name={backIconName} size={28} color={COLORS.backIcon} />
        </TouchableOpacity>

        <Text allowFontScaling={false} style={styles.headerTitle}>
          {t.chatTitle}
        </Text>

        <TouchableOpacity
          style={styles.headerMenuButton}
          onPress={() => setSidebarOpen(true)}
        >
          <Feather
            name="menu"
            size={24}
            color={COLORS.backIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      {/*  <View
        pointerEvents={sidebarOpen ? "auto" : "none"}
        style={styles.sidebarOverlay}
      >
        <TouchableOpacity
          style={[
            styles.sidebarBackdrop,
            { opacity: sidebarOpen ? 1 : 0 },
          ]}
          onPress={() => setSidebarOpen(false)}
          activeOpacity={1}
        />

        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: drawerAnim }],
            },
          ]}
        >
          <Text allowFontScaling={false} style={styles.sidebarTitle}>
            محادثات تنبّه
          </Text>

          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={() => {
              const newId = `session-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`;

              setChatSessions((prev) => [
                {
                  id: newId,
                  title: "محادثة جديدة",
                  updatedAt: Date.now(),
                },
                ...prev,
              ]);

              setActiveSessionId(newId);
              setSidebarOpen(false);
            }}
          >
            <View style={styles.sidebarRow}>
              <Feather name="edit-3" size={17} color={COLORS.primary} />
              <Text allowFontScaling={false} style={styles.newChatText}>
                محادثة جديدة
              </Text>
            </View>
          </TouchableOpacity>

          {chatSessions.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.sidebarItem,
                s.id === activeSessionId && styles.sidebarItemActive,
              ]}
              onPress={() => {
                setActiveSessionId(s.id);
                setSidebarOpen(false);
              }}
            >
              <View style={styles.sidebarRow}>
                <Feather name="message-square" size={16} color={COLORS.textSecondary} />
                <Text allowFontScaling={false} style={styles.sidebarItemTitle} numberOfLines={1}>
                  {s.title}
                </Text>

                <TouchableOpacity
                  onPress={async () => {
                    await AsyncStorage.removeItem(makeMessagesKey(userId, s.id));

                    await fetch(`${CHATBOT_API_URL.replace("/chat", "")}/chat/session`, {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        userId: session?.user?.id,
                        sessionId: s.id,
                      }),
                    });

                    const remaining = chatSessions.filter((x) => x.id !== s.id);
                    setChatSessions(remaining);

                    if (s.id === activeSessionId) {
                      const next = remaining[0];

                      if (next) {
                        setActiveSessionId(next.id);
                      } else {
                        const newId = `session-${Date.now()}`;
                        setChatSessions([{ id: newId, title: "محادثة جديدة", updatedAt: Date.now() }]);
                        setActiveSessionId(newId);
                      }
                    }
                  }}
                >
                  <Feather name="trash-2" size={15} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.sidebarItem} onPress={shareChat}>
            <Text allowFontScaling={false} style={styles.sidebarItemTitle}>
              مشاركة المحادثة
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarDanger} onPress={clearChat}>
            <Text allowFontScaling={false} style={styles.sidebarDangerText}>
              حذف المحادثة
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View> */}

      <View
        pointerEvents={sidebarOpen ? "auto" : "none"}
        style={styles.sidebarOverlay}
      >
        <TouchableOpacity
          style={[
            styles.sidebarBackdrop,
            { opacity: sidebarOpen ? 1 : 0 },
          ]}
          onPress={() => setSidebarOpen(false)}
          activeOpacity={1}
        />

        <Animated.View
          style={[
            styles.sidebar,
            isArabic ? styles.sidebarArabic : styles.sidebarEnglish,
            {
              transform: [{ translateX: drawerAnim }],
            },
          ]}
        >
          <Text allowFontScaling={false} style={styles.sidebarTitle}>
            محادثات تنبّه
          </Text>

          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={() => {
              const newId = `session-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`;

              setChatSessions((prev) => [
                { id: newId, title: "محادثة جديدة", updatedAt: Date.now() },
                ...prev,
              ]);

              setActiveSessionId(newId);
              setSidebarOpen(false);
            }}
          >
            <View style={styles.sidebarRow}>
              <Feather name="edit-3" size={17} color={COLORS.primary} />
              <Text allowFontScaling={false} style={styles.newChatText}>
                محادثة جديدة
              </Text>
            </View>
          </TouchableOpacity>

          {chatSessions.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.sidebarItem,
                s.id === activeSessionId && styles.sidebarItemActive,
              ]}
              onPress={() => {
                setActiveSessionId(s.id);
                setSidebarOpen(false);
              }}
            >
              <View style={styles.sidebarRow}>
                <Feather name="message-square" size={16} color={COLORS.textSecondary} />

                <Text
                  allowFontScaling={false}
                  style={styles.sidebarItemTitle}
                  numberOfLines={1}
                >
                  {s.title}
                </Text>

                <TouchableOpacity
                  onPress={async () => {
                    await AsyncStorage.removeItem(makeMessagesKey(userId, s.id));

                    await fetch(`${CHATBOT_API_URL.replace("/chat", "")}/chat/session`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: session?.user?.id,
                        sessionId: s.id,
                      }),
                    });

                    const remaining = chatSessions.filter((x) => x.id !== s.id);
                    setChatSessions(remaining);

                    if (s.id === activeSessionId) {
                      const next = remaining[0];
                      if (next) {
                        setActiveSessionId(next.id);
                      } else {
                        const newId = `session-${Date.now()}`;
                        setChatSessions([
                          { id: newId, title: "محادثة جديدة", updatedAt: Date.now() },
                        ]);
                        setActiveSessionId(newId);
                      }
                    }
                  }}
                >
                  <Feather name="trash-2" size={15} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.sidebarItem} onPress={shareChat}>
            <View style={styles.sidebarRow}>
              <Feather name="share-2" size={16} color={COLORS.textSecondary} />
              <Text allowFontScaling={false} style={styles.sidebarItemTitle}>
                مشاركة المحادثة
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarDanger} onPress={clearChat}>
            <View style={styles.sidebarRow}>
              <Feather name="trash" size={16} color={COLORS.primary} />
              <Text allowFontScaling={false} style={styles.sidebarDangerText}>
                حذف المحادثة الحالية
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View pointerEvents="none" style={styles.scanBackground}>
        <Animated.View style={[styles.scanCircleBig, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.scanCircleSmall, { opacity: fadeAnim }]} />
        <View style={styles.scanLine} />
      </View>

      <KeyboardAvoidingView
        style={[styles.keyboardView, isWide && styles.keyboardViewWide]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            ref={scrollRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            directionalLockEnabled
            bounces={false}
            overScrollMode="never"
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
                    isUser
                      ? { alignItems: userAlign }
                      : {
                        flexDirection: rowDirection,
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                      },
                  ]}
                >
                  {!isUser ? renderAssistantIcon() : null}

                  <View
                    style={[
                      styles.messageGroup,
                      isUser
                        ? { alignItems: userAlign }
                        : { alignItems: botAlign },
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isUser
                          ? [styles.userBubble, userBubbleTail]
                          : [styles.botBubble, botBubbleTail],
                      ]}
                    >
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.messageText,
                          { textAlign },
                          isUser ? styles.userMessageText : styles.botMessageText,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>

                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.messageTime,
                        {
                          textAlign: isUser
                            ? isArabic
                              ? "left"
                              : "right"
                            : textAlign,
                        },
                      ]}
                    >
                      {msg.time}
                    </Text>
                  </View>
                </View>
              );
            })}

            {isLoading ? (
              <View
                style={[
                  styles.messageRow,
                  {
                    flexDirection: rowDirection,
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                  },
                ]}
              >
                {renderAssistantIcon()}

                <View style={[styles.messageGroup, { alignItems: botAlign }]}>
                  <View
                    style={[
                      styles.messageBubble,
                      styles.botBubble,
                      botBubbleTail,
                      styles.loadingBubble,
                    ]}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.messageText,
                        styles.botMessageText,
                        { textAlign },
                      ]}
                    >
                      ...
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
        {messages.length <= 1 && !isLoading ? (
          <View style={styles.quickActions}>
            {[
              "كيف حالة سيارتي؟",
              "وش آخر تقرير؟",
              "كم حرارة المحرك؟",
              "كم فولت البطارية؟",
            ].map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.quickChip}
                onPress={() => sendQuickMessage(q)}
                activeOpacity={0.8}
              >
                <Text allowFontScaling={false} style={styles.quickChipText}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <View style={[styles.inputRow, { flexDirection: rowDirection }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { textAlign }]}
              placeholder={t.chatInputPlaceholder}
              placeholderTextColor={COLORS.placeholder}
              value={input}
              onChangeText={setInput}
              multiline
              selectionColor={COLORS.primary}
              returnKeyType="send"
              blurOnSubmit={false}
              allowFontScaling={false}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!input.trim() || isLoading) && styles.sendBtnDisabled,
              ]}
              onPress={sendMessage}
              activeOpacity={0.85}
              disabled={!input.trim() || isLoading}
            >
              <Feather name="arrow-up" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(COLORS: AppColors, isArabic: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },

    header: {
      minHeight: 60,
      paddingHorizontal: 18,
      paddingTop: 2,
      paddingBottom: 8,
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: COLORS.background,
    },

    backButton: {
      width: 42,
      height: 42,
      justifyContent: "center",
      backgroundColor: "transparent",
    },

    headerSide: {
      width: 42,
      height: 42,
    },

    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontFamily: FONT_BOLD,
      fontWeight: "800",
      color: COLORS.textPrimary,
      textAlign: "center",
      letterSpacing: 0.2,
      lineHeight: 28,
      includeFontPadding: true,
      paddingBottom: 1,
    },

    headerDivider: {
      height: 1,
      backgroundColor: COLORS.border,
    },

    keyboardView: {
      flex: 1,
      width: "100%",
    },

    keyboardViewWide: {
      maxWidth: 860,
      alignSelf: "center",
    },

    chatArea: {
      flex: 1,
      backgroundColor: COLORS.background,
    },

    chatContent: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 16,
    },

    messageRow: {
      width: "100%",
      marginBottom: 14,
      gap: 8,
    },

    smallBotIcon: {
      width: 32,
      height: 32,
      borderRadius: 13,
      backgroundColor: COLORS.lightGray,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: COLORS.border,
      marginTop: 2,
    },

    messageGroup: {
      maxWidth: "78%",
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
    },

    botBubbleArabic: {
      borderTopRightRadius: 6,
    },

    botBubbleEnglish: {
      borderTopLeftRadius: 6,
    },

    userBubble: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },

    userBubbleArabic: {
      borderTopLeftRadius: 6,
    },

    userBubbleEnglish: {
      borderTopRightRadius: 6,
    },

    loadingBubble: {
      minWidth: 44,
      alignItems: "center",
    },

    messageText: {
      fontSize: 14,
      fontFamily: FONT_REGULAR,
      fontWeight: "700",
      lineHeight: 23,
      includeFontPadding: true,
      paddingBottom: 1,
    },

    botMessageText: {
      color: COLORS.textPrimary,
    },

    userMessageText: {
      color: COLORS.white,
    },

    messageTime: {
      fontSize: 10,
      fontFamily: FONT_REGULAR,
      fontWeight: "600",
      color: COLORS.timeText,
      marginTop: 4,
      lineHeight: 16,
      includeFontPadding: true,
      opacity: 0.75,
    },

    inputContainer: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: Platform.OS === "ios" ? 16 : 8,
      borderTopWidth: 0,
      backgroundColor: "transparent",
    },

    inputRow: {
      minHeight: 54,
      borderRadius: 27,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingLeft: 7,
      paddingRight: 7,
      paddingVertical: 5,
      alignItems: "center",
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: COLORS.inputShadowOpacity,
      shadowRadius: 6,
      elevation: COLORS.inputShadowOpacity > 0 ? 1 : 0,
    },

    input: {
      flex: 1,
      maxHeight: 106,
      minHeight: 40,
      fontSize: 14,
      fontFamily: FONT_REGULAR,
      color: COLORS.textPrimary,
      fontWeight: "700",
      paddingTop: Platform.OS === "ios" ? 9 : 7,
      paddingBottom: Platform.OS === "ios" ? 7 : 6,
      paddingHorizontal: 8,
      textAlignVertical: "center",
      includeFontPadding: true,
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
      shadowOpacity: COLORS.sendShadowOpacity,
      shadowRadius: 8,
      elevation: 4,
    },

    sendBtnDisabled: {
      opacity: 0.45,
    },

    carStatusBar: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      backgroundColor: COLORS.lightGray,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },

    carStatusText: {
      fontSize: 11,
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.primary,
      textAlign: "center",
    },

    carNameText: {
      marginTop: 3,
      fontSize: 13,
      fontFamily: FONT_BOLD,
      color: COLORS.textPrimary,
      textAlign: "center",
    },

    quickActions: {
      flexDirection: "row-reverse",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: "transparent",
    },

    quickChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    quickChipText: {
      fontSize: 11,
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.textPrimary,
    },
    headerMenuButton: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
    },
    sidebarOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 999,
    },

    sidebarBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.25)",
    },

    sidebar: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 300,
      backgroundColor: COLORS.surface,
      paddingHorizontal: 14,
      paddingTop: Platform.OS === "android" ? 54 : 28,
      paddingBottom: 18,
    },

    sidebarArabic: {
      left: 0,
      borderRightWidth: 1,
      borderRightColor: COLORS.border,
    },

    sidebarEnglish: {
      right: 0,
      borderLeftWidth: 1,
      borderLeftColor: COLORS.border,
    },

    sidebarTitle: {
      fontSize: 18,
      fontFamily: FONT_BOLD,
      color: COLORS.textPrimary,
      marginBottom: 16,
      textAlign: "right",
    },

    newChatBtn: {
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: COLORS.lightGray,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 14,
    },

    newChatText: {
      fontSize: 13,
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.primary,
      textAlign: "right",
    },

    sidebarItem: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 4,
    },

    sidebarItemActive: {
      backgroundColor: COLORS.lightGray,
    },

    sidebarItemTitle: {
      fontSize: 13,
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.textPrimary,
      textAlign: "right",
    },

    /* sidebarItemSub: {
      marginTop: 3,
      fontSize: 11,
      fontFamily: FONT_REGULAR,
      color: COLORS.textSecondary,
      textAlign: "right",
    }, */

    sidebarDanger: {
      marginTop: 12,
      paddingVertical: 13,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: "rgba(135,27,23,0.08)",
    },

    sidebarDangerText: {
      fontSize: 13,
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.primary,
      textAlign: "right",
    },

    scanBackground: {
      ...StyleSheet.absoluteFillObject,
      top: 72,
      opacity: 0.13,
    },

    scanCircleBig: {
      position: "absolute",
      width: 270,
      height: 270,
      borderRadius: 135,
      borderWidth: 1,
      borderColor: COLORS.primary,
      right: -90,
      top: 120,
    },

    scanCircleSmall: {
      position: "absolute",
      width: 150,
      height: 150,
      borderRadius: 75,
      borderWidth: 1,
      borderColor: COLORS.primary,
      left: -45,
      top: 310,
    },

    scanLine: {
      position: "absolute",
      width: 230,
      height: 1,
      backgroundColor: COLORS.primary,
      right: 18,
      top: 255,
      opacity: 0.5,
    },
    sidebarRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 9,
    },
  });

}
