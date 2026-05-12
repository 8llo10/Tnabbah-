import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { vehicleScannerService } from "../../services/vehicleScannerService";

const BURGUNDY = "#971B1B";
const API_URL = process.env.EXPO_PUBLIC_DIAGNOSTICS_API || "http://127.0.0.1:8001";

/**
 * Diagnostics screen — "press to analyze" model.
 *
 * The MQTT stream is continuous (one message per PID per second). Instead of
 * subscribing in the app, we let the backend keep the latest-value cache and
 * snapshot it on demand. This screen just gathers the (userId, carId) pair
 * and asks the backend to freeze a snapshot and run the AI pipeline.
 */
export default function DiagnosticsInputScreen() {
  const [mileage, setMileage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Reset transient UI state every time we re-enter the screen.
  useFocusEffect(
    useCallback(() => {
      setError("");
      setInfo("");
      setLoading(false);
      return undefined;
    }, [])
  );

  const handleAnalyze = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) {
        throw new Error("يجب تسجيل الدخول قبل التحليل.");
      }

      const carId = vehicleScannerService.getCachedCarId();
      if (!carId) {
        throw new Error(
          "ما قدرنا نعرف معرف السيارة. ابدأ الفحص من الصفحة الرئيسية أولاً."
        );
      }

      const vehicleInfo = mileage ? { mileage_km: parseInt(mileage, 10) } : null;

      setInfo("جاري التقاط لقطة من بيانات السيارة وتشغيل التحليل...");

      const response = await fetch(`${API_URL}/api/scan-from-mqtt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          car_id: carId,
          freshness_seconds: 10,
          wait_ms: 1500,
          vehicle_info: vehicleInfo,
        }),
      });

      if (!response.ok) {
        let detail = "فشل تشغيل التحليل";
        try {
          const errBody = await response.json();
          if (errBody?.detail) detail = String(errBody.detail);
        } catch {}
        throw new Error(detail);
      }

      const report = await response.json();

      router.push({
        pathname: "/report",
        params: { report: JSON.stringify(report) },
      });
    } catch (e: any) {
      setError(e?.message || String(e) || "خطأ غير متوقع");
      setInfo("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#f8f9fa", "#e8eef5"]} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>🔍 تحليل السيارة</Text>
            <Text style={styles.subtitle}>
              اضغط الزر لالتقاط لقطة لحظية من قراءات السيارة وتحليلها بالذكاء الاصطناعي
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Feather name="zap" size={36} color={BURGUNDY} />
            </View>
            <Text style={styles.heroTitle}>تحليل بالذكاء الاصطناعي</Text>
            <Text style={styles.heroBody}>
              الخادم يستقبل بيانات سيارتك مباشرة من MQTT بشكل مستمر. عند الضغط، نلتقط
              آخر قراءات وصلت (خلال آخر 10 ثوانٍ) ونحللها مرة واحدة، فلا يتأثر التحليل
              بتدفق البيانات اللحظي.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>عدد الكيلومترات (اختياري)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="مثال: 150000"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={mileage}
              onChangeText={setMileage}
            />
          </View>

          {info ? (
            <View style={styles.infoBox}>
              <ActivityIndicator size="small" color={BURGUNDY} />
              <Text style={styles.infoText}>{info}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="sparkles" size={22} color="white" />
                <Text style={styles.submitBtnText}>تحليل القراءات الآن</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            تأكد أن الفحص شغّال من الصفحة الرئيسية وأن قطعة OBD متصلة بالسيارة.
          </Text>

          <View style={styles.spacer} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e3e3e3",
  },
  headerContent: { alignItems: "center" },
  title: { fontSize: 24, fontWeight: "900", color: "#111", marginBottom: 4 },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
    textAlign: "right",
  },
  heroCard: {
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e3e3e3",
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  heroBody: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#e3e3e3",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111",
    backgroundColor: "white",
    textAlign: "right",
  },
  infoBox: {
    marginTop: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF7F7",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F5D6D6",
  },
  infoText: { color: BURGUNDY, fontSize: 13, fontWeight: "700", flex: 1 },
  errorBox: {
    marginTop: 12,
    backgroundColor: "#fee",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fcc",
  },
  errorText: { color: "#c33", fontSize: 14, textAlign: "right" },
  submitBtn: {
    backgroundColor: BURGUNDY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 18,
    gap: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "white", fontSize: 17, fontWeight: "900" },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
  },
  spacer: { height: 30 },
});
