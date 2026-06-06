import React, { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  TextInput,
  PanResponder,
  KeyboardAvoidingView,
  AppState,
} from "react-native";
import { supabase } from "../../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useAuth } from "../../providers/AuthProvider";

import { useCars, UserCar } from "../../providers/CarsProvider";
import { useAppSettings } from "../../providers/AppSettingsProvider";
import { useNotifications } from "../../providers/NotificationsProvider";
import { useAccountSettings } from "../../providers/AccountSettingsProvider";
import {
  Alexandria_400Regular,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/alexandria";
import { useLanguage } from "../../providers/LanguageProvider";

import { EditCarNameModal } from "../../components/settings/CarModals";
import { ConfirmModal } from "../../components/settings/CommonModals";

const COLORS = {
  primary: "#871B17",
  primary2: "#871B17",
  primaryPressed: "#871B17",
  primaryDark: "#871B17",

  // خليته غامق بدل الأحمر الفاتح
  danger: "#871B17",

  success: "#2E7D32",
  white: "#FFFFFF",
};

const MAX_NAME_LENGTH = 20;
const EMAIL_CHANGE_RESEND_COOLDOWN = 60;
const EMAIL_CHANGE_PENDING_KEY = "settings_email_change_pending";
const EMAIL_CHANGE_TARGET_KEY = "settings_email_change_target_email";
const EMAIL_CHANGE_SUCCESS_SHOWN_KEY = "settings_email_change_success_shown";
const EMAIL_CHANGE_APP_LEFT_KEY = "settings_email_change_app_left";

// نفس مفتاح الدارك مود الموجود في AppSettingsProvider.
// نعرّفه هنا كنص ثابت عشان ما يصير undefined لو ما كان معمول له export.
const APP_DARK_MODE_KEY = "app_dark_mode_enabled";

const FONT_REGULAR = "Alexandria_400Regular";
const FONT_SEMIBOLD = "Alexandria_600SemiBold";
const FONT_BOLD = "Alexandria_700Bold";
const FONT_EXTRABOLD = "Alexandria_800ExtraBold";

const lightTheme = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#D8D8D8",
  cardBorder: "#DCDCDC",
  textPrimary: "#1D1D1F",
  textSecondary: "#707070",
  iconBg: "#F0F1F3",
  iconColor: "#871B17",
  subtle: "#F6F6F6",
  headerDivider: "#E4E4E4",
  cardPressed: "#FAFAFA",
  dangerBg: "#FFF1F1",
  successBg: "#EFFAF3",
  modalOverlay: "rgba(0,0,0,0.32)",

  accent: "#871B17",
  accentPressed: "#871B17",
  accentBorder: "rgba(135,27,23,0.20)",
  danger: "#871B17",
};

const darkTheme = {
  background: "#151515",
  surface: "#202020",
  border: "#3A3A3A",
  cardBorder: "#383838",
  textPrimary: "#FFFFFF",
  textSecondary: "#C7C7C7",

  // في الدارك مود نخلي خلفية الأيقونات رمادي غامق بدل الأحمر،
  // والأيقونة نفسها تبقى بلون أحمر التطبيق نفس بوكس الحساب.
  iconBg: "#2A2A2A",
  iconColor: "#B63A34",

  subtle: "#292929",
  headerDivider: "#343434",
  cardPressed: "#2E2E2E",
  dangerBg: "rgba(182,58,52,0.12)",
  successBg: "rgba(46,125,50,0.18)",
  modalOverlay: "rgba(0,0,0,0.62)",

  accent: "#B63A34",
  accentPressed: "#B63A34",
  accentBorder: "rgba(182,58,52,0.28)",
  danger: "#B63A34",
};

const translations = {
  AR: {
    settings: "الإعدادات",

    account: "الحساب",
    userId: "رقم الحساب",

    cars: "سياراتي",
    currentCar: "السيارة الحالية",
    noCar: "لا توجد سيارة متصلة الآن",

    appSettings: "إعدادات التطبيق",
    notifications: "السماح بالإشعارات",
    notificationsDesc: "استلام تنبيهات الفحص والتذكيرات",
    language: "اللغة",
    languageDesc: "لغة التطبيق الحالية: العربية",
    darkMode: "الوضع الداكن",
    darkModeDesc: "تفعيل المظهر الداكن للتطبيق",

    helpSupport: "المساعدة والدعم",
    help: "تواصل مع الدعم",
    helpDesc: "للاستفسارات أو الإبلاغ عن مشكلة في التطبيق",
    supportEmailButton: "البريد الإلكتروني",
    supportWhatsAppButton: "واتساب",
    reportIssueButton: "إبلاغ عن مشكلة",
    helpIntro:
      "إذا ظهرت مشكلة أو كان هناك استفسار، أرسل التفاصيل وسنساعد في أقرب وقت.",
    faqTitle: "الأسئلة الشائعة",
    faqConnectionQuestion: "كيف أوصل قطعة السيارة؟",
    faqConnectionAnswer:
      "من صفحة الاتصال، اختر البلوتوث ثم اختر قطعة السيارة وابدأ الفحص.",
    faqNotificationsQuestion: "لماذا لا تظهر السيارة؟",
    faqNotificationsAnswer:
      "تأكد من تشغيل القطعة وتفعيل البلوتوث والصلاحيات.",
    faqReportQuestion: "هل التطبيق يحفظ بيانات السيارة؟",
    faqReportAnswer:
      "يتم حفظ البيانات الضرورية فقط لتحسين تجربتك وعرض التقارير.",

    vehicleConnection: "اتصال السيارة",
    bluetoothSettings: "ربط قطعة السيارة",
    bluetoothSettingsDesc: "ربط أو تغيير قطعة السيارة",
    deviceStatus: "اتصال القطعة",
    scanStatus: "قراءة بيانات السيارة",
    dataConnection: "اتصال البيانات",
    connected: "متصل",
    disconnected: "غير متصل",
    scannerOn: "تعمل الآن",
    scannerOff: "متوقفة",

    pauseMonitoring: "إيقاف المتابعة مؤقتًا",
    pauseMonitoringDesc: "إيقاف قراءة بيانات السيارة مؤقتًا",
    endVehicleConnection: "إنهاء اتصال السيارة",
    endVehicleConnectionDesc: "فصل الجهاز وإيقاف قراءة البيانات",

    logout: "تسجيل الخروج",
    loggingOut: "جاري تسجيل الخروج...",
    logoutTitle: "تسجيل الخروج",
    logoutMessage: "هل تريد تسجيل الخروج من حسابك؟",
    cancel: "إلغاء",
    confirm: "تأكيد",
    logoutError: "تعذر تسجيل الخروج",

    helpTitle: "المساعدة",

    done: "تم",
    ok: "حسنًا",
    monitoringPaused: "تم إيقاف المتابعة مؤقتًا.",
    disconnectTitle: "إنهاء اتصال السيارة",
    disconnectMessage: "هل تريد إنهاء اتصال السيارة الآن؟",
    disconnectedDone: "تم إنهاء اتصال السيارة.",
    errorTitle: "حدث خطأ",
    nameLimitError: "الاسم يجب ألا يتجاوز 20 حرفًا.",
    emailSameError: "أدخل بريدًا إلكترونيًا مختلفًا عن البريد الحالي.",
    emailChangeSentTitle: "تم إرسال رابط التأكيد",
    emailChangeSentBody:
      "افتح البريد الإلكتروني الجديد واضغط على رابط التأكيد لإكمال التغيير.",
    emailChangeSuccessTitle: "تم تغيير البريد الإلكتروني",
    emailChangeSuccessBody: "تم تأكيد البريد الإلكتروني الجديد وتحديثه في الحساب.",
    emailChangeStaySettings: "بعد التأكيد ستعودين إلى الإعدادات ويظهر البريد الجديد في الحساب.",
    emailChangeError:
      "تعذر إرسال رابط التأكيد. تأكد من البريد الإلكتروني أو جرّب مرة أخرى.",

    totalCars: "عدد السيارات",
    carConnection: "اتصال السيارة الحالية",

    notificationsDeniedTitle: "الإشعارات غير مفعّلة",
    notificationsDeniedBody:
      "فعّل الإشعارات من إعدادات الجهاز حتى تصل التنبيهات.",
    openSettings: "فتح الإعدادات",
  },

  EN: {
    settings: "Settings",

    account: "Account",
    userId: "User ID",

    cars: "My Cars",
    currentCar: "Current Car",
    noCar: "No connected car",

    appSettings: "App Settings",
    notifications: "Allow Notifications",
    notificationsDesc: "Receive check alerts and reminders",
    language: "Language",
    languageDesc: "Current app language: English",
    darkMode: "Dark Mode",
    darkModeDesc: "Enable dark theme for the app",

    helpSupport: "Help & Support",
    help: "Contact Support",
    helpDesc: "For questions or reporting an app issue",
    supportEmailButton: "Email",
    supportWhatsAppButton: "WhatsApp",
    reportIssueButton: "Report a problem",
    helpIntro:
      "If you have a question or an issue, send us the details and we will help you as soon as possible.",
    faqTitle: "FAQs",
    faqConnectionQuestion: "How do I connect the car device?",
    faqConnectionAnswer:
      "Open the connection page, choose Bluetooth, select the car device, then start the scan.",
    faqNotificationsQuestion: "Why does my car not appear?",
    faqNotificationsAnswer:
      "Make sure the device is powered on and Bluetooth permissions are enabled.",
    faqReportQuestion: "Does the app save car data?",
    faqReportAnswer:
      "Only the necessary data is saved to improve your experience and show reports.",

    vehicleConnection: "Car Connection",
    bluetoothSettings: "Connect Car Device",
    bluetoothSettingsDesc: "Connect or change the car device",
    deviceStatus: "Device Connection",
    scanStatus: "Car Data Reading",
    dataConnection: "Data Connection",
    connected: "Connected",
    disconnected: "Disconnected",
    scannerOn: "Running",
    scannerOff: "Stopped",

    pauseMonitoring: "Pause monitoring",
    pauseMonitoringDesc: "Temporarily stop reading vehicle data",
    endVehicleConnection: "End vehicle connection",
    endVehicleConnectionDesc: "Disconnect the device and stop reading data",

    logout: "Logout",
    loggingOut: "Logging out...",
    logoutTitle: "Logout",
    logoutMessage: "Do you want to logout from your account?",
    cancel: "Cancel",
    confirm: "Confirm",
    logoutError: "Could not logout",

    helpTitle: "Help",

    done: "Done",
    ok: "OK",
    monitoringPaused: "Monitoring has been paused.",
    disconnectTitle: "End vehicle connection",
    disconnectMessage: "Do you want to end the vehicle connection now?",
    disconnectedDone: "Vehicle connection has been ended.",
    errorTitle: "Error",
    nameLimitError: "Name must be 20 characters or less.",
    emailSameError: "Enter an email address different from your current email.",
    emailChangeSentTitle: "Confirmation link sent",
    emailChangeSentBody:
      "Open your new email and tap the confirmation link to complete the change.",
    emailChangeSuccessTitle: "Email changed",
    emailChangeSuccessBody: "The new email has been confirmed and updated on your account.",
    emailChangeStaySettings: "After confirmation, you will return to Settings and see the new email on your account.",
    emailChangeError:
      "Could not send the confirmation link. Check the email address or try again.",

    totalCars: "Total Cars",
    carConnection: "Current Car Connection",

    notificationsDeniedTitle: "Notifications disabled",
    notificationsDeniedBody:
      "Enable notifications from device settings to receive alerts.",
    openSettings: "Open Settings",
  },
};

function AppSwitch({
  value,
  onValueChange,
  trackOnColor = COLORS.primary,
  trackOffColor = "#E5E5E5",
  thumbColor = "#FFFFFF",
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  trackOnColor?: string;
  trackOffColor?: string;
  thumbColor?: string;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 27],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.switchTrack,
        {
          backgroundColor: value ? trackOnColor : trackOffColor,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.switchThumb,
          {
            backgroundColor: thumbColor,
            transform: [{ translateX }],
          },
        ]}
      />
    </Pressable>
  );
}

function EditActionPill({
  label,
  theme,
  isRTL,
}: {
  label: string;
  theme: typeof lightTheme;
  isRTL: boolean;
}) {
  return (
    <View
      style={[
        styles.editActionPlain,
        {
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
    >
      <Feather name="edit-3" size={15} color={theme.accent} />
      <Text style={[styles.editActionPlainText, { color: theme.accent }]}>{label}</Text>
    </View>
  );
}

function AppMessageModal({
  visible,
  title,
  message,
  icon,
  buttonText,
  theme,
  isRTL,
  onClose,
}: {
  visible: boolean;
  title: string;
  message?: string;
  icon: keyof typeof Feather.glyphMap;
  buttonText: string;
  theme: typeof lightTheme;
  isRTL: boolean;
  onClose: () => void;
}) {
  const isSuccess = icon === "check-circle";
  const isError = icon === "alert-circle";
  const lottieRef = useRef<LottieView>(null);
  const iconColor = isError ? theme.danger : theme.accent;
  const iconBackground = isError ? "rgba(135,27,23,0.12)" : theme.iconBg;

  const successScale = useRef(new Animated.Value(0.35)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const pulseOneScale = useRef(new Animated.Value(0.65)).current;
  const pulseOneOpacity = useRef(new Animated.Value(0)).current;
  const pulseTwoScale = useRef(new Animated.Value(0.65)).current;
  const pulseTwoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !isSuccess) return;

    lottieRef.current?.reset();

    const playTimer = setTimeout(() => {
      lottieRef.current?.play(0);
    }, 80);

    successScale.setValue(0.35);
    successOpacity.setValue(0);
    pulseOneScale.setValue(0.65);
    pulseOneOpacity.setValue(0.45);
    pulseTwoScale.setValue(0.65);
    pulseTwoOpacity.setValue(0.32);

    Animated.parallel([
      Animated.sequence([
        Animated.parallel([
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(successScale, {
            toValue: 1.14,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(successScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseOneScale, {
            toValue: 1.75,
            duration: 760,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOneOpacity, {
            toValue: 0,
            duration: 760,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(pulseTwoScale, {
            toValue: 1.95,
            duration: 780,
            useNativeDriver: true,
          }),
          Animated.timing(pulseTwoOpacity, {
            toValue: 0,
            duration: 780,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => {
      clearTimeout(playTimer);
      clearTimeout(timer);
    };
  }, [
    visible,
    isSuccess,
    onClose,
    successScale,
    successOpacity,
    pulseOneScale,
    pulseOneOpacity,
    pulseTwoScale,
    pulseTwoOpacity,
  ]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
      >
        <View
          style={[
            styles.confirmModal,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          {isSuccess ? (
            <View style={styles.successAnimationWrapper}>
              <LottieView
                ref={lottieRef}
                source={require("../../assets/animations/success-check.json")}
                loop={false}
                speed={1.15}
                style={styles.successLottie}
              />
            </View>
          ) : isError ? (
            <Feather
              name="alert-circle"
              size={36}
              color={theme.danger}
              style={styles.appMessagePlainErrorIcon}
            />
          ) : null}

          <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
            {title}
          </Text>

          {!!message?.trim() && (
            <Text
              style={[
                styles.confirmMessage,
                {
                  color: theme.textSecondary,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {message}
            </Text>
          )}

          {!isSuccess && (
            <Pressable
              style={({ pressed }) => [
                styles.singleModalButton,
                {
                  backgroundColor: theme.accent,
                  opacity: pressed ? 0.9 : 1,
                  marginTop: message?.trim() ? 0 : 10,
                },
              ]}
              onPress={onClose}
            >
              <Text style={styles.confirmPrimaryText}>{buttonText}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}


function EmailChangeSuccessOverlay({
  visible,
  title,
  message,
  isDarkMode,
  onFinish,
}: {
  visible: boolean;
  title: string;
  message: string;
  isDarkMode: boolean;
  onFinish: () => void;
}) {
  const lottieRef = useRef<LottieView>(null);
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const onFinishRef = useRef(onFinish);
  const playedOnceRef = useRef(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (!visible) {
      playedOnceRef.current = false;
      return;
    }

    if (playedOnceRef.current) return;
    playedOnceRef.current = true;

    cardScale.setValue(0.96);
    cardOpacity.setValue(0);
    lottieRef.current?.reset();

    const playTimer = setTimeout(() => {
      lottieRef.current?.play(0, 50);
    }, 35);

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();

    const closeTimer = setTimeout(() => {
      onFinishRef.current();
    }, 2350);

    return () => {
      clearTimeout(playTimer);
      clearTimeout(closeTimer);
    };
  }, [visible, cardScale, cardOpacity]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFinish}>
      <View
        style={[
          styles.emailChangeSuccessOverlay,
          {
            backgroundColor: isDarkMode
              ? "rgba(0,0,0,0.44)"
              : "rgba(255,255,255,0.62)",
          },
        ]}
      >
        <BlurView
          intensity={isDarkMode ? 42 : 58}
          tint={isDarkMode ? "dark" : "light"}
          style={StyleSheet.absoluteFillObject}
        />

        <Animated.View
          style={[
            styles.emailChangeSuccessContent,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <LottieView
            ref={lottieRef}
            source={require("../../assets/animations/success-check.json")}
            loop={false}
            autoPlay={false}
            speed={1.45}
            style={styles.emailChangeSuccessAnimation}
          />

          <Text
            style={[
              styles.emailChangeSuccessTitle,
              { color: isDarkMode ? "#FFFFFF" : COLORS.primary },
            ]}
            allowFontScaling={false}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.emailChangeSuccessSubtitle,
              { color: isDarkMode ? "rgba(255,255,255,0.86)" : "#2C2C2C" },
            ]}
            allowFontScaling={false}
          >
            {message}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DeleteAccountModal({
  visible,
  password,
  onChangePassword,
  onCancel,
  onConfirm,
  loading,
  theme,
  isRTL,
}: {
  visible: boolean;
  password: string;
  onChangePassword: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  theme: typeof lightTheme;
  isRTL: boolean;
}) {
  const rowDirection = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
        <View
          style={[
            styles.confirmModal,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <Text style={[styles.confirmTitle, { color: theme.danger }]}>
            {isRTL ? "حذف الحساب" : "Delete account"}
          </Text>

          <Text
            style={[
              styles.confirmMessage,
              {
                color: theme.textSecondary,
                textAlign,
              },
            ]}
          >
            {isRTL
              ? "سيؤدي حذف الحساب إلى إزالة الحساب وبياناته بشكل نهائي. لا يمكن التراجع عن هذه العملية أو استرجاع الحساب بعد الحذف."
              : "Deleting the account will permanently remove the account and its data. This action cannot be undone and the account cannot be restored after deletion."}
          </Text>

          <Text style={[styles.deletePasswordLabel, { color: theme.textSecondary, textAlign }]}>
            {isRTL ? "أدخل كلمة المرور الحالية للتأكيد" : "Enter the current password to confirm"}
          </Text>

          <TextInput
            value={password}
            onChangeText={onChangePassword}
            secureTextEntry
            editable={!loading}
            placeholder={isRTL ? "كلمة المرور الحالية" : "Current password"}
            placeholderTextColor="#A9A9A9"
            selectionColor={theme.accent}
            textAlign={textAlign}
            style={[
              styles.deletePasswordInput,
              {
                color: theme.textPrimary,
                backgroundColor: theme.subtle,
                borderColor: theme.cardBorder,
              },
            ]}
          />

          <View style={[styles.confirmButtons, { flexDirection: rowDirection }]}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmSecondaryButton,
                {
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.subtle,
                  opacity: pressed ? 0.78 : loading ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.confirmSecondaryText, { color: theme.textPrimary }]}>
                {isRTL ? "إلغاء" : "Cancel"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmPrimaryButton,
                {
                  backgroundColor: theme.danger,
                  opacity: pressed ? 0.9 : loading ? 0.72 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmPrimaryText}>
                  {isRTL ? "حذف الحساب" : "Delete account"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeleteCarModal({
  visible,
  password,
  onChangePassword,
  onCancel,
  onConfirm,
  loading,
  theme,
  isRTL,
}: {
  visible: boolean;
  password: string;
  onChangePassword: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  theme: typeof lightTheme;
  isRTL: boolean;
}) {
  const rowDirection = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
        <View
          style={[
            styles.confirmModal,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <Text style={[styles.confirmTitle, { color: theme.danger }]}>
            {isRTL ? "حذف السيارة" : "Delete car"}
          </Text>

          <Text style={[styles.confirmMessage, { color: theme.textSecondary, textAlign }]}>
            {isRTL
              ? "أدخل كلمة مرور الحساب لتأكيد حذف السيارة. لا يمكن التراجع عن هذه العملية."
              : "Enter your account password to confirm deleting this car. This action cannot be undone."}
          </Text>

          <Text style={[styles.deletePasswordLabel, { color: theme.textSecondary, textAlign }]}>
            {isRTL ? "كلمة المرور الحالية" : "Current password"}
          </Text>

          <TextInput
            value={password}
            onChangeText={onChangePassword}
            secureTextEntry
            editable={!loading}
            placeholder={isRTL ? "اكتبي كلمة المرور" : "Enter password"}
            placeholderTextColor="#A9A9A9"
            selectionColor={theme.accent}
            textAlign={textAlign}
            style={[
              styles.deletePasswordInput,
              {
                color: theme.textPrimary,
                backgroundColor: theme.subtle,
                borderColor: theme.cardBorder,
              },
            ]}
          />

          <View style={[styles.confirmButtons, { flexDirection: rowDirection }]}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmSecondaryButton,
                {
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.subtle,
                  opacity: pressed ? 0.78 : loading ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.confirmSecondaryText, { color: theme.textPrimary }]}>
                {isRTL ? "إلغاء" : "Cancel"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmPrimaryButton,
                {
                  backgroundColor: theme.danger,
                  opacity: pressed ? 0.9 : loading ? 0.72 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmPrimaryText}>
                  {isRTL ? "حذف السيارة" : "Delete car"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}


type BottomEditSheetMode = "form" | "success";

function BottomEditSheet({
  visible,
  title,
  subtitle,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  maxLength,
  onClose,
  onSave,
  saving,
  theme,
  isRTL,
  confirmText,
  cancelText,
  mode,
  successTitle,
  successMessage,
  successActionText,
  onSuccessAction,
  successInfoText,
  successResendQuestion,
  successResendText,
  successResendTimer,
  successResending,
  onSuccessResend,
  errorMessage,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address";
  maxLength?: number;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  theme: typeof lightTheme;
  isRTL: boolean;
  confirmText: string;
  cancelText: string;
  mode: BottomEditSheetMode;
  successTitle: string;
  successMessage?: string;
  successActionText?: string;
  onSuccessAction?: () => void;
  successInfoText?: string;
  successResendQuestion?: string;
  successResendText?: string;
  successResendTimer?: number;
  successResending?: boolean;
  onSuccessResend?: () => void;
  errorMessage?: string;
}) {
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);
  const [renderModal, setRenderModal] = useState(visible);

  const rowDirection = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  const closeWithAnimation = () => {
    if (saving) return;

    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 190,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      dragY.setValue(0);
      setRenderModal(false);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 3 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dy) > 3 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        dragY.setOffset(0);
        dragY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const nextY = Math.max(-16, gestureState.dy);
        dragY.setValue(nextY);
      },
      onPanResponderRelease: (_, gestureState) => {
        dragY.flattenOffset();

        if (gestureState.dy > 80 || gestureState.vy > 0.85) {
          closeWithAnimation();
          return;
        }

        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 90,
        }).start();
      },
      onPanResponderTerminate: () => {
        dragY.flattenOffset();
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 90,
        }).start();
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      setRenderModal(true);
      dragY.setValue(0);
      requestAnimationFrame(() => {
        Animated.timing(sheetAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    } else if (renderModal) {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 190,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        dragY.setValue(0);
        setRenderModal(false);
      });
    }
  }, [visible, renderModal, sheetAnim, dragY]);

  useEffect(() => {
    if (!visible || mode !== "success") return;

    lottieRef.current?.reset();

    const playTimer = setTimeout(() => {
      lottieRef.current?.play(0);
    }, 80);

    return () => clearTimeout(playTimer);
  }, [visible, mode]);

  if (!renderModal) return null;

  const translateY = Animated.add(
    sheetAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [420, 0],
    }),
    dragY,
  );

  const backdropOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={renderModal}
      transparent
      animationType="none"
      onRequestClose={closeWithAnimation}
    >
      <View style={styles.bottomSheetRoot}>
        <Animated.View
          style={[
            styles.bottomSheetBackdrop,
            {
              backgroundColor: theme.modalOverlay,
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeWithAnimation}
          />
        </Animated.View>

        <KeyboardAvoidingView
          pointerEvents="box-none"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          style={styles.bottomSheetKeyboardAvoider}
        >
          <Animated.View
            style={[
              styles.bottomSheetContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.cardBorder,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.bottomSheetHandleArea} {...panResponder.panHandlers}>
              <View
                style={[
                  styles.bottomSheetHandle,
                  { backgroundColor: theme.border },
                ]}
              />
            </View>

            {mode === "success" ? (
              <View style={styles.bottomSheetSuccessContent}>
                <LottieView
                  ref={lottieRef}
                  source={require("../../assets/animations/success-check.json")}
                  loop={false}
                  speed={1.12}
                  style={styles.bottomSheetSuccessLottie}
                />

                <Text
                  style={[
                    styles.bottomSheetTitle,
                    { color: theme.textPrimary, textAlign: "center" },
                  ]}
                >
                  {successTitle}
                </Text>

                {!!successMessage?.trim() && (
                  <Text
                    style={[
                      styles.bottomSheetSubtitle,
                      { color: theme.textSecondary, textAlign: "center" },
                    ]}
                  >
                    {successMessage}
                  </Text>
                )}

                {!!successActionText?.trim() && (
                  <Pressable
                    onPress={onSuccessAction || closeWithAnimation}
                    style={({ pressed }) => [
                      styles.bottomSheetSuccessButton,
                      { opacity: pressed ? 0.86 : 1 },
                    ]}
                  >
                    <LinearGradient
                      colors={[theme.accent, theme.accentPressed]}
                      start={{ x: 0.15, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={styles.bottomSheetSuccessButtonGradient}
                    >
                      <Text style={styles.bottomSheetPrimaryText}>
                        {successActionText}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                )}

                {!!successInfoText?.trim() && (
                  <Text
                    style={[
                      styles.bottomSheetSuccessInfoText,
                      { color: theme.textSecondary, textAlign: "center" },
                    ]}
                  >
                    {successInfoText}
                  </Text>
                )}

                {!!successResendQuestion?.trim() && !!successResendText?.trim() && (
                  <View style={styles.bottomSheetResendArea}>
                    <Text
                      style={[
                        styles.bottomSheetResendQuestion,
                        { color: theme.textSecondary, textAlign: "center" },
                      ]}
                    >
                      {successResendQuestion}
                    </Text>

                    {(successResendTimer || 0) > 0 ? (
                      <Text style={styles.bottomSheetResendTimerText}>
                        {isRTL
                          ? `يمكنك إعادة الإرسال بعد ${successResendTimer} ثانية`
                          : `You can resend after ${successResendTimer} seconds`}
                      </Text>
                    ) : (
                      <Pressable
                        onPress={onSuccessResend}
                        disabled={successResending}
                        style={({ pressed }) => [
                          styles.bottomSheetResendButton,
                          {
                            borderColor: theme.cardBorder,
                            backgroundColor: theme.subtle,
                            opacity: pressed ? 0.8 : successResending ? 0.7 : 1,
                          },
                        ]}
                      >
                        {successResending ? (
                          <ActivityIndicator size="small" color={theme.accent} />
                        ) : (
                          <Text style={styles.bottomSheetResendButtonText}>
                            {successResendText}
                          </Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View>
                <View
                  style={[
                    styles.bottomSheetHeader,
                    { flexDirection: rowDirection },
                  ]}
                >
                  <View style={styles.bottomSheetHeaderTextBlock}>
                    <Text
                      style={[
                        styles.bottomSheetTitle,
                        { color: theme.textPrimary, textAlign },
                      ]}
                    >
                      {title}
                    </Text>

                    {!!subtitle?.trim() && (
                      <Text
                        style={[
                          styles.bottomSheetSubtitle,
                          { color: theme.textSecondary, textAlign },
                        ]}
                      >
                        {subtitle}
                      </Text>
                    )}
                  </View>

                </View>

                <TextInput
                  value={value}
                  onChangeText={onChangeText}
                  placeholder={placeholder}
                  placeholderTextColor="#A9A9A9"
                  keyboardType={keyboardType}
                  autoCapitalize={
                    keyboardType === "email-address" ? "none" : "words"
                  }
                  autoCorrect={keyboardType !== "email-address"}
                  maxLength={maxLength}
                  editable={!saving}
                  selectionColor={theme.accent}
                  textAlign={textAlign}
                  style={[
                    styles.bottomSheetInput,
                    {
                      color: theme.textPrimary,
                      backgroundColor: theme.subtle,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                />

                {!!errorMessage?.trim() && (
                  <View
                    style={[
                      styles.bottomSheetErrorBox,
                      { flexDirection: rowDirection },
                    ]}
                  >
                    <Feather
                      name="alert-circle"
                      size={22}
                      color={theme.danger}
                    />
                    <Text
                      style={[
                        styles.bottomSheetErrorText,
                        { textAlign, color: theme.danger },
                      ]}
                    >
                      {errorMessage}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.bottomSheetActions,
                    { flexDirection: rowDirection },
                  ]}
                >
                  <Pressable
                    onPress={closeWithAnimation}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.bottomSheetSecondaryButton,
                      {
                        borderColor: theme.cardBorder,
                        backgroundColor: theme.subtle,
                        opacity: pressed ? 0.78 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bottomSheetSecondaryText,
                        { color: theme.textPrimary },
                      ]}
                    >
                      {cancelText}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={onSave}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.bottomSheetPrimaryButton,
                      { opacity: pressed || saving ? 0.78 : 1 },
                    ]}
                  >
                    <LinearGradient
                      colors={[theme.accent, theme.accentPressed]}
                      start={{ x: 0.15, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={styles.bottomSheetPrimaryGradient}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.bottomSheetPrimaryText}>
                          {confirmText}
                        </Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function Settings() {
  const { profile, session } = useAuth();
  const router = useRouter();
  const routeParams = useLocalSearchParams<{
    email_changed?: string;
    email_change?: string;
    type?: string;
    access_token?: string;
    refresh_token?: string;
  }>();
  const { language, changeLanguage } = useLanguage();
  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    Alexandria_800ExtraBold,
  });

  const {
    obdConnected,
    scannerRunning,
    mqttConnected,
    detectingCar,
    lastConnectionTime,
    activeCarId,
    selectedCarId,
    connectedCarId,
    userCars,
    selectDefaultCar,
    renameCar,
    deleteCar,
    stopScanner,
    disconnectObd,
  } = useCars();

  const {
    settingsLoading,
    savingSettings,
    darkModeEnabled,
    notificationsEnabled,
    handleLanguageChange: saveAppLanguageChange,
    handleDarkModeChange,
  } = useAppSettings();

  const { handleNotificationsChange } = useNotifications();

  const { updateName, deleteAccount, logout } = useAccountSettings();

  const [loggingOut, setLoggingOut] = useState(false);

  const [displayName, setDisplayName] = useState("");

  const [editCarVisible, setEditCarVisible] = useState(false);
  const [selectedCarForEdit, setSelectedCarForEdit] = useState<UserCar | null>(
    null,
  );
  const [carNameInput, setCarNameInput] = useState("");
  const [savingCarName, setSavingCarName] = useState(false);

  const [switchingCarId, setSwitchingCarId] = useState<string | null>(null);
  const [optimisticSelectedCarId, setOptimisticSelectedCarId] = useState<
    string | null
  >(null);

  const [helpVisible, setHelpVisible] = useState(false);
  const helpSheetDragY = useRef(new Animated.Value(0)).current;
  const [confirmDisconnectVisible, setConfirmDisconnectVisible] =
    useState(false);

  const [editNameVisible, setEditNameVisible] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSheetMode, setNameSheetMode] =
    useState<BottomEditSheetMode>("form");
  const [nameSheetError, setNameSheetError] = useState("");

  const [messageVisible, setMessageVisible] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageIcon, setMessageIcon] =
    useState<keyof typeof Feather.glyphMap>("check-circle");

  const [emailChangeSuccessVisible, setEmailChangeSuccessVisible] =
    useState(false);
  const [emailChangeSuccessTitle, setEmailChangeSuccessTitle] = useState("");
  const [emailChangeSuccessMessage, setEmailChangeSuccessMessage] = useState("");

  const [editEmailVisible, setEditEmailVisible] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSheetMode, setEmailSheetMode] =
    useState<BottomEditSheetMode>("form");
  const [emailSheetError, setEmailSheetError] = useState("");
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [resendingEmailLink, setResendingEmailLink] = useState(false);
  const [emailResendNotice, setEmailResendNotice] = useState("");
  const [confirmedEmailOverride, setConfirmedEmailOverride] = useState("");
  const emailChangeHandledRef = useRef(false);
  const appWentToBackgroundRef = useRef(false);

  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [confirmDeleteCarVisible, setConfirmDeleteCarVisible] = useState(false);
  const [carToDelete, setCarToDelete] = useState<UserCar | null>(null);

  const [deleteCarPassword, setDeleteCarPassword] = useState("");
  const [deletingCar, setDeletingCar] = useState(false);

  const selectedLanguage = language;
  const t = translations[selectedLanguage];
  const isRTL = selectedLanguage === "AR";
  const theme = darkModeEnabled ? darkTheme : lightTheme;

  const resetEmailEditSheet = () => {
    setEditEmailVisible(false);
    setEmailSheetMode("form");
    setEmailSheetError("");
    setEmailResendNotice("");
    setEmailResendTimer(0);
    setResendingEmailLink(false);
  };

  const showEmailChangedSuccessImmediately = async () => {
    resetEmailEditSheet();
    setMessageVisible(false);
    setEmailChangeSuccessTitle(
      selectedLanguage === "AR"
        ? "تم تأكيد تغيير البريد الإلكتروني بنجاح"
        : "Email change confirmed successfully",
    );
    setEmailChangeSuccessMessage(
      selectedLanguage === "AR"
        ? "تم تحديث البريد الإلكتروني الجديد في حسابك."
        : "Your new email address has been updated on your account.",
    );
    setEmailChangeSuccessVisible(true);

    try {
      await AsyncStorage.setItem(EMAIL_CHANGE_SUCCESS_SHOWN_KEY, "true");
    } catch (error) {
      console.log("Save email success shown flag error:", error);
    }
  };

  const syncConfirmedEmailInBackground = async () => {
    try {
      const { error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.log(
          "Refresh session after email change error:",
          refreshError.message,
        );
      }
    } catch (refreshNetworkError: any) {
      console.log(
        "Refresh session after email change network error:",
        refreshNetworkError?.message ?? refreshNetworkError,
      );
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log("Get user after email change error:", userError.message);
      }

      const confirmedEmail = user?.email?.trim().toLowerCase();

      if (user?.id && confirmedEmail) {
        setConfirmedEmailOverride(confirmedEmail);
        setEmailInput(confirmedEmail);

        try {
          const { error: profileEmailError } = await supabase
            .from("profiles")
            .update({
              username: confirmedEmail,
              email: confirmedEmail,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (profileEmailError) {
            console.log(
              "Profile email sync after email change error:",
              profileEmailError.message,
            );
          }
        } catch (profileNetworkError: any) {
          console.log(
            "Profile email sync after email change network error:",
            profileNetworkError?.message ?? profileNetworkError,
          );
        }
      }
    } catch (userNetworkError: any) {
      console.log(
        "Get user after email change network error:",
        userNetworkError?.message ?? userNetworkError,
      );
    } finally {
      try {
        await AsyncStorage.multiRemove([
          EMAIL_CHANGE_PENDING_KEY,
          EMAIL_CHANGE_TARGET_KEY,
          EMAIL_CHANGE_APP_LEFT_KEY,
        ]);
      } catch (storageError) {
        console.log("Clean email change pending flags error:", storageError);
      }
    }
  };

  const triggerEmailChangeSuccess = async (reason: string) => {
    if (emailChangeHandledRef.current) return;

    try {
      const wasSuccessShown =
        (await AsyncStorage.getItem(EMAIL_CHANGE_SUCCESS_SHOWN_KEY)) === "true";

      /**
       * مهم جدًا:
       * بعض الأجهزة ترجع نفس رابط الإيميل أكثر من مرة عن طريق getInitialURL أو url event
       * أو AppState active. إذا سبق عرض النجاح، نقفل كل الـ triggers وما نعيد الأنيميشن.
       */
      if (wasSuccessShown) {
        emailChangeHandledRef.current = true;
        setEmailChangeSuccessVisible(false);
        return;
      }

      emailChangeHandledRef.current = true;

      await AsyncStorage.multiSet([
        [EMAIL_CHANGE_SUCCESS_SHOWN_KEY, "true"],
        [EMAIL_CHANGE_APP_LEFT_KEY, "false"],
      ]);

      await AsyncStorage.multiRemove([
        EMAIL_CHANGE_PENDING_KEY,
        EMAIL_CHANGE_TARGET_KEY,
        EMAIL_CHANGE_APP_LEFT_KEY,
      ]);
    } catch (error) {
      console.log("Prepare email success overlay error:", error);
      emailChangeHandledRef.current = true;
    }

    console.log("Email change success overlay triggered:", reason);

    /**
     * نعرض الأنيميشن فورًا أول ما التطبيق يرجع من رابط التأكيد.
     * التحديث مع Supabase يصير في الخلفية ولا ننتظره عشان ما تتأخر الرسالة.
     */
    resetEmailEditSheet();
    setMessageVisible(false);
    setEmailChangeSuccessTitle(
      selectedLanguage === "AR"
        ? "تم تأكيد تغيير البريد الإلكتروني بنجاح"
        : "Email change confirmed successfully",
    );
    setEmailChangeSuccessMessage(
      selectedLanguage === "AR"
        ? "تم تحديث البريد الإلكتروني الجديد في حسابك."
        : "Your new email address has been updated on your account.",
    );
    setEmailChangeSuccessVisible(true);

    syncConfirmedEmailInBackground().catch((error) => {
      console.log("Email change background sync error:", error);
    });
  };

  const urlLooksLikeEmailChangeConfirmation = (url?: string | null) => {
    if (!url) return false;

    const lowerUrl = decodeURIComponent(url).toLowerCase();

    return (
      lowerUrl.includes("email_changed=1") ||
      lowerUrl.includes("email_change=1") ||
      lowerUrl.includes("email-change=1") ||
      lowerUrl.includes("type=email_change") ||
      lowerUrl.includes("type=email_change_current") ||
      lowerUrl.includes("type=email_change_new") ||
      lowerUrl.includes("email_change_token") ||
      lowerUrl.includes("email_change_token_new") ||
      lowerUrl.includes("email_change_token_current") ||
      lowerUrl.includes("access_token=") ||
      lowerUrl.includes("refresh_token=") ||
      (lowerUrl.includes("settings") && lowerUrl.includes("email"))
    );
  };

  const handleConfirmedEmailChangeLink = async (url?: string | null) => {
    if (!url || emailChangeHandledRef.current) return;

    let hasPendingEmailChange = false;

    try {
      hasPendingEmailChange =
        (await AsyncStorage.getItem(EMAIL_CHANGE_PENDING_KEY)) === "true";
    } catch (error) {
      console.log("Read pending email change flag error:", error);
    }

    if (!hasPendingEmailChange && !urlLooksLikeEmailChangeConfirmation(url)) {
      return;
    }

    await triggerEmailChangeSuccess("deep-link-url");
  };

  useEffect(() => {
    const paramsIndicateEmailChange =
      routeParams?.email_changed === "1" ||
      routeParams?.email_change === "1" ||
      String(routeParams?.type || "").toLowerCase().includes("email_change") ||
      !!routeParams?.access_token ||
      !!routeParams?.refresh_token;

    if (paramsIndicateEmailChange) {
      triggerEmailChangeSuccess("route-params");
    }
  }, [
    routeParams?.email_changed,
    routeParams?.email_change,
    routeParams?.type,
    routeParams?.access_token,
    routeParams?.refresh_token,
  ]);

  useEffect(() => {
    const markEmailChangeAppLeft = async () => {
      try {
        const hasPendingEmailChange =
          (await AsyncStorage.getItem(EMAIL_CHANGE_PENDING_KEY)) === "true";

        if (hasPendingEmailChange) {
          await AsyncStorage.setItem(EMAIL_CHANGE_APP_LEFT_KEY, "true");
        }
      } catch (error) {
        console.log("Mark email change app left error:", error);
      }
    };

    const checkEmailChangeReturn = async (source: string) => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (urlLooksLikeEmailChangeConfirmation(initialUrl)) {
          await handleConfirmedEmailChangeLink(initialUrl);
          return;
        }

        const [pendingValue, successShownValue, appLeftValue] =
          await Promise.all([
            AsyncStorage.getItem(EMAIL_CHANGE_PENDING_KEY),
            AsyncStorage.getItem(EMAIL_CHANGE_SUCCESS_SHOWN_KEY),
            AsyncStorage.getItem(EMAIL_CHANGE_APP_LEFT_KEY),
          ]);

        const hasPendingEmailChange = pendingValue === "true";
        const wasSuccessShown = successShownValue === "true";
        const didLeaveApp = appLeftValue === "true";

        /**
         * أقوى fallback:
         * أحيانًا رابط تأكيد الإيميل يرجع التطبيق بدون url event واضح،
         * أو يرجع على نفس شاشة الإعدادات بدون route params.
         * لذلك إذا كان تغيير البريد معلّق، والمستخدم خرج من التطبيق ثم رجع،
         * نعرض أنيميشن النجاح فورًا بدون انتظار refreshSession.
         */
        if (
          hasPendingEmailChange &&
          !wasSuccessShown &&
          (source === "app-active-return" || source === "mount") &&
          (didLeaveApp || appWentToBackgroundRef.current)
        ) {
          await triggerEmailChangeSuccess(`pending-flag-${source}`);
        }
      } catch (error) {
        console.log("Check email change return error:", error);
      }
    };

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleConfirmedEmailChangeLink(url);
    });

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "inactive" || state === "background") {
        appWentToBackgroundRef.current = true;
        markEmailChangeAppLeft();
        return;
      }

      if (state === "active") {
        const cameBackFromBackground = appWentToBackgroundRef.current;
        appWentToBackgroundRef.current = false;

        if (cameBackFromBackground) {
          checkEmailChangeReturn("app-active-return");
        }
      }
    });

    checkEmailChangeReturn("mount");

    return () => {
      subscription.remove();
      appStateSubscription.remove();
    };
  }, [selectedLanguage, darkModeEnabled]);
  useEffect(() => {
    if (!editEmailVisible || emailSheetMode !== "success" || emailResendTimer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setEmailResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [editEmailVisible, emailSheetMode, emailResendTimer]);

  const closeHelpSheet = () => {
    Animated.timing(helpSheetDragY, {
      toValue: 420,
      duration: 170,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      helpSheetDragY.setValue(0);
      setHelpVisible(false);
    });
  };

  const helpSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 3 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dy) > 3 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        helpSheetDragY.setOffset(0);
        helpSheetDragY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const nextY = Math.max(-16, gestureState.dy);
        helpSheetDragY.setValue(nextY);
      },
      onPanResponderRelease: (_, gestureState) => {
        helpSheetDragY.flattenOffset();

        if (gestureState.dy > 80 || gestureState.vy > 0.85) {
          closeHelpSheet();
          return;
        }

        Animated.spring(helpSheetDragY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 85,
        }).start();
      },
      onPanResponderTerminate: () => {
        helpSheetDragY.flattenOffset();
        Animated.spring(helpSheetDragY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 85,
        }).start();
      },
    }),
  ).current;

  useEffect(() => {
    if (helpVisible) {
      helpSheetDragY.setValue(0);
    }
  }, [helpVisible, helpSheetDragY]);

  const handleSettingsLanguageChange = async (lang: "AR" | "EN") => {
    await changeLanguage(lang);

    try {
      await saveAppLanguageChange(lang);
    } catch (error) {
      console.log("Save language settings error:", error);
    }
  };

  const activeSelectedCarId =
    connectedCarId ||
    optimisticSelectedCarId ||
    selectedCarId ||
    activeCarId;

  const userName =
    profile?.full_name || session?.user?.user_metadata?.full_name || "مستخدم";

  useEffect(() => {
    setDisplayName(userName);
  }, [userName]);

  const userEmail =
    confirmedEmailOverride || session?.user?.email || profile?.email || profile?.username || "—";

  const userId = session?.user?.id || "—";

  const handleSelectDefaultCar = async (carId: string) => {
    if (switchingCarId) return;
    if (carId === activeSelectedCarId) return;

    setSwitchingCarId(carId);
    setOptimisticSelectedCarId(carId);

    try {
      await selectDefaultCar(carId);
      setOptimisticSelectedCarId(null);
    } catch (error) {
      console.log("Select car error:", error);

      setOptimisticSelectedCarId(null);

      showMessage({
        title: t.errorTitle,
        body:
          selectedLanguage === "AR"
            ? "تعذر اختيار السيارة. رجعنا للاختيار السابق."
            : "Could not select car. Restored previous selection.",
        icon: "alert-circle",
      });
    } finally {
      setSwitchingCarId(null);
    }
  };

  const openEditCarName = (car: UserCar) => {
    setSelectedCarForEdit(car);
    setCarNameInput(car.display_name || "");
    setEditCarVisible(true);
  };

  const handleSaveCarName = async () => {
    if (!selectedCarForEdit) return;

    setSavingCarName(true);

    try {
      await renameCar(selectedCarForEdit.id, carNameInput);

      setEditCarVisible(false);
      setSelectedCarForEdit(null);
      setCarNameInput("");

      showMessage({
        title:
          selectedLanguage === "AR"
            ? "تم تحديث اسم السيارة"
            : "Car name updated",
        body: "",
        icon: "check-circle",
      });
    } catch (error) {
      console.log("Save car name error:", error);

      showMessage({
        title: t.errorTitle,
        body:
          selectedLanguage === "AR"
            ? "تعذر تحديث اسم السيارة."
            : "Could not update car name.",
        icon: "alert-circle",
      });
    } finally {
      setSavingCarName(false);
    }
  };

  const handleDeleteCar = async (car: UserCar) => {
    if (!deleteCarPassword.trim()) {
      showMessage({
        title: t.errorTitle,
        body:
          selectedLanguage === "AR"
            ? "اكتبي كلمة مرور الحساب."
            : "Enter your account password.",
        icon: "alert-circle",
      });
      return;
    }

    setDeletingCar(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: deleteCarPassword,
      });

      if (signInError) throw signInError;

      await deleteCar(car);

      setConfirmDeleteCarVisible(false);
      setCarToDelete(null);
      setDeleteCarPassword("");

      showMessage({
        title:
          selectedLanguage === "AR"
            ? "تم حذف السيارة بالكامل"
            : "Car deleted completely",
        body: "",
        icon: "check-circle",
      });
    } catch (error) {
      console.log("Delete car error:", error);

      showMessage({
        title: t.errorTitle,
        body:
          selectedLanguage === "AR"
            ? "كلمة المرور غير صحيحة أو تعذر حذف السيارة."
            : "Wrong password or could not delete car.",
        icon: "alert-circle",
      });
    } finally {
      setDeletingCar(false);
    }
  };

  const showMessage = ({
    title,
    body,
    icon = "check-circle",
  }: {
    title: string;
    body: string;
    icon?: keyof typeof Feather.glyphMap;
  }) => {
    setMessageTitle(title);
    setMessageBody(body);
    setMessageIcon(icon);
    setMessageVisible(true);
  };

  const goToBluetoothSettings = () => {
    router.push({
      pathname: "/connection-intro",
      params: { from: "settings" },
    } as any);
  };

  const openSupportEmail = () => {
    const subject = encodeURIComponent("Tnabbah Support Request");
    const body = encodeURIComponent(
      selectedLanguage === "AR"
        ? `مرحبًا فريق تنبّه،\n\nأحتاج مساعدة بخصوص التطبيق.\n\nمعلومات الحساب:\nUser ID: ${userId}\nEmail: ${userEmail}\nCurrent Vehicle: ${selectedCarId || "—"}\nConnected Vehicle: ${connectedCarId || "—"}\nCar Connection: ${obdConnected ? "Connected" : "Disconnected"}\nData Reading: ${scannerRunning ? "Running" : "Stopped"}\nLast Connection: ${lastConnectionTime || "—"}\n\nاكتبي تفاصيل الاستفسار أو المشكلة هنا:\n`
        : `Hello Tnabbah Support,\n\nI need help with the app.\n\nAccount details:\nUser ID: ${userId}\nEmail: ${userEmail}\nCurrent Vehicle: ${selectedCarId || "—"}\nConnected Vehicle: ${connectedCarId || "—"}\nCar Connection: ${obdConnected ? "Connected" : "Disconnected"}\nData Reading: ${scannerRunning ? "Running" : "Stopped"}\nLast Connection: ${lastConnectionTime || "—"}\n\nDescribe your question or issue here:\n`,
    );

    Linking.openURL(
      `mailto:tanbbahteem@gmail.com?subject=${subject}&body=${body}`,
    );
  };

  const openWhatsAppSupport = () => {
    const message = encodeURIComponent(
      selectedLanguage === "AR"
        ? `مرحبًا، أحتاج مساعدة في تطبيق تنبّه.
User ID: ${userId}
Email: ${userEmail}
Current Vehicle: ${selectedCarId || "—"}`
        : `Hello, I need help with Tnabbah app.
User ID: ${userId}
Email: ${userEmail}
Current Vehicle: ${selectedCarId || "—"}`,
    );

    Linking.openURL(`https://wa.me/966560602239?text=${message}`);
  };

  const sendIssueReport = () => {
    const subject = encodeURIComponent("Tnabbah Issue Report");
    const body = encodeURIComponent(
      `Issue Report

User ID: ${userId}
Email: ${userEmail}
Current Vehicle: ${selectedCarId || "—"}
Connected Vehicle: ${connectedCarId || "—"}
OBD Connected: ${obdConnected}
Scanner Running: ${scannerRunning}
Data Connection: ${mqttConnected}
Last Connection: ${lastConnectionTime || "—"}

Describe the issue:
`,
    );

    Linking.openURL(
      `mailto:tanbbahteem@gmail.com?subject=${subject}&body=${body}`,
    );
  };

  const handleStopScanner = async () => {
    try {
      await stopScanner();

      showMessage({
        title: t.monitoringPaused,
        body: "",
        icon: "pause-circle",
      });
    } catch (error) {
      console.log("Stop scanner error:", error);

      showMessage({
        title: t.errorTitle,
        body:
          selectedLanguage === "AR"
            ? "تعذر إيقاف المتابعة."
            : "Could not pause monitoring.",
        icon: "alert-circle",
      });
    }
  };

  const handleDisconnectObd = async () => {
    setConfirmDisconnectVisible(false);

    try {
      await disconnectObd();

      showMessage({
        title: t.disconnectedDone,
        body: "",
        icon: "check-circle",
      });
    } catch (error) {
      console.log("Disconnect OBD error:", error);

      showMessage({
        title: t.errorTitle,
        body:
          selectedLanguage === "AR"
            ? "تعذر إنهاء اتصال السيارة."
            : "Could not end vehicle connection.",
        icon: "alert-circle",
      });
    }
  };

  const handleUpdateName = async () => {
    const realUserId = session?.user?.id;
    const cleanName = fullNameInput.trim();

    if (!realUserId || !cleanName) return;

    if (cleanName.length > MAX_NAME_LENGTH) {
      setNameSheetError(t.nameLimitError);
      return;
    }

    setSavingName(true);
    setNameSheetError("");

    try {
      /**
       * نحدث الاسم في كل مكان بدون نقل المستخدم للهوم:
       * 1) Provider الخاص بالحساب
       * 2) جدول profiles في Supabase
       * 3) user_metadata في Supabase Auth
       * 4) نعمل refresh للجلسة عشان الواجهات الثانية مثل Home تقرأ الاسم الجديد أسرع
       */
      await updateName(cleanName);

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", realUserId);

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          name: cleanName,
          display_name: cleanName,
        },
      });

      if (authUpdateError) {
        throw authUpdateError;
      }

      /**
       * هذا يساعد AuthProvider والهوم يستقبلون بيانات الجلسة الجديدة أسرع.
       * لو فشل refresh ما نوقف العملية لأن الاسم تم حفظه في profiles و metadata.
       */
      const { error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.log(
          "Refresh session after name update error:",
          refreshError.message,
        );
      }

      await supabase.auth.getUser();

      setDisplayName(cleanName);
      setNameSheetMode("success");

      setTimeout(() => {
        setEditNameVisible(false);
        setNameSheetMode("form");
      }, 1450);

      /**
       * لا يوجد router.replace هنا.
       * المستخدم يبقى في الإعدادات، ولما يروح للهوم يلقى الاسم الجديد.
       */
    } catch (error) {
      console.log("Update name error:", error);

      setNameSheetError(
        selectedLanguage === "AR"
          ? "تعذر حفظ الاسم."
          : "Could not save the name.",
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdateEmail = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const currentEmail =
      userEmail !== "—" ? userEmail.trim().toLowerCase() : "";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setEmailSheetError(
        selectedLanguage === "AR"
          ? "أدخل بريدًا إلكترونيًا صحيحًا."
          : "Enter a valid email.",
      );
      return;
    }

    if (cleanEmail === currentEmail) {
      setEmailSheetError(t.emailSameError);
      return;
    }

    setSavingEmail(true);
    setEmailSheetError("");

    try {
      emailChangeHandledRef.current = false;

      await AsyncStorage.multiSet([
        [EMAIL_CHANGE_PENDING_KEY, "true"],
        [EMAIL_CHANGE_TARGET_KEY, cleanEmail],
        [EMAIL_CHANGE_SUCCESS_SHOWN_KEY, "false"],
        [EMAIL_CHANGE_APP_LEFT_KEY, "false"],
      ]);

      const { error } = await supabase.auth.updateUser(
        { email: cleanEmail },
        { emailRedirectTo: "tnabbah://settings?email_changed=1&type=email_change" },
      );

      if (error) {
        throw error;
      }

      setEmailResendTimer(EMAIL_CHANGE_RESEND_COOLDOWN);
      setEmailResendNotice("");
      setEmailSheetMode("success");
    } catch (error: any) {
      await AsyncStorage.multiRemove([
        EMAIL_CHANGE_PENDING_KEY,
        EMAIL_CHANGE_TARGET_KEY,
        EMAIL_CHANGE_APP_LEFT_KEY,
      ]);

      const rawMessage = String(error?.message || "").toLowerCase();

      console.log("Update email error:", error?.message ?? error);

      if (
        rawMessage.includes("already registered") ||
        rawMessage.includes("already exists") ||
        rawMessage.includes("user already registered") ||
        rawMessage.includes("email address has already been registered") ||
        rawMessage.includes("email already registered") ||
        rawMessage.includes("email already exists")
      ) {
        setEmailSheetError(
          selectedLanguage === "AR"
            ? "هذا البريد الإلكتروني مستخدم في حساب آخر."
            : "This email address is already used by another account.",
        );
        return;
      }

      if (
        rawMessage.includes("invalid email") ||
        rawMessage.includes("email address is invalid") ||
        rawMessage.includes("invalid")
      ) {
        setEmailSheetError(
          selectedLanguage === "AR"
            ? "أدخل بريدًا إلكترونيًا صحيحًا."
            : "Enter a valid email address.",
        );
        return;
      }

      if (
        rawMessage.includes("rate limit") ||
        rawMessage.includes("too many") ||
        rawMessage.includes("too many requests")
      ) {
        setEmailSheetError(
          selectedLanguage === "AR"
            ? "تمت محاولات كثيرة. انتظر قليلًا ثم جرّب مرة أخرى."
            : "Too many attempts. Please wait a moment and try again.",
        );
        return;
      }

      setEmailSheetError(t.emailChangeError);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleResendEmailChangeLink = async () => {
    if (emailResendTimer > 0 || resendingEmailLink) return;

    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setEmailResendNotice("");
      setEmailSheetError(
        selectedLanguage === "AR"
          ? "أدخل بريدًا إلكترونيًا صحيحًا."
          : "Enter a valid email address.",
      );
      setEmailSheetMode("form");
      return;
    }

    setResendingEmailLink(true);
    setEmailResendNotice("");

    try {
      const { error } = await supabase.auth.updateUser(
        { email: cleanEmail },
        { emailRedirectTo: "tnabbah://settings?email_changed=1&type=email_change" },
      );

      if (error) {
        throw error;
      }

      setEmailResendTimer(EMAIL_CHANGE_RESEND_COOLDOWN);
      setEmailResendNotice(
        selectedLanguage === "AR"
          ? "تم إرسال رابط التأكيد مرة أخرى."
          : "The confirmation link was sent again.",
      );
    } catch (error: any) {
      const rawMessage = String(error?.message || "").toLowerCase();

      console.log("Resend email change link error:", error?.message ?? error);

      if (
        rawMessage.includes("rate limit") ||
        rawMessage.includes("too many") ||
        rawMessage.includes("too many requests")
      ) {
        setEmailResendNotice(
          selectedLanguage === "AR"
            ? "تمت محاولات كثيرة. انتظر قليلًا ثم جرّب مرة أخرى."
            : "Too many attempts. Please wait a moment and try again.",
        );
        setEmailResendTimer(EMAIL_CHANGE_RESEND_COOLDOWN);
        return;
      }

      setEmailResendNotice(
        selectedLanguage === "AR"
          ? "تعذر إعادة إرسال الرابط الآن. جرّب بعد قليل."
          : "Could not resend the link right now. Please try again later.",
      );
    } finally {
      setResendingEmailLink(false);
    }
  };

  const handleDeleteAccountVerification = async () => {
    if (!userEmail || userEmail === "—") return;

    if (!deletePassword.trim()) {
      showMessage({
        title: t.errorTitle,
        body:
          selectedLanguage === "AR"
            ? "أدخل كلمة المرور الحالية."
            : "Enter your current password.",
        icon: "alert-circle",
      });

      return;
    }

    setDeletingAccount(true);

    try {
      await deleteAccount(deletePassword);

      setDeleteAccountVisible(false);
      setDeletePassword("");

      showMessage({
        title:
          selectedLanguage === "AR"
            ? "تم حذف الحساب نهائيًا"
            : "Account deleted permanently",
        body: "",
        icon: "check-circle",
      });

      setTimeout(async () => {
        router.replace("/start" as any);
      }, 1200);
    } catch (error) {
      console.log("Delete account verify error:", error);

      showMessage({
        title: t.errorTitle,
        body:
          selectedLanguage === "AR"
            ? "حدث خطأ أثناء التحقق."
            : "Verification failed.",
        icon: "alert-circle",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleLogout = () => {
    if (loggingOut) return;

    setLoggingOut(true);

    const lastDarkModeValue = darkModeEnabled ? "true" : "false";

    const logoutSafely = async () => {
      try {
        // نحفظ آخر ثيم قبل الخروج عشان Start/Login/Register يطلعوا بنفس آخر وضع.
        await AsyncStorage.setItem(APP_DARK_MODE_KEY, lastDarkModeValue);
      } catch (error) {
        console.log("Save theme before logout error:", error);
      }

      // ننقل المستخدم مباشرة للبداية بدون انتظار الشبكة.
      requestAnimationFrame(() => {
        router.replace("/start" as any);
      });

      try {
        await logout(disconnectObd);
      } catch (error) {
        console.log("Logout error:", error);

        try {
          // لو Supabase فشل بسبب الشبكة، نسوي خروج محلي فقط حتى ما يعلق التطبيق.
          await supabase.auth.signOut({ scope: "local" });
        } catch (localLogoutError) {
          console.log("Local logout error:", localLogoutError);
        }
      } finally {
        try {
          // لو logout مسح AsyncStorage، نرجّع آخر قيمة للثيم بصيغة صحيحة.
          await AsyncStorage.setItem(APP_DARK_MODE_KEY, lastDarkModeValue);
        } catch (restoreError) {
          console.log("Restore theme after logout error:", restoreError);
        }

        setLoggingOut(false);
      }
    };

    logoutSafely();
  };

  const rowDirection = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const alignItems = isRTL ? "flex-end" : "flex-start";
  const iconMargin = isRTL ? { marginLeft: 12 } : { marginRight: 12 };

  if (!fontsLoaded || settingsLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={["top"]}
      >
        <Stack.Screen
          options={{
            gestureEnabled: false,
          }}
        />

        <View style={styles.loadingSettingsContainer}>
          <ActivityIndicator size="small" color={theme.iconColor} />
        </View>

        <AppMessageModal
          visible={messageVisible}
          title={messageTitle}
          message={messageBody}
          icon={messageIcon}
          buttonText={t.ok}
          theme={theme}
          isRTL={isRTL}
          onClose={() => setMessageVisible(false)}
        />

      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <Stack.Screen
        options={{
          gestureEnabled: false,
        }}
      />

      <StatusBar
        barStyle={darkModeEnabled ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <View
        style={[
          styles.header,
          {
            flexDirection: rowDirection,
            backgroundColor: theme.background,
          },
        ]}
      >
        <View style={styles.headerSide} />

        <Text
          allowFontScaling={false}
          style={[styles.headerTitle, { color: theme.textPrimary }]}
        >
          {t.settings}
        </Text>

        <View style={styles.headerSide} />
      </View>

      <View
        style={[styles.headerDivider, { backgroundColor: theme.headerDivider }]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary, textAlign },
          ]}
        >
          {t.account}
        </Text>

        <View
          style={[
            styles.accountCard,
            {
              backgroundColor: theme.accent,
              borderColor: theme.accentBorder,
              shadowColor: theme.accent,
            },
          ]}
        >
          <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.settingLabelContainer,
                { flexDirection: rowDirection },
              ]}
            >
              <View style={[styles.accountAvatar, iconMargin]}>
                <Feather name="user" size={22} color="#FFFFFF" />
              </View>

              <View style={[styles.userInfo, { alignItems }]}>
                <View
                  style={[
                    styles.accountNameRow,
                    {
                      flexDirection: rowDirection,
                      alignSelf: isRTL ? "flex-end" : "flex-start",
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.userName, { color: "#FFFFFF", textAlign }]}
                  >
                    {displayName || userName}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  style={[styles.userEmail, { color: "#FFFFFF", textAlign }]}
                >
                  {userEmail}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={() => {
            setFullNameInput(
              (displayName === "مستخدم" ? "" : displayName).slice(
                0,
                MAX_NAME_LENGTH,
              ),
            );
            setNameSheetError("");
            setNameSheetMode("form");
            setEditNameVisible(true);
          }}
        >
          <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.settingLabelContainer,
                { flexDirection: rowDirection },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  iconMargin,
                  { backgroundColor: theme.iconBg },
                ]}
              >
                <Feather name="type" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems }]}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {selectedLanguage === "AR" ? "تعديل الاسم" : "Edit Name"}
                </Text>

                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.settingHint,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {selectedLanguage === "AR"
                    ? "تغيير الاسم الظاهر في الحساب"
                    : "Change the display name on the account"}
                </Text>
              </View>
            </View>

            <EditActionPill
              label={selectedLanguage === "AR" ? "تعديل" : "Edit"}
              theme={theme}
              isRTL={isRTL}
            />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={() => {
            setEmailInput(userEmail !== "—" ? userEmail : "");
            setEmailSheetError("");
            setEmailResendNotice("");
            setEmailResendTimer(0);
            setEmailSheetMode("form");
            setEditEmailVisible(true);
          }}
        >
          <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.settingLabelContainer,
                { flexDirection: rowDirection },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  iconMargin,
                  { backgroundColor: theme.iconBg },
                ]}
              >
                <Feather name="mail" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems }]}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {selectedLanguage === "AR" ? "تعديل البريد الإلكتروني" : "Edit Email"}
                </Text>

                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={[
                    styles.settingHint,
                    styles.settingHintTwoLines,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {selectedLanguage === "AR"
                    ? "سيتم إرسال رابط تأكيد إلى البريد الإلكتروني الجديد"
                    : "A confirmation link will be sent to the new\nemail address"}
                </Text>
              </View>
            </View>

            <EditActionPill
              label={selectedLanguage === "AR" ? "تعديل" : "Edit"}
              theme={theme}
              isRTL={isRTL}
            />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={async () => {
            try {
              await AsyncStorage.multiSet([
                ["password_change_return_to_settings", "true"],
                ["password_change_started_from_settings", "true"],
              ]);
            } catch (error) {
              console.log("Save password return target error:", error);
            }

            router.push({
              pathname: "/forgot-password",
              params: {
                email: userEmail !== "—" ? userEmail : "",
                from: "settings",
              },
            } as any);
          }}
        >
          <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.settingLabelContainer,
                { flexDirection: rowDirection },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  iconMargin,
                  { backgroundColor: theme.iconBg },
                ]}
              >
                <Feather name="lock" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems }]}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {selectedLanguage === "AR"
                    ? "تغيير كلمة المرور"
                    : "Change Password"}
                </Text>

                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={[
                    styles.settingHint,
                    styles.settingHintTwoLines,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {selectedLanguage === "AR"
                    ? "إرسال رمز للتحقق قبل تغيير كلمة المرور"
                    : "Send a verification code before changing\nthe password"}
                </Text>
              </View>
            </View>

            <EditActionPill
              label={selectedLanguage === "AR" ? "تعديل" : "Edit"}
              theme={theme}
              isRTL={isRTL}
            />
          </View>
        </Pressable>

        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary, textAlign },
          ]}
        >
          {t.appSettings}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={() => handleNotificationsChange(!notificationsEnabled)}
        >
          <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.settingLabelContainer,
                { flexDirection: rowDirection },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  iconMargin,
                  { backgroundColor: theme.iconBg },
                ]}
              >
                <Feather
                  name={notificationsEnabled ? "bell" : "bell-off"}
                  size={20}
                  color={theme.iconColor}
                />
              </View>

              <View style={[styles.labelBlock, { alignItems }]}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {notificationsEnabled
                    ? t.notifications
                    : selectedLanguage === "AR"
                      ? "الإشعارات متوقفة"
                      : "Notifications Off"}
                </Text>

                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.settingHint,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {notificationsEnabled
                    ? t.notificationsDesc
                    : selectedLanguage === "AR"
                      ? "لن تصلك تنبيهات الفحص والتذكيرات"
                      : "You will not receive scan alerts or reminders"}
                </Text>
              </View>
            </View>

            <AppSwitch
              value={notificationsEnabled}
              onValueChange={handleNotificationsChange}
              trackOnColor={theme.accent}
              trackOffColor={theme.border}
            />
          </View>
        </Pressable>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.settingLabelContainer,
                { flexDirection: rowDirection },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  iconMargin,
                  { backgroundColor: theme.iconBg },
                ]}
              >
                <Feather name="globe" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems }]}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {t.language}
                </Text>

                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.settingHint,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {selectedLanguage === "AR"
                    ? "لغة التطبيق الحالية: العربية"
                    : "Current app language: English"}
                </Text>
              </View>
            </View>

            <View style={[styles.segment, { backgroundColor: theme.subtle }]}>
              <Pressable
                style={[
                  styles.segmentItem,
                  selectedLanguage === "AR" && [styles.segmentItemActive, { backgroundColor: theme.accent }],
                ]}
                onPress={() => handleSettingsLanguageChange("AR")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: theme.textSecondary },
                    selectedLanguage === "AR" && styles.segmentTextActive,
                  ]}
                >
                  AR
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.segmentItem,
                  selectedLanguage === "EN" && [styles.segmentItemActive, { backgroundColor: theme.accent }],
                ]}
                onPress={() => handleSettingsLanguageChange("EN")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: theme.textSecondary },
                    selectedLanguage === "EN" && styles.segmentTextActive,
                  ]}
                >
                  EN
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={() => handleDarkModeChange(!darkModeEnabled)}
        >
          <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.settingLabelContainer,
                { flexDirection: rowDirection },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  iconMargin,
                  { backgroundColor: theme.iconBg },
                ]}
              >
                <Feather
                  name={darkModeEnabled ? "moon" : "sun"}
                  size={20}
                  color={theme.iconColor}
                />
              </View>

              <View style={[styles.labelBlock, { alignItems }]}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {darkModeEnabled
                    ? t.darkMode
                    : selectedLanguage === "AR"
                      ? "الوضع الفاتح"
                      : "Light Mode"}
                </Text>

                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.settingHint,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {darkModeEnabled
                    ? selectedLanguage === "AR"
                      ? "المظهر الداكن مفعل الآن"
                      : "Dark appearance is currently active"
                    : selectedLanguage === "AR"
                      ? "المظهر الفاتح مفعل الآن"
                      : "Light appearance is currently active"}
                </Text>
              </View>
            </View>

            <AppSwitch
              value={darkModeEnabled}
              onValueChange={handleDarkModeChange}
              trackOnColor={theme.accent}
              trackOffColor={theme.border}
            />
          </View>
        </Pressable>

        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary, textAlign },
          ]}
        >
          {t.cars}
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.settingLabelContainer,
                { flexDirection: rowDirection },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  iconMargin,
                  { backgroundColor: theme.iconBg },
                ]}
              >
                <Ionicons
                  name="car-sport-outline"
                  size={20}
                  color={theme.iconColor}
                />
              </View>

              <View style={[styles.labelBlock, { alignItems }]}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {t.currentCar}
                </Text>

                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.settingHint,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {userCars.find((car) => car.car_id === activeSelectedCarId)
                    ?.display_name ||
                    activeSelectedCarId ||
                    t.noCar}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.carInfoGrid, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.carInfoPill,
                {
                  backgroundColor: darkModeEnabled ? "#2A2A2A" : theme.subtle,
                  borderColor: darkModeEnabled ? "#3D3D3D" : theme.cardBorder,
                },
              ]}
            >
              <Text
                style={[styles.carInfoLabel, { color: theme.textSecondary }]}
              >
                {t.totalCars}
              </Text>

              <Text style={[styles.carInfoValue, { color: theme.textPrimary }]}>
                {userCars.length}
              </Text>
            </View>

            <View
              style={[
                styles.carInfoPill,
                {
                  backgroundColor: obdConnected
                    ? theme.successBg
                    : theme.dangerBg,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <Text
                style={[styles.carInfoLabel, { color: theme.textSecondary }]}
              >
                {t.carConnection}
              </Text>

              <Text
                style={[
                  styles.carInfoValue,
                  { color: obdConnected ? COLORS.success : theme.danger },
                ]}
              >
                {obdConnected ? t.connected : t.disconnected}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: connectedCarId ? COLORS.success : theme.textSecondary,
              textAlign,
              marginTop: 10,
              fontSize: 12,
              fontFamily: FONT_BOLD,
            }}
          >
            {connectedCarId
              ? selectedLanguage === "AR"
                ? `السيارة المتصلة الآن: ${userCars.find((car) => car.car_id === connectedCarId)
                  ?.display_name || connectedCarId
                }`
                : `Connected now: ${userCars.find((car) => car.car_id === connectedCarId)
                  ?.display_name || connectedCarId
                }`
              : selectedLanguage === "AR"
                ? "لا توجد سيارة متصلة الآن"
                : "No car is connected now"}
          </Text>

          <View
            style={[
              styles.panelDivider,
              { backgroundColor: theme.headerDivider, marginTop: 16 },
            ]}
          />

          {userCars.length === 0 ? (
            <Text
              style={{
                color: theme.textSecondary,
                textAlign,
                marginTop: 16,
                fontSize: 13,
              }}
            >
              {connectedCarId
                ? selectedLanguage === "AR"
                  ? "تم العثور على آخر سيارة متصلة، وسيتم حفظها عند وصول أول تحديث اتصال."
                  : "Last connected car found. It will be saved when the next connection update arrives."
                : selectedLanguage === "AR"
                  ? "لا توجد سيارات محفوظة بعد. اربطي قطعة السيارة لإضافة أول سيارة."
                  : "No saved cars yet. Connect a device to add your first car."}
            </Text>
          ) : (
            <View style={{ marginTop: 12, gap: 12 }}>
              {userCars.map((car) => {
                const isCurrent = activeSelectedCarId === car.car_id;
                const isSwitchingThisCar = switchingCarId === car.car_id;
                const isConnectedNow = connectedCarId === car.car_id;

                const isLockedByConnectedCar =
                  (!!connectedCarId || (detectingCar && !obdConnected)) &&
                  !isConnectedNow;

                const canSelectThisCar =
                  !isCurrent && !isLockedByConnectedCar && !switchingCarId;

                return (
                  <Pressable
                    key={car.id}
                    onPress={() => {
                      if (canSelectThisCar) {
                        handleSelectDefaultCar(car.car_id);
                      }
                    }}
                    disabled={!canSelectThisCar}
                    style={({ pressed }) => [
                      styles.carCard,
                      {
                        backgroundColor: isCurrent
                          ? "rgba(135,27,23,0.08)"
                          : theme.subtle,

                        borderColor: isCurrent
                          ? "#5F201D"
                          : theme.cardBorder,

                        transform: [{ scale: isCurrent ? 1.01 : 1 }],
                        shadowOpacity: isCurrent ? 0.12 : 0.03,
                        shadowRadius: isCurrent ? 10 : 6,
                        elevation: isCurrent ? 4 : 1,

                        opacity: isLockedByConnectedCar ? 0.45 : 1,
                      }, ,
                      pressed && canSelectThisCar && {
                        backgroundColor: "rgba(135,27,23,0.12)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.settingRow,
                        {
                          flexDirection: rowDirection,
                          alignItems: "flex-start",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.settingLabelContainer,
                          {
                            flexDirection: rowDirection,
                            flex: 1,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.iconWrapper,
                            iconMargin,
                            {
                              backgroundColor: theme.iconBg,
                            },
                          ]}
                        >
                          <Ionicons
                            name="car-sport-outline"
                            size={18}
                            color={theme.iconColor}
                          />
                        </View>

                        <View
                          style={[
                            styles.labelBlock,
                            {
                              alignItems,
                              flex: 1,
                            },
                          ]}
                        >
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.settingLabel,
                              {
                                color: theme.textPrimary,
                                textAlign,
                              },
                            ]}
                          >
                            {car.display_name ||
                              `${selectedLanguage === "AR" ? "سيارة" : "Car"
                              } ${car.car_id}`}
                          </Text>

                          {isConnectedNow && (
                            <View
                              style={{
                                alignSelf: isRTL ? "flex-end" : "flex-start",
                                backgroundColor: theme.successBg,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                marginTop: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: COLORS.success,
                                  fontSize: 11,
                                  fontFamily: FONT_EXTRABOLD,
                                }}
                              >
                                {selectedLanguage === "AR"
                                  ? "متصلة الآن"
                                  : "Connected now"}
                              </Text>
                            </View>
                          )}

                          {isCurrent && !isConnectedNow && (
                            <View
                              style={{
                                alignSelf: isRTL ? "flex-end" : "flex-start",
                                backgroundColor: "rgba(135,27,23,0.10)",
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                marginTop: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: theme.accent,
                                  fontSize: 11,
                                  fontFamily: FONT_EXTRABOLD,
                                }}
                              >
                                {selectedLanguage === "AR" ? "مختارة حاليًا" : "Selected now"}
                              </Text>
                            </View>
                          )}

                          <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={[
                              styles.settingHint,
                              {
                                color: theme.textSecondary,
                                textAlign,
                                marginTop: 4,
                              },
                            ]}
                          >
                            ID: {car.car_id}
                          </Text>

                          <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={[
                              styles.settingHint,
                              {
                                color: theme.textSecondary,
                                textAlign,
                                marginTop: 2,
                              },
                            ]}
                          >
                            {selectedLanguage === "AR"
                              ? "آخر اتصال:"
                              : "Last connection:"}{" "}
                            {car.last_connected_at
                              ? new Date(car.last_connected_at).toLocaleString()
                              : "—"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: rowDirection,
                        gap: 8,
                        marginTop: 14,
                      }}
                    >


                      <Pressable
                        onPress={() => openEditCarName(car)}
                        style={{
                          backgroundColor: theme.iconBg,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: theme.textPrimary,
                            fontSize: 12,
                            fontFamily: FONT_BOLD,
                          }}
                        >
                          {selectedLanguage === "AR" ? "تعديل" : "Rename"}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setCarToDelete(car);
                          setDeleteCarPassword("");
                          setConfirmDeleteCarVisible(true);
                        }}
                        style={{
                          backgroundColor: theme.iconBg,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: theme.danger,
                            fontSize: 12,
                            fontFamily: FONT_BOLD,
                          }}
                        >
                          {selectedLanguage === "AR" ? "حذف" : "Delete"}
                        </Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary, textAlign },
          ]}
        >
          {t.vehicleConnection}
        </Text>

        <View
          style={[
            styles.connectionPanel,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <View style={[styles.statusGrid, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.miniStatusCard,
                {
                  backgroundColor: obdConnected
                    ? theme.successBg
                    : theme.dangerBg,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <Feather
                name="radio"
                size={17}
                color={obdConnected ? COLORS.success : theme.danger}
              />

              <Text
                style={[styles.miniStatusTitle, { color: theme.textSecondary }]}
              >
                {t.deviceStatus}
              </Text>

              <Text
                style={[
                  styles.miniStatusText,
                  { color: obdConnected ? COLORS.success : theme.danger },
                ]}
              >
                {obdConnected ? t.connected : t.disconnected}
              </Text>
            </View>

            <View
              style={[
                styles.miniStatusCard,
                {
                  backgroundColor: scannerRunning
                    ? theme.successBg
                    : theme.subtle,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <Feather
                name="activity"
                size={17}
                color={scannerRunning ? COLORS.success : theme.textSecondary}
              />

              <Text
                style={[styles.miniStatusTitle, { color: theme.textSecondary }]}
              >
                {t.scanStatus}
              </Text>

              <Text
                style={[
                  styles.miniStatusText,
                  {
                    color: scannerRunning
                      ? COLORS.success
                      : theme.textSecondary,
                  },
                ]}
              >
                {scannerRunning ? t.scannerOn : t.scannerOff}
              </Text>
            </View>

            <View
              style={[
                styles.miniStatusCard,
                {
                  backgroundColor: mqttConnected
                    ? theme.successBg
                    : theme.dangerBg,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <Feather
                name="wifi"
                size={17}
                color={mqttConnected ? COLORS.success : theme.danger}
              />

              <Text
                style={[styles.miniStatusTitle, { color: theme.textSecondary }]}
              >
                {t.dataConnection}
              </Text>

              <Text
                style={[
                  styles.miniStatusText,
                  { color: mqttConnected ? COLORS.success : theme.danger },
                ]}
              >
                {mqttConnected ? t.connected : t.disconnected}
              </Text>
            </View>
          </View>

          {lastConnectionTime && (
            <Text
              style={{
                color: theme.textSecondary,
                textAlign,
                fontSize: 12,
                fontFamily: FONT_BOLD,
                paddingHorizontal: 16,
                paddingBottom: 12,
              }}
            >
              {selectedLanguage === "AR" ? "آخر اتصال:" : "Last connection:"}{" "}
              {new Date(lastConnectionTime).toLocaleString()}
            </Text>
          )}

          <View
            style={[
              styles.panelDivider,
              { backgroundColor: theme.headerDivider },
            ]}
          />

          <Pressable
            style={({ pressed }) => [
              styles.connectionRow,
              pressed && { backgroundColor: theme.cardPressed },
            ]}
            onPress={goToBluetoothSettings}
          >
            <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
              <View
                style={[
                  styles.settingLabelContainer,
                  { flexDirection: rowDirection },
                ]}
              >
                <View
                  style={[
                    styles.iconWrapper,
                    iconMargin,
                    { backgroundColor: theme.iconBg },
                  ]}
                >
                  <Feather name="bluetooth" size={20} color={theme.iconColor} />
                </View>

                <View style={[styles.labelBlock, { alignItems }]}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: theme.textPrimary, textAlign },
                    ]}
                  >
                    {t.bluetoothSettings}
                  </Text>

                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.settingHint,
                      { color: theme.textSecondary, textAlign },
                    ]}
                  >
                    {t.bluetoothSettingsDesc}
                  </Text>
                </View>
              </View>

              <Feather
                name={isRTL ? "chevron-left" : "chevron-right"}
                size={18}
                color={theme.textSecondary}
              />
            </View>
          </Pressable>

          <View
            style={[
              styles.panelDivider,
              { backgroundColor: theme.headerDivider },
            ]}
          />

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.iconBg,
                borderColor: theme.cardBorder,
              },
              pressed &&
              scannerRunning && {
                backgroundColor: theme.cardPressed,
              },
              !scannerRunning && { opacity: 0.45 },
            ]}
            onPress={handleStopScanner}
            disabled={!scannerRunning}
          >
            <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
              <View
                style={[
                  styles.settingLabelContainer,
                  { flexDirection: rowDirection },
                ]}
              >
                <View
                  style={[
                    styles.smallIconWrapper,
                    iconMargin,
                    { backgroundColor: theme.iconBg },
                  ]}
                >
                  <Feather
                    name="pause-circle"
                    size={18}
                    color={theme.iconColor}
                  />
                </View>

                <View style={[styles.labelBlock, { alignItems }]}>
                  <Text
                    style={[
                      styles.actionLabel,
                      { color: theme.textPrimary, textAlign },
                    ]}
                  >
                    {t.pauseMonitoring}
                  </Text>

                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.settingHint,
                      { color: theme.textSecondary, textAlign },
                    ]}
                  >
                    {t.pauseMonitoringDesc}
                  </Text>
                </View>
              </View>

              <Feather
                name={isRTL ? "chevron-left" : "chevron-right"}
                size={17}
                color={theme.textSecondary}
              />
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.iconBg,
                borderColor: theme.cardBorder,
              },
              pressed &&
              obdConnected && {
                backgroundColor: theme.cardPressed,
              },
              !obdConnected && { opacity: 0.45 },
            ]}
            onPress={() => {
              if (!obdConnected) return;
              setConfirmDisconnectVisible(true);
            }}
            disabled={!obdConnected}
          >
            <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
              <View
                style={[
                  styles.settingLabelContainer,
                  { flexDirection: rowDirection },
                ]}
              >
                <View
                  style={[
                    styles.smallIconWrapper,
                    iconMargin,
                    { backgroundColor: theme.iconBg },
                  ]}
                >
                  <Feather name="power" size={18} color={theme.iconColor} />
                </View>

                <View style={[styles.labelBlock, { alignItems }]}>
                  <Text
                    style={[
                      styles.actionLabel,
                      { color: theme.textPrimary, textAlign },
                    ]}
                  >
                    {t.endVehicleConnection}
                  </Text>

                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.settingHint,
                      { color: theme.textSecondary, textAlign },
                    ]}
                  >
                    {t.endVehicleConnectionDesc}
                  </Text>
                </View>
              </View>

              <Feather
                name={isRTL ? "chevron-left" : "chevron-right"}
                size={17}
                color={theme.textSecondary}
              />
            </View>
          </Pressable>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary, textAlign },
          ]}
        >
          {t.helpSupport}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={() => setHelpVisible(true)}
        >
          <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.settingLabelContainer,
                { flexDirection: rowDirection },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  iconMargin,
                  { backgroundColor: theme.iconBg },
                ]}
              >
                <Feather name="help-circle" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems }]}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {t.help}
                </Text>

                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.settingHint,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {t.helpDesc}
                </Text>
              </View>
            </View>

            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={18}
              color={theme.textSecondary}
            />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorder,
            },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={() => setDeleteAccountVisible(true)}
        >
          <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
            <View
              style={[
                styles.settingLabelContainer,
                { flexDirection: rowDirection },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  iconMargin,
                  { backgroundColor: theme.iconBg },
                ]}
              >
                <Feather name="trash-2" size={20} color={theme.danger} />
              </View>

              <View style={[styles.labelBlock, { alignItems }]}>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.danger,
                      textAlign,
                    },
                  ]}
                >
                  {selectedLanguage === "AR" ? "حذف الحساب" : "Delete Account"}
                </Text>

                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={[
                    styles.settingHint,
                    styles.settingHintTwoLines,
                    {
                      color: theme.textSecondary,
                      textAlign,
                    },
                  ]}
                >
                  {selectedLanguage === "AR"
                    ? "حذف نهائي للحساب ويتطلب كلمة المرور الحالية"
                    : "Permanently deletes the account and requires\nthe current password"}
                </Text>
              </View>
            </View>

            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={18}
              color={theme.textSecondary}
            />
          </View>
        </Pressable>

        <View style={styles.logoutSection}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutButtonWrapper,
              loggingOut && styles.logoutButtonDisabled,
              pressed && !loggingOut && { opacity: 0.92 },
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <LinearGradient
              colors={[theme.accent, theme.accentPressed]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.logoutGradient}
            >
              <View style={styles.logoutShine} />

              <View
                style={[styles.logoutInner, { flexDirection: rowDirection }]}
              >
                {loggingOut ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                    style={styles.logoutSpinner}
                  />
                ) : (
                  <Feather name="log-out" size={18} color="#FFFFFF" />
                )}

                <Text style={styles.logoutText}>
                  {loggingOut ? t.loggingOut : t.logout}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      {switchingCarId && (
        <View style={styles.fullScreenBlockingOverlay}>
          <View
            style={[
              styles.blockingOverlayCard,
              { backgroundColor: theme.surface },
            ]}
          >
            <ActivityIndicator size="small" color={theme.accent} />

            <Text
              style={[styles.blockingOverlayText, { color: theme.textPrimary }]}
            >
              {selectedLanguage === "AR"
                ? "جاري تبديل السيارة..."
                : "Switching vehicle..."}
            </Text>
          </View>
        </View>
      )}

      {detectingCar && (
        <View style={styles.fullScreenBlockingOverlay}>
          <View
            style={[
              styles.blockingOverlayCard,
              { backgroundColor: theme.surface },
            ]}
          >
            <ActivityIndicator size="small" color={theme.accent} />

            <Text
              style={[styles.blockingOverlayText, { color: theme.textPrimary }]}
            >
              {selectedLanguage === "AR"
                ? "جاري التعرف على السيارة..."
                : "Detecting vehicle..."}
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={helpVisible}
        transparent
        animationType="slide"
        onRequestClose={closeHelpSheet}
      >
        <View
          style={[styles.helpBottomOverlay, { backgroundColor: theme.modalOverlay }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeHelpSheet}
          />

          <Animated.View
            style={[
              styles.helpModal,
              {
                backgroundColor: darkModeEnabled ? "#202020" : "#FFFFFF",
                borderColor: darkModeEnabled ? "#343434" : "#DCDCDC",
                transform: [{ translateY: helpSheetDragY }],
              },
            ]}
          >
            <View
              style={styles.helpSheetHandleArea}
              {...helpSheetPanResponder.panHandlers}
            >
              <View
                style={[
                  styles.helpSheetHandle,
                  { backgroundColor: darkModeEnabled ? "#4A4A4A" : "#D8D8D8" },
                ]}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.helpScrollContent}
            >
              <View
                style={[styles.helpHeader, { flexDirection: rowDirection }]}
              >
                <View style={[styles.helpHeaderTextBlock, { alignItems }]}>
                  <Text
                    style={[
                      styles.helpTitle,
                      { color: theme.textPrimary, textAlign },
                    ]}
                  >
                    {t.helpSupport}
                  </Text>

                  <Text
                    style={[
                      styles.helpIntroText,
                      { color: theme.textSecondary, textAlign },
                    ]}
                  >
                    {t.helpIntro}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: darkModeEnabled ? "#2A2A2A" : "#F7F7F7",
                    borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.helpQuestion,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {t.faqConnectionQuestion}
                </Text>
                <Text
                  style={[
                    styles.helpAnswer,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {t.faqConnectionAnswer}
                </Text>
              </View>

              <View
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: darkModeEnabled ? "#2A2A2A" : "#F7F7F7",
                    borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.helpQuestion,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {t.faqNotificationsQuestion}
                </Text>
                <Text
                  style={[
                    styles.helpAnswer,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {t.faqNotificationsAnswer}
                </Text>
              </View>

              <View
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: darkModeEnabled ? "#2A2A2A" : "#F7F7F7",
                    borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.helpQuestion,
                    { color: theme.textPrimary, textAlign },
                  ]}
                >
                  {t.faqReportQuestion}
                </Text>
                <Text
                  style={[
                    styles.helpAnswer,
                    { color: theme.textSecondary, textAlign },
                  ]}
                >
                  {t.faqReportAnswer}
                </Text>
              </View>

              <Pressable
                onPress={openWhatsAppSupport}
                style={({ pressed }) => [
                  styles.supportMainButton,
                  styles.supportWhatsAppMainButton,
                  { opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <Feather name="message-circle" size={20} color="#FFFFFF" />
                <Text style={styles.supportMainButtonText}>
                  {t.supportWhatsAppButton}
                </Text>
              </Pressable>

              <Pressable
                onPress={openSupportEmail}
                style={({ pressed }) => [
                  styles.supportMainButton,
                  styles.supportEmailMainButton,
                  { backgroundColor: theme.accent, opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <Feather name="mail" size={20} color="#FFFFFF" />
                <Text style={styles.supportMainButtonText}>
                  {t.supportEmailButton}
                </Text>
              </Pressable>

              <Pressable
                onPress={sendIssueReport}
                style={({ pressed }) => [
                  styles.supportIssueFullButton,
                  {
                    backgroundColor: darkModeEnabled ? "#2A2A2A" : "#F3F4F6",
                    borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <Feather
                  name="alert-circle"
                  size={20}
                  color={theme.accent}
                />
                <Text
                  style={[
                    styles.supportIssueFullButtonText,
                    { color: theme.accent },
                  ]}
                >
                  {t.reportIssueButton}
                </Text>
              </Pressable>

              <Pressable
                onPress={closeHelpSheet}
                style={({ pressed }) => [
                  styles.closeHelpButton,
                  {
                    backgroundColor: darkModeEnabled ? "#252525" : "#FFFFFF",
                    borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.closeHelpButtonText,
                    { color: theme.textPrimary },
                  ]}
                >
                  {t.cancel}
                </Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <ConfirmModal
        visible={confirmDisconnectVisible}
        title={t.disconnectTitle}
        message={t.disconnectMessage}
        confirmText={t.confirm}
        cancelText={t.cancel}
        icon="power"
        theme={theme}
        isRTL={isRTL}
        styles={styles}
        onCancel={() => setConfirmDisconnectVisible(false)}
        onConfirm={handleDisconnectObd}
      />

      <DeleteCarModal
        visible={confirmDeleteCarVisible}
        password={deleteCarPassword}
        onChangePassword={setDeleteCarPassword}
        loading={deletingCar}
        theme={theme}
        isRTL={isRTL}
        onCancel={() => {
          if (deletingCar) return;
          setConfirmDeleteCarVisible(false);
          setCarToDelete(null);
          setDeleteCarPassword("");
        }}
        onConfirm={() => {
          if (carToDelete) {
            handleDeleteCar(carToDelete);
          }
        }}
      />

      <AppMessageModal
        visible={messageVisible}
        title={messageTitle}
        message={messageBody}
        icon={messageIcon}
        buttonText={t.ok}
        theme={theme}
        isRTL={isRTL}
        onClose={() => setMessageVisible(false)}
      />
        <EmailChangeSuccessOverlay
          visible={emailChangeSuccessVisible}
          title={emailChangeSuccessTitle}
          message={emailChangeSuccessMessage}
          isDarkMode={darkModeEnabled}
          onFinish={() => setEmailChangeSuccessVisible(false)}
        />

      <BottomEditSheet
        visible={editNameVisible}
        title={selectedLanguage === "AR" ? "تعديل الاسم" : "Edit Name"}
        subtitle={
          selectedLanguage === "AR"
            ? "أدخل الاسم الذي سيظهر في الحساب."
            : "Enter the name that will appear on the account."
        }
        value={fullNameInput}
        onChangeText={(text: string) => {
          setNameSheetError("");
          setFullNameInput(text.slice(0, MAX_NAME_LENGTH));
        }}
        placeholder={selectedLanguage === "AR" ? "الاسم" : "Name"}
        maxLength={MAX_NAME_LENGTH}
        onClose={() => {
          setEditNameVisible(false);
          setNameSheetMode("form");
          setNameSheetError("");
        }}
        onSave={handleUpdateName}
        saving={savingName}
        theme={theme}
        isRTL={isRTL}
        confirmText={t.confirm}
        cancelText={t.cancel}
        mode={nameSheetMode}
        successTitle={
          selectedLanguage === "AR" ? "تم حفظ الاسم" : "Name saved"
        }
        successMessage={
          selectedLanguage === "AR"
            ? "تم حفظ الاسم الجديد في الحساب."
            : "The new name has been saved."
        }
        errorMessage={nameSheetError}
      />

      <BottomEditSheet
        visible={editEmailVisible}
        title={selectedLanguage === "AR" ? "تعديل البريد الإلكتروني" : "Edit Email"}
        subtitle={
          selectedLanguage === "AR"
            ? "أدخل البريد الإلكتروني الجديد، وسيتم إرسال رابط تأكيد له."
            : "Enter the new email address. A confirmation link will be sent to it."
        }
        value={emailInput}
        onChangeText={(text: string) => {
          setEmailSheetError("");
          setEmailInput(text);
        }}
        placeholder={selectedLanguage === "AR" ? "البريد الإلكتروني الجديد" : "New email"}
        keyboardType="email-address"
        onClose={resetEmailEditSheet}
        onSave={handleUpdateEmail}
        saving={savingEmail}
        theme={theme}
        isRTL={isRTL}
        confirmText={t.confirm}
        cancelText={t.cancel}
        mode={emailSheetMode}
        successTitle={t.emailChangeSentTitle}
        successMessage={t.emailChangeSentBody}
        successActionText={t.ok}
        successInfoText={emailResendNotice || t.emailChangeStaySettings}
        successResendQuestion={
          selectedLanguage === "AR"
            ? "لم يصلك رابط التأكيد؟"
            : "Didn’t receive the confirmation link?"
        }
        successResendText={
          selectedLanguage === "AR"
            ? "إعادة إرسال الرابط"
            : "Resend link"
        }
        successResendTimer={emailResendTimer}
        successResending={resendingEmailLink}
        onSuccessResend={handleResendEmailChangeLink}
        errorMessage={emailSheetError}
      />

      <EditCarNameModal
        visible={editCarVisible}
        value={carNameInput}
        onChangeText={setCarNameInput}
        onCancel={() => {
          setEditCarVisible(false);
          setSelectedCarForEdit(null);
          setCarNameInput("");
        }}
        onSave={handleSaveCarName}
        saving={savingCarName}
        theme={theme}
        isRTL={isRTL}
        styles={styles}
      />

      <DeleteAccountModal
        visible={deleteAccountVisible}
        password={deletePassword}
        onChangePassword={setDeletePassword}
        onCancel={() => {
          setDeleteAccountVisible(false);
          setDeletePassword("");
        }}
        onConfirm={handleDeleteAccountVerification}
        loading={deletingAccount}
        theme={theme}
        isRTL={isRTL}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 12,
    minHeight: 58,
  },

  headerSide: {
    width: 40,
    height: 40,
  },

  headerDivider: {
    height: 1,
  },

  headerTitle: {
    fontSize: 18,
    lineHeight: 30,
    fontFamily: FONT_EXTRABOLD,
    letterSpacing: 0.2,
    includeFontPadding: true,
    paddingTop: 2,
    paddingBottom: 3,
    textAlign: "center",
    textAlignVertical: "center",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 130,
    paddingTop: 14,
  },

  sectionTitle: {
    fontSize: 12,
    lineHeight: 20,
    marginTop: 18,
    marginBottom: 10,
    fontFamily: FONT_EXTRABOLD,
    letterSpacing: 0.2,
    includeFontPadding: true,
    paddingBottom: 1,
  },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 17,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  accountCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(135,27,23,0.20)",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: Platform.OS === "android" ? 0.14 : 0.2,
    shadowRadius: 12,
    elevation: 5,
  },

  settingRow: {
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingLabelContainer: {
    alignItems: "center",
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },

  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  smallIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  labelBlock: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingTop: 1,
  },

  settingLabel: {
    fontSize: 14,
    fontFamily: FONT_EXTRABOLD,
    lineHeight: 22,
    includeFontPadding: true,
    paddingBottom: 1,
  },

  actionLabel: {
    fontSize: 13.5,
    fontFamily: FONT_EXTRABOLD,
    lineHeight: 21,
    includeFontPadding: true,
    paddingBottom: 1,
  },

  settingHint: {
    fontSize: 10.6,
    marginTop: 3,
    lineHeight: 18,
    fontFamily: FONT_SEMIBOLD,
    includeFontPadding: true,
    paddingBottom: 2,
    flexShrink: 1,
  },

  settingHintTwoLines: {
    lineHeight: 16.5,
    minHeight: 34,
    marginTop: 3,
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  userName: {
    fontSize: 17,
    lineHeight: 26,
    fontFamily: FONT_EXTRABOLD,
    flexShrink: 1,
    includeFontPadding: true,
    paddingBottom: 1,
  },

  accountNameRow: {
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
  },

  editActionPlain: {
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minWidth: 48,
    flexShrink: 0,
    paddingHorizontal: 2,
    paddingVertical: 4,
    backgroundColor: "transparent",
    borderWidth: 0,
  },

  editActionPlainText: {
    color: COLORS.primary,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONT_EXTRABOLD,
    includeFontPadding: true,
    paddingBottom: 1,
  },

  accountEditPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  accountEditText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontFamily: FONT_EXTRABOLD,
  },

  userEmail: {
    fontSize: 12,
    lineHeight: 20,
    marginTop: 6,
    opacity: 0.86,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
    paddingBottom: 1,
  },

  userIdText: {
    fontSize: 10.5,
    lineHeight: 18,
    marginTop: 5,
    opacity: 0.72,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },

  connectionPanel: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  statusGrid: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },

  miniStatusCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  miniStatusTitle: {
    fontSize: 10.5,
    fontFamily: FONT_BOLD,
    textAlign: "center",
  },

  miniStatusText: {
    fontSize: 12,
    fontFamily: FONT_EXTRABOLD,
    textAlign: "center",
  },

  panelDivider: {
    height: 1,
    marginHorizontal: 16,
  },

  connectionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  actionButton: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  segment: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },

  segmentItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  segmentItemActive: {
    backgroundColor: COLORS.primary,
  },

  segmentText: {
    fontSize: 13,
    fontFamily: FONT_EXTRABOLD,
  },

  segmentTextActive: {
    color: "#FFFFFF",
  },

  logoutSection: {
    marginTop: 18,
  },

  logoutButtonWrapper: {
    width: "100%",
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
    shadowRadius: 14,
    elevation: 6,
    backgroundColor: COLORS.primary,
  },

  logoutButtonDisabled: {
    opacity: 0.72,
  },

  logoutGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  logoutShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "48%",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  logoutInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 5,
  },

  logoutSpinner: {
    marginHorizontal: 2,
  },

  logoutText: {
    color: "#FFFFFF",
    fontFamily: FONT_EXTRABOLD,
    fontSize: 18,
    lineHeight: 30,
    textAlign: "center",
    includeFontPadding: true,
    paddingBottom: 2,
  },

  switchTrack: {
    width: 56,
    height: 32,
    borderRadius: 18,
    padding: 3,
    justifyContent: "center",
  },

  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },

  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  /* helpModal: {
        width: "100%",
        height: "86%",
        borderRadius: 30,
        borderWidth: 1,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 8,
    }, */

  helpModalHeader: {
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },

  modalCloseButton: {
    position: "absolute",
    top: 15,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },

  helpModalTitle: {
    fontSize: 18,
    fontFamily: FONT_EXTRABOLD,
    textAlign: "center",
  },

  modalHeaderSpace: {
    width: 42,
    height: 42,
  },

  modalDivider: {
    height: 1,
  },

  helpModalScroll: {
    flex: 1,
  },

  helpModalContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 34,
  },

  helpModalBody: {
    minHeight: 620,
  },

  helpParagraph: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
    lineHeight: 24,
    marginBottom: 14,
  },

  confirmModal: {
    width: "100%",
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },

  confirmIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  successAnimationWrapper: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  successLottie: {
    width: 145,
    height: 145,
  },

  successPulseRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(46,125,50,0.28)",
    backgroundColor: "rgba(46,125,50,0.08)",
  },

  successPulseRingSecond: {
    borderColor: "rgba(46,125,50,0.18)",
    backgroundColor: "rgba(46,125,50,0.05)",
  },

  successCheckCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === "android" ? 0.16 : 0.26,
    shadowRadius: 14,
    elevation: 6,
  },

  appMessagePlainErrorIcon: {
    marginBottom: 14,
  },

  appMessageIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  appMessageSuccessIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "transparent",
  },

  confirmTitle: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: FONT_EXTRABOLD,
    textAlign: "center",
    marginBottom: 8,
    includeFontPadding: true,
    paddingBottom: 1,
  },

  confirmMessage: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
    lineHeight: 22,
    marginBottom: 20,
  },

  confirmButtons: {
    width: "100%",
    gap: 10,
  },

  confirmSecondaryButton: {
    flex: 1,
    minHeight: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  confirmPrimaryButton: {
    flex: 1,
    minHeight: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  confirmSecondaryText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONT_EXTRABOLD,
    includeFontPadding: true,
    paddingBottom: 1,
  },

  confirmPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONT_EXTRABOLD,
    includeFontPadding: true,
    paddingBottom: 1,
  },

  singleModalButton: {
    width: "100%",
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteAccountIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
  },

  deletePasswordLabel: {
    width: "100%",
    fontSize: 13,
    fontFamily: FONT_EXTRABOLD,
    marginBottom: 8,
  },

  deletePasswordInput: {
    width: "100%",
    height: 52,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: FONT_EXTRABOLD,
    marginBottom: 16,
  },

  logoutLoadingBox: {
    width: "86%",
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 26,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },

  logoutLoadingIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  logoutLoadingSpinner: {
    marginBottom: 12,
  },

  logoutLoadingText: {
    fontSize: 16,
    fontFamily: FONT_EXTRABOLD,
    textAlign: "center",
  },
  helpSectionTitle: {
    fontSize: 15.5,
    fontFamily: FONT_EXTRABOLD,
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 8,
  },
  carInfoGrid: {
    gap: 10,
    marginTop: 14,
  },

  carInfoPill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  carInfoLabel: {
    fontSize: 10.5,
    fontFamily: FONT_EXTRABOLD,
    textAlign: "center",
  },

  carInfoValue: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: FONT_EXTRABOLD,
    textAlign: "center",
  },

  loadingSettingsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  nameInput: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: FONT_EXTRABOLD,
    marginBottom: 18,
  },

  helpBottomOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  helpModal: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    maxHeight: "86%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: Platform.OS === "ios" ? 18 : 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: Platform.OS === "android" ? 0.20 : 0.24,
    shadowRadius: 22,
    elevation: 16,
  },

  helpSheetHandleArea: {
    width: "100%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  helpSheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
  },

  helpScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 22,
  },

  helpCloseButton: {
    display: "none",
  },

  helpHeader: {
    alignItems: "stretch",
    justifyContent: "flex-start",
    marginBottom: 14,
    gap: 0,
  },

  helpHeaderIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  helpHeaderTextBlock: {
    width: "100%",
    minWidth: 0,
  },

  helpTitle: {
    fontSize: 20,
    fontFamily: FONT_EXTRABOLD,
    lineHeight: 28,
  },

  helpIntroText: {
    fontSize: 13.5,
    lineHeight: 21,
    fontFamily: FONT_BOLD,
    marginTop: 6,
  },

  faqCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
  },

  helpQuestion: {
    fontSize: 14.5,
    fontFamily: FONT_EXTRABOLD,
    marginBottom: 5,
    lineHeight: 21,
  },

  helpAnswer: {
    fontSize: 12.8,
    lineHeight: 20,
    fontFamily: FONT_BOLD,
  },

  supportMainButton: {
    minHeight: 54,
    borderRadius: 16,
    marginTop: 9,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === "android" ? 0.08 : 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  supportWhatsAppMainButton: {
    backgroundColor: "#25C96A",
  },

  supportEmailMainButton: {
    backgroundColor: COLORS.primary,
  },

  supportMainButtonText: {
    color: "#FFFFFF",
    fontFamily: FONT_EXTRABOLD,
    fontSize: 14.2,
    lineHeight: 23,
    textAlign: "center",
    includeFontPadding: true,
    paddingBottom: Platform.OS === "ios" ? 1 : 2,
  },

  supportIssueFullButton: {
    minHeight: 54,
    borderRadius: 16,
    marginTop: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 8,
  },

  supportIssueFullButtonText: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 14.2,
    lineHeight: 23,
    textAlign: "center",
    includeFontPadding: true,
    paddingBottom: Platform.OS === "ios" ? 1 : 2,
  },

  closeHelpButton: {
    marginTop: 18,
    minHeight: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  closeHelpButtonText: {
    fontSize: 15.5,
    lineHeight: 25,
    fontFamily: FONT_EXTRABOLD,
    textAlign: "center",
    includeFontPadding: true,
    paddingBottom: Platform.OS === "ios" ? 1 : 2,
  },

  fullScreenBlockingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
    zIndex: 9999,
    elevation: 9999,
    alignItems: "center",
    justifyContent: "center",
  },

  blockingOverlayCard: {
    minWidth: 210,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },

  blockingOverlayText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: FONT_EXTRABOLD,
    textAlign: "center",
  },

  bottomSheetRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  bottomSheetKeyboardAvoider: {
    flex: 1,
    justifyContent: "flex-end",
  },

  bottomSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  bottomSheetContainer: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    maxHeight: "86%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 26 : 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: Platform.OS === "android" ? 0.18 : 0.22,
    shadowRadius: 18,
    elevation: 18,
  },

  bottomSheetHandleArea: {
    width: "100%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
  },

  bottomSheetHeader: {
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
    marginBottom: 18,
  },

  bottomSheetHeaderTextBlock: {
    flex: 1,
  },

  bottomSheetTitle: {
    fontSize: 20,
    fontFamily: FONT_EXTRABOLD,
    lineHeight: 28,
  },

  bottomSheetSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: FONT_BOLD,
    lineHeight: 21,
  },

  bottomSheetCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSheetInput: {
    width: "100%",
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 15.5,
    fontFamily: FONT_EXTRABOLD,
    marginBottom: 12,
  },

  bottomSheetErrorBox: {
    width: "100%",
    minHeight: 30,
    alignItems: "center",
    paddingHorizontal: 2,
    paddingVertical: 4,
    borderRadius: 0,
    backgroundColor: "transparent",
    gap: 8,
    marginBottom: 12,
  },

  bottomSheetErrorText: {
    flex: 1,
    fontSize: 13.2,
    fontFamily: FONT_EXTRABOLD,
    lineHeight: 19,
  },

  bottomSheetActions: {
    width: "100%",
    gap: 10,
    marginTop: 4,
  },

  bottomSheetSecondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSheetPrimaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.primary,
  },

  bottomSheetPrimaryGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },

  bottomSheetSecondaryText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONT_EXTRABOLD,
    includeFontPadding: true,
    paddingBottom: Platform.OS === "ios" ? 1 : 2,
  },

  bottomSheetPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONT_EXTRABOLD,
    includeFontPadding: true,
    paddingBottom: Platform.OS === "ios" ? 1 : 2,
  },

  bottomSheetSuccessContent: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },

  bottomSheetSuccessLottie: {
    width: 138,
    height: 138,
    marginBottom: 8,
  },

  bottomSheetSuccessButton: {
    width: "100%",
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.primary,
    marginTop: 18,
  },

  bottomSheetSuccessButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },

  bottomSheetSuccessInfoText: {
    width: "100%",
    marginTop: 10,
    fontSize: 12.5,
    fontFamily: FONT_EXTRABOLD,
    lineHeight: 18,
  },

  bottomSheetResendArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  bottomSheetResendQuestion: {
    fontSize: 12.5,
    fontFamily: FONT_EXTRABOLD,
    lineHeight: 18,
    marginBottom: 8,
  },

  bottomSheetResendTimerText: {
    color: COLORS.primary,
    fontSize: 12.5,
    fontFamily: FONT_EXTRABOLD,
    textAlign: "center",
  },

  bottomSheetResendButton: {
    minHeight: 40,
    minWidth: 150,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSheetResendButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONT_EXTRABOLD,
  },

  carCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
  },


  emailChangeSuccessOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  emailChangeSuccessContent: {
    width: "100%",
    maxWidth: 335,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -44,
  },

  emailChangeSuccessAnimation: {
    width: 172,
    height: 172,
  },

  emailChangeSuccessTitle: {
    fontFamily: FONT_EXTRABOLD,
    marginTop: 4,
    fontSize: 18.5,
    textAlign: "center",
    lineHeight: 27,
    includeFontPadding: false,
    textShadowColor: "rgba(0,0,0,0.24)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  emailChangeSuccessSubtitle: {
    fontFamily: FONT_SEMIBOLD,
    marginTop: 8,
    fontSize: 14.2,
    textAlign: "center",
    lineHeight: 22,
    includeFontPadding: false,
    textShadowColor: "rgba(0,0,0,0.16)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

});