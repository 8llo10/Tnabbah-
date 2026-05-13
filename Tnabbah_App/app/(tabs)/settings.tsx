import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../providers/AuthProvider";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import { elmBluetoothService } from "../../services/elmBluetoothService";
import { vehicleScannerService } from "../../services/vehicleScannerService";
import { mqttService } from "../../services/mqttService";

const COLORS = {
  primary: "#871B17",
  primaryPressed: "#6F1512",
  danger: "#C62828",
  success: "#1F8A4C",
};

const lightTheme = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#EDEDED",
  cardBorder: "#F1F1F1",
  textPrimary: "#1D1D1F",
  textSecondary: "#6B6B6B",
  iconBg: "#F2D7DA",
  iconColor: "#871B17",
  subtle: "#F8F8F8",
  headerDivider: "#F2F2F2",
  cardPressed: "#FAFAFA",
  dangerBg: "#FFF1F1",
  successBg: "#EFFAF3",
};

const darkTheme = {
  background: "#1A1A1A",
  surface: "#2D2D2D",
  border: "#3D3D3D",
  cardBorder: "#3A3A3A",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0B0",
  iconBg: "#871B17",
  iconColor: "#FFFFFF",
  subtle: "#252525",
  headerDivider: "#3D3D3D",
  cardPressed: "#353535",
  dangerBg: "#3A1E1E",
  successBg: "#183827",
};

const translations = {
  AR: {
    settings: "الإعدادات",
    account: "الحساب",
    userId: "معرّف المستخدم",
    cars: "سياراتي",
    currentCar: "السيارة الحالية",
    noCar: "لا توجد سيارة متصلة الآن",
    bluetoothObd: "بلوتوث و OBD",
    bluetoothSettings: "إعدادات البلوتوث",
    bluetoothSettingsDesc: "ربط أو تغيير قطعة OBD",
    connected: "متصل",
    disconnected: "غير متصل",
    scannerOn: "الفحص التلقائي شغال",
    scannerOff: "الفحص التلقائي متوقف",
    stopScanner: "إيقاف الفحص والستريمنق",
    stopScannerDesc: "يوقف إرسال بيانات السيارة مؤقتًا",
    disconnectObd: "فصل قطعة OBD",
    disconnectObdDesc: "يفصل البلوتوث ويوقف الستريمنق",
    appSettings: "إعدادات التطبيق",
    notifications: "السماح بالإشعارات",
    notificationsDesc: "استلام تنبيهات الفحص والتذكيرات",
    language: "اللغة",
    languageDesc: "تغيير لغة التطبيق في أي وقت",
    darkMode: "الوضع الداكن",
    darkModeDesc: "تفعيل المظهر الداكن للتطبيق",
    helpSupport: "المساعدة والدعم",
    help: "المساعدة",
    helpDesc: "الأسئلة الشائعة والتواصل",
    logout: "تسجيل الخروج",
    loggingOut: "جاري تسجيل الخروج...",
    logoutTitle: "تسجيل الخروج",
    logoutMessage: "هل أنت متأكد أنك تريد تسجيل الخروج؟",
    cancel: "إلغاء",
    logoutError: "ما قدر يسجل خروج",
  },
  EN: {
    settings: "Settings",
    account: "Account",
    userId: "User ID",
    cars: "My Cars",
    currentCar: "Current Car",
    noCar: "No connected car",
    bluetoothObd: "Bluetooth & OBD",
    bluetoothSettings: "Bluetooth Settings",
    bluetoothSettingsDesc: "Pair or change OBD device",
    connected: "Connected",
    disconnected: "Disconnected",
    scannerOn: "Auto scan running",
    scannerOff: "Auto scan stopped",
    stopScanner: "Stop scan and streaming",
    stopScannerDesc: "Temporarily stops vehicle data streaming",
    disconnectObd: "Disconnect OBD Device",
    disconnectObdDesc: "Disconnects Bluetooth and stops streaming",
    appSettings: "App Settings",
    notifications: "Allow Notifications",
    notificationsDesc: "Receive check alerts and reminders",
    language: "Language",
    languageDesc: "Change app language anytime",
    darkMode: "Dark Mode",
    darkModeDesc: "Enable dark theme for the app",
    helpSupport: "Help & Support",
    help: "Help",
    helpDesc: "FAQs and contact",
    logout: "Logout",
    loggingOut: "Logging out...",
    logoutTitle: "Logout",
    logoutMessage: "Are you sure you want to logout?",
    cancel: "Cancel",
    logoutError: "Could not logout",
  },
};

function AppSwitch({
  value,
  onValueChange,
  trackOnColor = COLORS.primary,
  trackOffColor = "#EDEDED",
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
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 24],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.switchTrack,
        {
          backgroundColor: value ? trackOnColor : trackOffColor,
          opacity: pressed ? 0.9 : 1,
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

export default function Settings() {
  const { profile, session } = useAuth();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"AR" | "EN">("AR");

  const [obdConnected, setObdConnected] = useState(false);
  const [scannerRunning, setScannerRunning] = useState(false);
  const [currentCarId, setCurrentCarId] = useState<string | null>(null);

  const t = translations[selectedLanguage];
  const isRTL = selectedLanguage === "AR";
  const theme = darkModeEnabled ? darkTheme : lightTheme;

  const userName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    "مستخدم";

  const userEmail =
    session?.user?.email ||
    profile?.email ||
    profile?.username ||
    "—";

  const userId = session?.user?.id || "—";

  const refreshObdState = async () => {
    const connected = await elmBluetoothService.isActuallyConnected?.().catch(() => false);

    setObdConnected(!!connected);
    setScannerRunning(vehicleScannerService.isAutoScanRunning());
    setCurrentCarId(vehicleScannerService.getCachedCarId());
  };

  useEffect(() => {
    refreshObdState();

    const interval = setInterval(refreshObdState, 1500);
    return () => clearInterval(interval);
  }, []);

  const goToBluetoothSettings = () => {
    router.push("/connection-intro" as any);
  };

  const handleStopScanner = async () => {
    await vehicleScannerService.stopAutoScan();
    await refreshObdState();
    Alert.alert("تم", "تم إيقاف الفحص والستريمنق.");
  };

  const handleDisconnectObd = async () => {
    Alert.alert("فصل قطعة OBD", "هل تريد فصل القطعة وإيقاف الستريمنق؟", [
      { text: t.cancel, style: "cancel" },
      {
        text: "فصل",
        style: "destructive",
        onPress: async () => {
          await vehicleScannerService.stopAutoScan();
          await elmBluetoothService.disconnect();
          await refreshObdState();
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(t.logoutTitle, t.logoutMessage, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.logout,
        style: "destructive",
        onPress: async () => {
          try {
            setLoggingOut(true);

            await vehicleScannerService.stopAutoScan();
            await elmBluetoothService.disconnect();
            mqttService.disconnect();
            vehicleScannerService.resetCache();

            const { error } = await supabase.auth.signOut();

            if (error) {
              Alert.alert("خطأ", t.logoutError);
              return;
            }

            router.replace("/start");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleHelp = () => {
    Alert.alert(
      selectedLanguage === "AR" ? "المساعدة" : "Help",
      selectedLanguage === "AR"
        ? "سيتم إضافة صفحة المساعدة لاحقًا."
        : "Help page will be added later."
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={darkModeEnabled ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <View
        style={[
          styles.header,
          {
            flexDirection: isRTL ? "row-reverse" : "row",
            backgroundColor: theme.background,
          },
        ]}
      >
        <View style={{ width: 40, height: 40 }} />

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t.settings}
        </Text>

        <View style={{ width: 40, height: 40 }} />
      </View>

      <View
        style={[
          styles.headerDivider,
          { backgroundColor: theme.headerDivider },
        ]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
          {t.account}
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={[styles.settingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.settingLabelContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.avatar, isRTL ? { marginLeft: 12 } : { marginRight: 12 }, { backgroundColor: theme.iconBg }]}>
                <Feather name="user" size={22} color={theme.iconColor} />
              </View>

              <View style={[styles.userInfo, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text numberOfLines={1} style={[styles.userName, { color: theme.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
                  {userName}
                </Text>

                <Text numberOfLines={1} style={[styles.userEmail, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                  {userEmail}
                </Text>

                <Text numberOfLines={1} style={[styles.userIdText, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.userId}: {userId}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
          {t.cars}
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={[styles.settingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.settingLabelContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.iconWrapper, isRTL ? { marginLeft: 12 } : { marginRight: 12 }, { backgroundColor: theme.iconBg }]}>
                <Feather name="truck" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.currentCar}
                </Text>

                <Text numberOfLines={2} style={[styles.settingHint, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                  {currentCarId || t.noCar}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
          {t.bluetoothObd}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.cardBorder },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={goToBluetoothSettings}
        >
          <View style={[styles.settingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.settingLabelContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.iconWrapper, isRTL ? { marginLeft: 12 } : { marginRight: 12 }, { backgroundColor: theme.iconBg }]}>
                <Feather name="bluetooth" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.bluetoothSettings}
                </Text>
                <Text style={[styles.settingHint, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.bluetoothSettingsDesc}
                </Text>
              </View>
            </View>

            <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={theme.textSecondary} />
          </View>
        </Pressable>

        <View style={[styles.statusGrid, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <View style={[styles.miniStatusCard, { backgroundColor: obdConnected ? theme.successBg : theme.dangerBg, borderColor: theme.cardBorder }]}>
            <Feather name="radio" size={17} color={obdConnected ? COLORS.success : COLORS.danger} />
            <Text style={[styles.miniStatusText, { color: obdConnected ? COLORS.success : COLORS.danger }]}>
              {obdConnected ? t.connected : t.disconnected}
            </Text>
          </View>

          <View style={[styles.miniStatusCard, { backgroundColor: scannerRunning ? theme.successBg : theme.subtle, borderColor: theme.cardBorder }]}>
            <Feather name="activity" size={17} color={scannerRunning ? COLORS.success : theme.textSecondary} />
            <Text style={[styles.miniStatusText, { color: scannerRunning ? COLORS.success : theme.textSecondary }]}>
              {scannerRunning ? t.scannerOn : t.scannerOff}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.cardBorder },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={handleStopScanner}
        >
          <View style={[styles.settingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.settingLabelContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.iconWrapper, isRTL ? { marginLeft: 12 } : { marginRight: 12 }, { backgroundColor: theme.iconBg }]}>
                <Feather name="pause-circle" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.stopScanner}
                </Text>
                <Text style={[styles.settingHint, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.stopScannerDesc}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.cardBorder },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={handleDisconnectObd}
        >
          <View style={[styles.settingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.settingLabelContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.iconWrapper, isRTL ? { marginLeft: 12 } : { marginRight: 12 }, { backgroundColor: theme.dangerBg }]}>
                <Feather name="x-circle" size={20} color={COLORS.danger} />
              </View>

              <View style={[styles.labelBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.disconnectObd}
                </Text>
                <Text style={[styles.settingHint, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.disconnectObdDesc}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
          {t.appSettings}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.cardBorder },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={() => setNotificationsEnabled((v) => !v)}
        >
          <View style={[styles.settingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.settingLabelContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.iconWrapper, isRTL ? { marginLeft: 12 } : { marginRight: 12 }, { backgroundColor: theme.iconBg }]}>
                <Feather name="bell" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.notifications}
                </Text>
                <Text style={[styles.settingHint, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.notificationsDesc}
                </Text>
              </View>
            </View>

            <AppSwitch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackOffColor={theme.border} />
          </View>
        </Pressable>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={[styles.settingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.settingLabelContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.iconWrapper, isRTL ? { marginLeft: 12 } : { marginRight: 12 }, { backgroundColor: theme.iconBg }]}>
                <Feather name="globe" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.language}
                </Text>
                <Text style={[styles.settingHint, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.languageDesc}
                </Text>
              </View>
            </View>

            <View style={[styles.segment, { backgroundColor: theme.subtle }]}>
              <Pressable
                style={[styles.segmentItem, selectedLanguage === "AR" && styles.segmentItemActive]}
                onPress={() => setSelectedLanguage("AR")}
              >
                <Text style={[styles.segmentText, { color: theme.textSecondary }, selectedLanguage === "AR" && styles.segmentTextActive]}>
                  AR
                </Text>
              </Pressable>

              <Pressable
                style={[styles.segmentItem, selectedLanguage === "EN" && styles.segmentItemActive]}
                onPress={() => setSelectedLanguage("EN")}
              >
                <Text style={[styles.segmentText, { color: theme.textSecondary }, selectedLanguage === "EN" && styles.segmentTextActive]}>
                  EN
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.cardBorder },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={() => setDarkModeEnabled((v) => !v)}
        >
          <View style={[styles.settingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.settingLabelContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.iconWrapper, isRTL ? { marginLeft: 12 } : { marginRight: 12 }, { backgroundColor: theme.iconBg }]}>
                <Feather name="moon" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.darkMode}
                </Text>
                <Text style={[styles.settingHint, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.darkModeDesc}
                </Text>
              </View>
            </View>

            <AppSwitch value={darkModeEnabled} onValueChange={setDarkModeEnabled} trackOffColor={theme.border} />
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
          {t.helpSupport}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.cardBorder },
            pressed && { backgroundColor: theme.cardPressed },
          ]}
          onPress={handleHelp}
        >
          <View style={[styles.settingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.settingLabelContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.iconWrapper, isRTL ? { marginLeft: 12 } : { marginRight: 12 }, { backgroundColor: theme.iconBg }]}>
                <Feather name="help-circle" size={20} color={theme.iconColor} />
              </View>

              <View style={[styles.labelBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.help}
                </Text>
                <Text style={[styles.settingHint, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                  {t.helpDesc}
                </Text>
              </View>
            </View>

            <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={theme.textSecondary} />
          </View>
        </Pressable>

        <View style={styles.logoutSection}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              {
                backgroundColor: theme.iconBg,
                opacity: loggingOut ? 0.5 : pressed ? 0.9 : 1,
              },
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <View style={[styles.logoutInner, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name="log-out" size={18} color={theme.iconColor} />
              <Text style={[styles.logoutText, { color: theme.iconColor }]}>
                {loggingOut ? t.loggingOut : t.logout}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },

  headerDivider: { height: 1 },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  scrollView: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 130,
    paddingTop: 14,
  },

  sectionTitle: {
    fontSize: 12,
    marginTop: 18,
    marginBottom: 10,
    fontWeight: "700",
  },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  settingRow: {
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingLabelContainer: {
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
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

  labelBlock: { flex: 1 },

  settingLabel: {
    fontSize: 14,
    fontWeight: "700",
  },

  settingHint: {
    fontSize: 12,
    marginTop: 4,
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  userName: {
    fontSize: 17,
    fontWeight: "900",
  },

  userEmail: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.8,
  },

  userIdText: {
    fontSize: 10.5,
    marginTop: 5,
    opacity: 0.7,
  },

  statusGrid: {
    gap: 10,
    marginBottom: 10,
  },

  miniStatusCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  miniStatusText: {
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
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
    fontWeight: "800",
  },

  segmentTextActive: {
    color: "#FFFFFF",
  },

  logoutSection: {
    marginTop: 18,
  },

  logoutBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  logoutInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  logoutText: {
    fontWeight: "900",
    fontSize: 14,
  },

  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: "center",
  },

  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});