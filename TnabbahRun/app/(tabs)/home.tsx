import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { elmBluetoothService } from "../../services/elmBluetoothService";

const COLORS = {
  primary: "#871B17",
  primaryLight: "#9A3A33",
  primaryDark: "#5F130F",
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  soft: "#F8F8F8",
  softRed: "#F2D7DA",
  border: "#EDEDED",
  text: "#1D1D1F",
  muted: "#7A7A7A",
  danger: "#C62828",
  warning: "#B7791F",
  success: "#1F8A4C",
};

function normalizeRaw(value: unknown) {
  if (!value) return "EMPTY RESPONSE";
  return String(value).trim() || "EMPTY RESPONSE";
}

function parseObdValue(raw: string, pid: "010C" | "010D" | "0142") {
  const bytes = raw.replace(/\r|\n|>/g, " ").trim().match(/[0-9A-Fa-f]{2}/g) || [];

  if (pid === "010C") {
    const i = bytes.findIndex(
      (b, index) => b.toUpperCase() === "41" && bytes[index + 1]?.toUpperCase() === "0C"
    );
    if (i === -1) return null;

    const a = parseInt(bytes[i + 2], 16);
    const b = parseInt(bytes[i + 3], 16);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;

    return Math.round((a * 256 + b) / 4);
  }

  if (pid === "010D") {
    const i = bytes.findIndex(
      (b, index) => b.toUpperCase() === "41" && bytes[index + 1]?.toUpperCase() === "0D"
    );
    if (i === -1) return null;

    const a = parseInt(bytes[i + 2], 16);
    return Number.isNaN(a) ? null : a;
  }

  if (pid === "0142") {
    const i = bytes.findIndex(
      (b, index) => b.toUpperCase() === "41" && bytes[index + 1]?.toUpperCase() === "42"
    );
    if (i === -1) return null;

    const a = parseInt(bytes[i + 2], 16);
    const b = parseInt(bytes[i + 3], 16);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;

    return Number(((a * 256 + b) / 1000).toFixed(1));
  }

  return null;
}

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isWide = width >= 760 || isLandscape;
  const columns = isWide ? 4 : 2;

  const [isChecking, setIsChecking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [rpm, setRpm] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [voltage, setVoltage] = useState<number | null>(null);

  const [lastRaw, setLastRaw] = useState("");
  const [statusText, setStatusText] = useState("جاهز للفحص");
  const [debugText, setDebugText] = useState("");

  const metricWidth = useMemo(() => {
    const pagePadding = isWide ? 52 : 36;
    const totalGap = 10 * (columns - 1);
    return (width - pagePadding - totalGap) / columns;
  }, [width, columns, isWide]);

  const appendRaw = (title: string, value: string) => {
    setLastRaw((prev) => {
      const block = `${title}:\n${normalizeRaw(value)}`;
      return prev ? `${prev}\n\n----------------\n\n${block}` : block;
    });
  };

  const pullCommand = async (command: string, waitMs = 2200) => {
    setStatusText(`جاري سحب ${command} من القطعة...`);
    appendRaw(command, "جاري الإرسال...");
    const response = normalizeRaw(await elmBluetoothService.send(command, waitMs));

    setLastRaw((prev) =>
      prev.replace(`${command}:\nجاري الإرسال...`, `${command}:\n${response}`)
    );

    return response;
  };

  useEffect(() => {
    const update = () => {
      const connected = elmBluetoothService.isConnected();
      setIsConnected(connected);
      setStatusText(connected ? "متصل بقطعة OBD" : "غير متصل بالقطعة");
    };

    update();

    const interval = setInterval(update, 1500);
    return () => clearInterval(interval);
  }, []);

  const goToBluetooth = () => {
    router.push("/bluetooth-setup" as any);
  };

  const runQuickCheck = async () => {
    try {
      setIsChecking(true);
      setLastRaw("");
      setDebugText("");
      setRpm(null);
      setSpeed(null);
      setVoltage(null);

      if (!elmBluetoothService.isConnected()) {
        setIsConnected(false);
        setStatusText("غير متصل بالقطعة");
        Alert.alert("غير متصل", "اربطي قطعة OBD من صفحة البلوتوث أولًا.");
        return;
      }

      setIsConnected(true);

      await pullCommand("ATI", 1500);
      await pullCommand("ATDP", 1500);

      const rpmRaw = await pullCommand("010C", 2800);
      const speedRaw = await pullCommand("010D", 2800);
      const voltageRaw = await pullCommand("0142", 2800);

      const parsedRpm = parseObdValue(rpmRaw, "010C");
      const parsedSpeed = parseObdValue(speedRaw, "010D");
      const parsedVoltage = parseObdValue(voltageRaw, "0142");

      setRpm(parsedRpm);
      setSpeed(parsedSpeed);
      setVoltage(parsedVoltage);

      const all = [rpmRaw, speedRaw, voltageRaw].join("\n").toUpperCase();

      if (all.includes("EMPTY RESPONSE")) {
        setStatusText("الأوامر انرسلت، لكن ما وصل رد من قناة BLE.");
        setDebugText("المشكلة هنا من notify/read characteristic في خدمة البلوتوث، مو من الهوم.");
      } else if (all.includes("NO DATA")) {
        setStatusText("القطعة ردت، لكن السيارة ما رجعت بيانات.");
        setDebugText("شغلي السيارة أو خلي السويتش ON، وتاكدي القطعة راكبة في منفذ OBD.");
      } else if (parsedRpm === null && parsedSpeed === null && parsedVoltage === null) {
        setStatusText("وصل رد، لكن ما قدرنا نفسره كقراءات.");
        setDebugText("صوري RAW Response عشان نضبط الـ parser.");
      } else {
        setStatusText("تم سحب البيانات بنجاح");
        setDebugText("القراءات اتحدثت فوق.");
      }
    } catch (error: any) {
      setStatusText("فشل الفحص");
      setDebugText(error?.message || "ما قدرنا نسحب بيانات من القطعة.");
      Alert.alert("خطأ", error?.message || "ما قدرنا نسحب بيانات من القطعة.");
    } finally {
      setIsChecking(false);
    }
  };

  const runDeepTest = async () => {
    try {
      setIsChecking(true);
      setLastRaw("");
      setDebugText("");

      if (!elmBluetoothService.isConnected()) {
        setStatusText("غير متصل بالقطعة");
        Alert.alert("غير متصل", "اربطي قطعة OBD أولًا.");
        return;
      }

      const commands = ["ATZ", "ATE0", "ATL0", "ATS0", "ATH0", "ATSP0", "ATI", "ATDP", "0100", "010C", "010D", "0142"];

      for (const cmd of commands) {
        await pullCommand(cmd, cmd.startsWith("01") ? 3000 : 1800);
      }

      setStatusText("انتهى اختبار RAW");
      setDebugText("لو كل الردود EMPTY RESPONSE فالمشكلة من elmBluetoothService واختيار قنوات BLE.");
    } catch (error: any) {
      setStatusText("فشل اختبار RAW");
      setDebugText(error?.message || "صار خطأ أثناء اختبار RAW.");
      Alert.alert("خطأ", error?.message || "صار خطأ أثناء اختبار RAW.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isWide && styles.headerWide]}>
          <View style={styles.headerTextBox}>
            <Text style={styles.helloText}>أهلًا في تنبّهـ</Text>
            <Text style={styles.headerTitle}>سيارتك تتكلم، ونحن نترجمها لك</Text>
          </View>

          <View style={[styles.connectionBadge, isConnected ? styles.connectedBadge : styles.disconnectedBadge]}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? COLORS.success : COLORS.danger }]} />
            <Text style={[styles.connectionText, { color: isConnected ? COLORS.success : COLORS.danger }]}>
              {isConnected ? "متصل" : "غير متصل"}
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={["#FFFFFF", "#FFF7F7"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.heroCard, isWide && styles.heroCardWide]}
        >
          <View style={styles.heroIconCircle}>
            <MaterialCommunityIcons name="car-connected" size={46} color={COLORS.primary} />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>الفحص السريع</Text>
            <Text style={styles.heroSubtitle}>
              تنبّه يرسل أوامر OBD للقطعة ويسحب الرد منها مباشرة.
            </Text>
          </View>

          <View style={styles.heroButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.mainButton,
                pressed && { opacity: 0.9 },
                isChecking && { opacity: 0.65 },
              ]}
              onPress={runQuickCheck}
              disabled={isChecking}
            >
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primaryDark]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.mainButtonGradient}
              >
                {isChecking ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="download-cloud" size={18} color="#FFFFFF" />
                    <Text style={styles.mainButtonText}>اسحب البيانات</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={goToBluetooth}>
              <Feather name="bluetooth" size={17} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>ربط قطعة OBD</Text>
            </Pressable>

            <Pressable style={styles.debugButton} onPress={runDeepTest} disabled={isChecking}>
              <Feather name="terminal" size={16} color={COLORS.primary} />
              <Text style={styles.debugButtonText}>اختبار RAW</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>قراءات السيارة</Text>

        <View style={styles.metricsGrid}>
          <MetricCard width={metricWidth} icon="activity" label="RPM" value={rpm === null ? "--" : String(rpm)} unit="دورة/دقيقة" />
          <MetricCard width={metricWidth} icon="navigation" label="السرعة" value={speed === null ? "--" : String(speed)} unit="كم/س" />
          <MetricCard width={metricWidth} icon="battery" label="الفولت" value={voltage === null ? "--" : String(voltage)} unit="V" />
          <MetricCard width={metricWidth} icon="shield" label="حالة OBD" value={isConnected ? "جاهز" : "اربط"} unit="الاتصال" />
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIconCircle}>
              <Feather name="info" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statusTitle}>حالة الفحص</Text>
          </View>

          <Text style={styles.statusDescription}>{statusText}</Text>

          {!!debugText && <Text style={styles.debugText}>{debugText}</Text>}

          {!!lastRaw && (
            <View style={styles.rawBox}>
              <Text style={styles.rawTitle}>RAW Response</Text>
              <Text selectable style={styles.rawText}>
                {lastRaw}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Feather name="alert-triangle" size={18} color={COLORS.primary} />
          </View>

          <View style={styles.tipTextBox}>
            <Text style={styles.tipTitle}>تنبيه مهم</Text>
            <Text style={styles.tipText}>
              القطعة ما ترسل بيانات من نفسها. لازم التطبيق يرسل أوامر مثل 010C و010D ثم يقرأ الرد.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  width,
  icon,
  label,
  value,
  unit,
}: {
  width: number;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={[styles.metricCard, { width }]}>
      <View style={styles.metricHeader}>
        <View style={styles.metricIconCircle}>
          <Feather name={icon} size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>

      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scrollView: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 130 },
  scrollContentWide: { paddingHorizontal: 26 },
  header: {
    width: "100%",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  headerWide: { alignSelf: "center", maxWidth: 980 },
  headerTextBox: { flex: 1, alignItems: "flex-end" },
  helloText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "700",
    textAlign: "right",
  },
  headerTitle: {
    marginTop: 5,
    fontSize: 22,
    color: COLORS.text,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 31,
  },
  connectionBadge: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 13,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
  },
  connectedBadge: { backgroundColor: "#EFFAF3", borderColor: "#D6F0DF" },
  disconnectedBadge: { backgroundColor: "#FFF1F1", borderColor: "#FFD9D9" },
  connectionDot: { width: 8, height: 8, borderRadius: 4 },
  connectionText: { fontSize: 12, fontWeight: "900" },
  heroCard: {
    width: "100%",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: "#5F130F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  heroCardWide: { maxWidth: 980, alignSelf: "center" },
  heroIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  heroContent: { alignItems: "center", maxWidth: 460 },
  heroTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
  },
  heroButtons: { width: "100%", alignItems: "center", marginTop: 18 },
  mainButton: {
    width: "100%",
    maxWidth: 260,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  mainButtonGradient: {
    flex: 1,
    borderRadius: 28,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mainButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  secondaryButton: {
    marginTop: 10,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 18,
    backgroundColor: "#F8EEEE",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  secondaryButtonText: { color: COLORS.primary, fontSize: 13, fontWeight: "900" },
  debugButton: {
    marginTop: 10,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1E0E0",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  debugButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: "900" },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
    alignSelf: "stretch",
  },
  metricsGrid: {
    width: "100%",
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  metricCard: {
    minHeight: 138,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.soft,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  metricHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  metricIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "800",
    textAlign: "right",
  },
  metricValue: {
    marginTop: 10,
    fontSize: 30,
    color: COLORS.text,
    fontWeight: "900",
    textAlign: "right",
  },
  metricUnit: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "700",
    textAlign: "right",
  },
  statusCard: {
    marginTop: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16,
  },
  statusHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  statusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  statusDescription: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 22,
  },
  debugText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: "800",
    textAlign: "right",
    lineHeight: 20,
  },
  rawBox: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: COLORS.soft,
    padding: 12,
  },
  rawTitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 6,
  },
  rawText: {
    fontSize: 11,
    color: "#555555",
    fontWeight: "700",
    textAlign: "left",
    lineHeight: 18,
  },
  tipCard: {
    marginTop: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F1E0E0",
    backgroundColor: "#FFF8F8",
    padding: 14,
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#F2D7DA",
    justifyContent: "center",
    alignItems: "center",
  },
  tipTextBox: { flex: 1, alignItems: "flex-end" },
  tipTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
  },
  tipText: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "right",
  },
});