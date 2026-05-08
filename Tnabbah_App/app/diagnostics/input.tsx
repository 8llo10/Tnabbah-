import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const BURGUNDY = "#971B1B";
const LIGHT_GRAY = "#EFEFEF";
const LINE_GRAY = "#E3E3E3";

const API_URL = process.env.EXPO_PUBLIC_DIAGNOSTICS_API || "http://127.0.0.1:8001";

const PID_FIELDS = [
  { code: "0x04", name: "حمل المحرك (Engine Load)", unit: "%", min: 0, max: 100, step: 0.1, def: 30.98 },
  { code: "0x05", name: "حرارة المحرك (Coolant Temp)", unit: "°C", min: -40, max: 200, step: 0.5, def: 96.0 },
  { code: "0x06", name: "تعديل الوقود قصير المدى (STFT)", unit: "%", min: -50, max: 50, step: 0.1, def: 1.56 },
  { code: "0x07", name: "تعديل الوقود طويل المدى (LTFT)", unit: "%", min: -50, max: 50, step: 0.1, def: 1.56 },
  { code: "0x0C", name: "دورات المحرك (RPM)", unit: "rpm", min: 0, max: 9000, step: 1, def: 714 },
  { code: "0x0D", name: "سرعة السيارة (Speed)", unit: "km/h", min: 0, max: 300, step: 1, def: 0 },
  { code: "0x10", name: "تدفق الهواء (MAF)", unit: "g/s", min: 0, max: 700, step: 0.01, def: 2.09 },
  { code: "0x42", name: "جهد البطارية (Voltage)", unit: "V", min: 0, max: 18, step: 0.01, def: 13.125 },
  { code: "0x11", name: "موضع المخنق (Throttle)", unit: "%", min: 0, max: 100, step: 0.1, def: "" },
  { code: "0x0F", name: "حرارة الهواء الداخل (Intake Temp)", unit: "°C", min: -40, max: 120, step: 0.5, def: "" },
];

const SCENARIOS = [
  {
    label: "✅ سيارة سليمة",
    sub: "كل القراءات طبيعية",
    pids: { "0x04": 30.98, "0x05": 96, "0x06": 1.56, "0x07": 1.56, "0x0C": 714, "0x0D": 0, "0x10": 2.09, "0x42": 13.125 },
    dtcs: "",
  },
  {
    label: "🥵 ارتفاع حرارة",
    sub: "COOLANT_TEMP في النطاق الحرج",
    pids: { "0x04": 65, "0x05": 118, "0x06": 4.2, "0x07": 3.8, "0x0C": 850, "0x0D": 0, "0x10": 4.5, "0x42": 13.4 },
    dtcs: "P0217",
  },
  {
    label: "⚠️ خليط فقير",
    sub: "STFT/LTFT مرتفعة + P0171",
    pids: { "0x04": 35, "0x05": 92, "0x06": 22, "0x07": 18, "0x0C": 800, "0x0D": 0, "0x10": 3.2, "0x42": 13.6 },
    dtcs: "P0171",
  },
  {
    label: "🛑 محوّل عادم",
    sub: "P0420 — كفاءة المحوّل",
    pids: { "0x04": 30, "0x05": 90, "0x06": 1.5, "0x07": 2, "0x0C": 720, "0x0D": 0, "0x10": 2.2, "0x42": 13.2 },
    dtcs: "P0420",
  },
];

export default function DiagnosticsInputScreen() {
  const [pids, setPids] = useState<Record<string, string>>({});
  const [dtcs, setDtcs] = useState("");
  const [mileage, setMileage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const defaults: Record<string, string> = {};
    PID_FIELDS.forEach((f) => {
      if (f.def !== "") defaults[f.code] = String(f.def);
    });
    setPids(defaults);
  }, []);

  const applyScenario = (scenario: typeof SCENARIOS[0]) => {
    const pidStrings: Record<string, string> = {};
    Object.entries(scenario.pids).forEach(([code, val]) => {
      pidStrings[code] = String(val);
    });
    setPids(pidStrings);
    setDtcs(scenario.dtcs);
  };

  const resetForm = () => {
    const defaults: Record<string, string> = {};
    PID_FIELDS.forEach((f) => {
      if (f.def !== "") defaults[f.code] = String(f.def);
    });
    setPids(defaults);
    setDtcs("");
    setMileage("");
    setError("");
  };

  const handleSubmit = async () => {
    try {
      setError("");
      setLoading(true);

      const pidObj: Record<string, number> = {};
      Object.entries(pids).forEach(([code, val]) => {
        if (val.trim() !== "") {
          pidObj[code] = parseFloat(val);
        }
      });

      if (Object.keys(pidObj).length === 0) {
        setError("أدخل قيمة واحدة على الأقل من قراءات المستشعرات.");
        setLoading(false);
        return;
      }

      const dtcList = (dtcs || "")
        .split(/[\s,،\n]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const vehicleInfo = mileage ? { mileage_km: parseInt(mileage, 10) } : null;

      const response = await fetch(`${API_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pids: pidObj,
          dtcs: dtcList,
          vehicle_info: vehicleInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("فشل الاتصال بالخادم");
      }

      const report = await response.json();

      router.push({
        pathname: "/report",
        params: { report: JSON.stringify(report) },
      });
    } catch (err) {
      setError(String(err) || "خطأ في التحليل");
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
            <Text style={styles.subtitle}>أدخل قراءات المستشعرات والأعطال</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>السيناريوهات الجاهزة</Text>
              <TouchableOpacity onPress={resetForm}>
                <Text style={styles.resetBtn}>↻ إعادة ضبط</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.scenarioGrid}>
              {SCENARIOS.map((scenario, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.scenarioCard}
                  onPress={() => applyScenario(scenario)}
                >
                  <Text style={styles.scenarioLabel}>{scenario.label}</Text>
                  <Text style={styles.scenarioSub}>{scenario.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>قراءات المستشعرات</Text>
            {PID_FIELDS.map((field) => (
              <View key={field.code} style={styles.pidInputGroup}>
                <View style={styles.pidHeader}>
                  <Text style={styles.pidName}>{field.name}</Text>
                  <Text style={styles.pidCode}>{field.code}</Text>
                </View>
                <View style={styles.pidInput}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="—"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={pids[field.code] || ""}
                    onChangeText={(val) =>
                      setPids({ ...pids, [field.code]: val })
                    }
                  />
                  <Text style={styles.pidUnit}>{field.unit}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>أكواد الأعطال (DTCs)</Text>
            <TextInput
              style={[styles.textInput, styles.dtcInput]}
              placeholder="P0171, P0420"
              placeholderTextColor="#999"
              value={dtcs}
              onChangeText={setDtcs}
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>عدد الكيلومترات (اختياري)</Text>
            <TextInput
              style={[styles.textInput, styles.mileageInput]}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={mileage}
              onChangeText={setMileage}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="white" />
                <Text style={styles.submitBtnText}>تحليل القراءات</Text>
              </>
            )}
          </TouchableOpacity>

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
  subtitle: { fontSize: 14, color: "#999" },
  section: { marginTop: 20, marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  resetBtn: { fontSize: 13, color: "#999" },
  scenarioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  scenarioCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e3e3e3",
  },
  scenarioLabel: { fontSize: 14, fontWeight: "600", color: "#111", textAlign: "center" },
  scenarioSub: { fontSize: 11, color: "#999", textAlign: "center", marginTop: 4 },
  pidInputGroup: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e3e3e3",
  },
  pidHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  pidName: { fontSize: 13, fontWeight: "600", color: "#333" },
  pidCode: { fontSize: 12, color: "#999" },
  pidInput: { flexDirection: "row", alignItems: "center" },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#e3e3e3",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111",
  },
  pidUnit: { marginLeft: 8, fontSize: 12, color: "#999", minWidth: 40 },
  dtcInput: { minHeight: 80, paddingTop: 10, textAlignVertical: "top", marginTop: 8 },
  mileageInput: { marginTop: 8 },
  errorBox: {
    backgroundColor: "#fee",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#fcc",
  },
  errorText: { color: "#c33", fontSize: 14, textAlign: "right" },
  submitBtn: {
    backgroundColor: BURGUNDY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
  spacer: { height: 20 },
});
