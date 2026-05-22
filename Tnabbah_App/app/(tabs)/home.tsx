import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// تم التعليق مؤقتًا لأن Push Notifications على iPhone الحقيقي تحتاج Apple Developer مدفوع.
// التنبيهات داخل التطبيق ما زالت شغالة بدون هذا الاستيراد.
// import * as Notifications from "expo-notifications";

import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { elmBluetoothService } from "../../services/elmBluetoothService";
import { mqttService } from "../../services/mqttService";
import { vehicleScannerService } from "../../services/vehicleScannerService";

const API_URL =
  process.env.EXPO_PUBLIC_DIAGNOSTICS_API || "http://207.180.244.27:8001";

const CORTEX_URL =
  process.env.EXPO_PUBLIC_CORTEX_API || "http://207.180.244.27:3101";

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

type MetricState = {
  rpm: number | string | null;
  speed: number | string | null;
  voltage: number | string | null;
  coolant: number | string | null;
};

type HomeAiState = {
  status: "safe" | "watch" | "urgent";
  title: string;
  message: string;
  score: number;
  action: string;
  alertsCount: number;
} | null;

function safeValue(value: any) {
  if (value === null || value === undefined || value === "") return "--";
  return String(value);
}

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getPayloadData(message: Buffer) {
  try {
    const parsed = JSON.parse(message.toString());
    return parsed?.data ?? parsed;
  } catch {
    return null;
  }
}

function getUserDisplayName(user: any) {
  const metadata = user?.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.name ||
    metadata.username ||
    user?.email?.split("@")?.[0] ||
    "";

  return String(name).trim();
}

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isWide = width >= 760 || isLandscape;
  const columns = isWide ? 4 : 2;

  const [userName, setUserName] = useState("");
  const [homeAi, setHomeAi] = useState<HomeAiState>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  const [metrics, setMetrics] = useState<MetricState>({
    rpm: null,
    speed: null,
    voltage: null,
    coolant: null,
  });

  const [vin, setVin] = useState<string | null>(null);
  const [carId, setCarId] = useState<string | null>(null);
  const [supportedCount, setSupportedCount] = useState<number>(0);
  const [dtcCount, setDtcCount] = useState<number>(0);

  const [lastRaw, setLastRaw] = useState("");
  const [statusText, setStatusText] = useState("جاهز للفحص");
  const [debugText, setDebugText] = useState("");
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<
    { id: string; text: string }[]
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifiedIdsRef = useRef<string[]>([]);

  const metricWidth = useMemo(() => {
    const pagePadding = isWide ? 52 : 36;
    const totalGap = 10 * (columns - 1);
    return (width - pagePadding - totalGap) / columns;
  }, [width, columns, isWide]);

  useEffect(() => {
    const loadUserName = async () => {
      const { data } = await supabase.auth.getUser();
      const displayName = getUserDisplayName(data.user);
      setUserName(displayName);
    };

    loadUserName();
  }, []);

  useEffect(() => {
    const update = async () => {
      const connected = await elmBluetoothService
        .isActuallyConnected?.()
        .catch(() => false);

      setIsConnected(!!connected);
      setIsAutoRunning(vehicleScannerService.isAutoScanRunning());

      const cachedCarId = vehicleScannerService.getCachedCarId();
      if (cachedCarId) setCarId(cachedCarId);

      if (!connected) {
        setStatusText("غير متصل بالقطعة");
      } else if (vehicleScannerService.isAutoScanRunning()) {
        setStatusText("الفحص التلقائي والستريمنق شغالين");
      } else {
        setStatusText("متصل بقطعة OBD");
      }
    };

    update();

    const interval = setInterval(update, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    let client: any = null;

    const setupMqttListener = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;

        if (!userId) return;

        client = await mqttService.connectAsync();

        const root = `Tnabbah/${userId}/+/`;

        const topics = [
          `${root}status`,
          `${root}identity`,
          `${root}mode09/#`,
          `${root}pids/#`,
          `${root}dtc/#`,
          `${root}srs/#`,
          `${root}discovery/#`,
        ];

        client.subscribe(topics);

        const onMessage = (topic: string, message: Buffer) => {
          if (!mounted) return;

          const data = getPayloadData(message);
          if (!data) return;

          const parts = topic.split("/");
          const incomingCarId = parts[2];
          const section = parts[3];
          const sub = parts[4];

          if (incomingCarId) setCarId(incomingCarId);

          if (section === "status") {
            setStatusText(
              data.status === "disconnected"
                ? "القطعة غير متصلة"
                : data.status || "تم تحديث الحالة",
            );

            setIsAutoRunning(!!data.streaming);
            setIsConnected(!!data.obdConnected);
          }

          if (section === "identity") {
            setVin(data.vin || data.fingerprints?.vin || null);
            setLastRaw(prettyJson(data));
          }

          if (section === "mode09") {
            if (sub === "vin" && data.vin) setVin(data.vin);
            if (sub === "full" && data.vin) setVin(data.vin);
          }

          if (section === "pids") {
            if (sub === "supported") {
              if (Array.isArray(data.supportedPids)) {
                setSupportedCount(data.supportedPids.length);
              }
            }

            if (sub === "010C") {
              setMetrics((prev) => ({ ...prev, rpm: data.value ?? null }));
            }

            if (sub === "010D") {
              setMetrics((prev) => ({ ...prev, speed: data.value ?? null }));
            }

            if (sub === "0142") {
              setMetrics((prev) => ({ ...prev, voltage: data.value ?? null }));
            }

            if (sub === "0105") {
              setMetrics((prev) => ({ ...prev, coolant: data.value ?? null }));
            }
          }

          if (section === "dtc") {
            if (sub === "full") {
              const stored = data.stored?.dtcs?.length || 0;
              const pending = data.pending?.dtcs?.length || 0;
              const permanent = data.permanent?.dtcs?.length || 0;
              setDtcCount(stored + pending + permanent);
            } else if (Array.isArray(data.dtcs)) {
              setDtcCount((prev) => Math.max(prev, data.dtcs.length));
            }
          }

          if (section === "discovery") {
            setLastRaw(prettyJson(data));
          }
        };

        client.on("message", onMessage);

        return () => {
          try {
            client.off?.("message", onMessage);
            client.unsubscribe?.(topics);
          } catch {}
        };
      } catch (error) {
        console.log("MQTT Home subscribe error:", error);
      }
    };

    let cleanup: any;

    setupMqttListener().then((fn) => {
      cleanup = fn;
    });

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadHomeAi = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;

        if (!userId || !carId) return;

        const res = await fetch(`${CORTEX_URL}/cortex/${userId}/${carId}/home`);
        if (!res.ok) {
          setDebugText(`Cortex HTTP ${res.status}`);
          return;
        }

        const json = await res.json();

        if (mounted) {
          setHomeAi(json);
        }
      } catch (e: any) {
        setDebugText(e?.message || "فشل الاتصال مع Cortex");
      }
    };

    loadHomeAi();

    const interval = setInterval(loadHomeAi, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [carId]);

  useEffect(() => {
    let mounted = true;

    const checkMaintenanceReminders = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;

        if (!userId) return;

        const today = new Date();

        const { data, error } = await supabase
          .from("maintenance_reminders")
          .select(`
            reminder_id,
            next_date,
            maintenance_type_id,
            maintenance_types (
              name
            )
          `)
          .eq("user_id", userId)
          .eq("is_active", true);

        if (error || !data) return;

        let upcomingCount = 0;

        const collectedNotifications: {
          id: string;
          text: string;
        }[] = [];

        for (const item of data) {
          if (!item?.next_date) continue;

          const dueDate = new Date(item.next_date);
          const diffMs = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const shouldNotify = diffDays <= 3 && diffDays >= 0;

          if (shouldNotify) {
            collectedNotifications.push({
              id: String(item.reminder_id),
              text:
                diffDays === 0
                  ? `موعد "${item.maintenance_types?.[0]?.name || "صيانة"}" اليوم`
                  : `موعد "${item.maintenance_types?.[0]?.name || "صيانة"}" بعد ${diffDays} يوم`,
            });

            upcomingCount++;

            const notifyId = `${item.reminder_id}_${diffDays}`;

            if (!notifiedIdsRef.current.includes(notifyId)) {
              notifiedIdsRef.current.push(notifyId);

              // تم التعليق مؤقتًا:
              // هذا الجزء يرسل Push Notification خارج التطبيق.
              // حساب Apple المجاني لا يدعم Push Notifications على iPhone الحقيقي.
              // التنبيهات داخل التطبيق ما زالت تظهر في جرس الإشعارات والـ Modal.
              //
              // await Notifications.scheduleNotificationAsync({
              //   content: {
              //     title: "تذكير صيانة",
              //     body: `موعد "${item.maintenance_types?.[0]?.name || "صيانة"}" بعد ${diffDays} يوم`,
              //     sound: true,
              //   },
              //   trigger: null,
              // });
            }
          }
        }

        if (mounted) {
          setNotificationsCount(upcomingCount);
          setNotificationsList(collectedNotifications);
        }
      } catch (e) {
        console.log("Reminder notification error:", e);
      }
    };

    checkMaintenanceReminders();

    const interval = setInterval(checkMaintenanceReminders, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const performDirectScan = async () => {
    try {
      setIsChecking(true);
      setDebugText("");

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (!userId) {
        Alert.alert("خطأ", "يجب تسجيل الدخول قبل التحليل.");
        setIsChecking(false);
        return;
      }

      const scannedCarId =
        carId || vehicleScannerService.getCachedCarId() || "car_a521e25";

      setStatusText("جاري التقاط لقطة من بيانات السيارة وتشغيل التحليل...");

      const response = await fetch(`${API_URL}/api/scan-from-mqtt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          car_id: scannedCarId,
          freshness_seconds: 120,
          wait_ms: 0,
          vehicle_info: null,
        }),
      });

      if (!response.ok) {
        let detail = "فشل تشغيل التحليل";

        try {
          const errBody = await response.json();
          detail =
            typeof errBody?.detail === "string"
              ? errBody.detail
              : typeof errBody?.error === "string"
                ? errBody.error
                : JSON.stringify(errBody);
        } catch {
          detail = `HTTP ${response.status}`;
        }

        throw new Error(detail);
      }

      const report = await response.json();
      setStatusText("تم إنشاء التقرير بنجاح");

      router.push({
        pathname: "/report",
        params: { report: JSON.stringify(report) },
      });
    } catch (e: any) {
      const errorMsg =
        typeof e?.message === "string"
          ? e.message
          : JSON.stringify(e?.message || e || "خطأ غير متوقع");

      setStatusText("فشل تشغيل التحليل");
      setDebugText(errorMsg);
      Alert.alert("خطأ", errorMsg);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isWide && styles.scrollContentWide,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isWide && styles.headerWide]}>
          <View style={styles.headerTextBox}>
            <Text style={styles.helloText}>
              {userName
                ? `أهلًا بك في تنبّهـ ${userName}`
                : "أهلًا بك في تنبّهـ"}
            </Text>

            <Text style={styles.headerTitle}>
              سيارتك تتكلم، ونحن نترجمها لك
            </Text>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.headerRightArea}>
              <Pressable
                onPress={() => setShowNotifications(true)}
                style={styles.notificationButton}
              >
                <Feather name="bell" size={21} color={COLORS.text} />

                {notificationsList.length > 0 && (
                  <View style={styles.notificationDot} />
                )}
              </Pressable>

              <Modal
                visible={showNotifications}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowNotifications(false)}
              >
                <Pressable
                  style={styles.modalOverlay}
                  onPress={() => setShowNotifications(false)}
                >
                  <Pressable style={styles.modalContainer} pointerEvents="auto">
                    <View style={styles.modalHeader}>
                      <Pressable
                        style={styles.closeButton}
                        onPress={() => setShowNotifications(false)}
                      >
                        <Feather name="x" size={20} color={COLORS.text} />
                      </Pressable>

                      <Text style={styles.notificationsTitle}>الإشعارات</Text>
                    </View>

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={styles.modalScroll}
                    >
                      {notificationsList.length === 0 ? (
                        <Text style={styles.emptyNotificationText}>
                          لا توجد إشعارات جديدة حالياً
                        </Text>
                      ) : (
                        notificationsList.map((item, index) => (
                          <View key={index} style={styles.notificationItem}>
                            <Text style={styles.notificationText}>
                              {item.text}
                            </Text>
                          </View>
                        ))
                      )}
                    </ScrollView>
                  </Pressable>
                </Pressable>
              </Modal>
            </View>

            <View
              style={[
                styles.connectionBadge,
                isConnected ? styles.connectedBadge : styles.disconnectedBadge,
              ]}
            >
              <View
                style={[
                  styles.connectionDot,
                  {
                    backgroundColor: isConnected
                      ? COLORS.success
                      : COLORS.danger,
                  },
                ]}
              />

              <Text
                style={[
                  styles.connectionText,
                  {
                    color: isConnected ? COLORS.success : COLORS.danger,
                  },
                ]}
              >
                {isConnected ? "متصل" : "غير متصل"}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.carImageArea, isWide && styles.carImageAreaWide]}>
          <Image
            source={require("../../assets/images/car-card.png")}
            style={styles.carImage}
            resizeMode="cover"
          />
        </View>

        <View style={[styles.heroCard, isWide && styles.heroCardWide]}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>فحص تنبّه</Text>
          </View>

          {homeAi && (
            <View style={styles.aiHomeBox}>
              <Text style={styles.aiHomeMessage}>{homeAi.message}</Text>
            </View>
          )}

          <View style={styles.heroButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.mainButton,
                pressed && { opacity: 0.9 },
                isChecking && { opacity: 0.65 },
              ]}
              onPress={performDirectScan}
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
                    <Feather name="file-text" size={18} color="#FFFFFF" />
                    <Text style={styles.mainButtonText}>إنشاء تقرير</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>قراءات السيارة من MQTT</Text>

        <View style={styles.metricsGrid}>
          <MetricCard
            width={metricWidth}
            icon="activity"
            label="RPM"
            value={safeValue(metrics.rpm)}
            unit="دورة/دقيقة"
          />

          <MetricCard
            width={metricWidth}
            icon="navigation"
            label="السرعة"
            value={safeValue(metrics.speed)}
            unit="كم/س"
          />

          <MetricCard
            width={metricWidth}
            icon="battery"
            label="الفولت"
            value={safeValue(metrics.voltage)}
            unit="V"
          />

          <MetricCard
            width={metricWidth}
            icon="thermometer"
            label="حرارة المحرك"
            value={safeValue(metrics.coolant)}
            unit="°C"
          />
        </View>

        <Text style={styles.sectionTitle}>ملخص السيارة</Text>

        <View style={styles.metricsGrid}>
          <MetricCard
            width={metricWidth}
            icon="hash"
            label="Car ID"
            value={carId ? "موجود" : "--"}
            unit={carId || "بانتظار MQTT"}
          />

          <MetricCard
            width={metricWidth}
            icon="file-text"
            label="VIN"
            value={vin ? "موجود" : "--"}
            unit={vin || "Mode 09"}
          />

          <MetricCard
            width={metricWidth}
            icon="list"
            label="Supported"
            value={String(supportedCount)}
            unit="PID"
          />

          <MetricCard
            width={metricWidth}
            icon="alert-triangle"
            label="DTC"
            value={String(dtcCount)}
            unit="أعطال"
          />
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
              <Text style={styles.rawTitle}>MQTT / Scanner Response</Text>
              <Text selectable style={styles.rawText}>
                {lastRaw}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Feather name="wifi" size={18} color={COLORS.primary} />
          </View>

          <View style={styles.tipTextBox}>
            <Text style={styles.tipTitle}>MQTT Live View</Text>
            <Text style={styles.tipText}>
              القيم المعروضة هنا تنعكس من MQTT. آخر قيمة تبقى ظاهرة حتى لو
              انقطعت القطعة، والحالة فقط تتحول إلى غير متصل.
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

      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>

      <Text style={styles.metricUnit} numberOfLines={2}>
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scrollView: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 130,
  },

  scrollContentWide: {
    paddingHorizontal: 26,
  },

  header: {
    width: "100%",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  headerWide: {
    alignSelf: "center",
    maxWidth: 980,
  },

  headerTextBox: {
    flex: 1,
    alignItems: "flex-end",
  },

  headerRightArea: {
    position: "relative",
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.soft,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  notificationDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D32F2F",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 12,
    marginBottom: 10,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.soft,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  notificationsTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
  },

  modalScroll: {
    maxHeight: 350,
  },

  emptyNotificationText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    fontWeight: "700",
    paddingVertical: 30,
  },

  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FBFBFB",
  },

  notificationText: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: "right",
    lineHeight: 22,
    fontWeight: "700",
  },

  helloText: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 25,
  },

  headerTitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 22,
  },

  headerActions: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },

  notificationItemText: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  emptyNotificationsText: {
    textAlign: "center",
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "700",
  },

  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
  },

  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
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

  connectedBadge: {
    backgroundColor: "#EFFAF3",
    borderColor: "#D6F0DF",
  },

  disconnectedBadge: {
    backgroundColor: "#FFF1F1",
    borderColor: "#FFD9D9",
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  connectionText: {
    fontSize: 12,
    fontWeight: "900",
  },

  carImageArea: {
    width: "100%",
    height: 235,
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  carImageAreaWide: {
    maxWidth: 980,
    alignSelf: "center",
    height: 310,
  },

  carImage: {
    width: "100%",
    height: "100%",
  },

  heroCard: {
    width: "100%",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 4,
  },

  heroCardWide: {
    maxWidth: 980,
    alignSelf: "center",
  },

  heroContent: {
    alignItems: "center",
    maxWidth: 460,
  },

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

  heroButtons: {
    width: "100%",
    alignItems: "center",
    marginTop: 18,
  },

  mainButton: {
    width: "100%",
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

  mainButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

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

  statusHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },

  statusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
  },

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

  tipTextBox: {
    flex: 1,
    alignItems: "flex-end",
  },

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

  aiHomeBox: {
    width: "100%",
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1E0E0",
    padding: 14,
  },

  aiHomeTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
  },

  aiHomeMessage: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
    textAlign: "right",
    lineHeight: 22,
  },

  aiHomeFooter: {
    marginTop: 10,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    gap: 10,
  },

  aiHomeScore: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.primary,
  },

  aiHomeAction: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.success,
    textAlign: "left",
  },
});