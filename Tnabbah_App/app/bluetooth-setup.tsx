import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Device, State } from "react-native-ble-plx";
import { elmBluetoothService } from "@/services/elmBluetoothService";
import { vehicleScannerService } from "@/services/vehicleScannerService";

const { height } = Dimensions.get("window");

const BURGUNDY = "#971B1B";
const BURGUNDY_LIGHT = "#9A3A33";
const BURGUNDY_DARK = "#5F130F";
const DARK_TEXT = "#111111";
const GRAY_TEXT = "#9A9A9A";
const LIGHT_GRAY = "#EFEFEF";

type DeviceItem = {
  id: string;
  name: string;
  raw: Device;
};

function isElmLikeDevice(name: string) {
  const n = name.toLowerCase();

  return (
    n.includes("elm") ||
    n.includes("obd") ||
    n.includes("vlink") ||
    n.includes("veepeak") ||
    n.includes("carista") ||
    n.includes("konnwei") ||
    n.includes("vgate")
  );
}

export default function BluetoothSetupScreen() {
  const manager = elmBluetoothService.manager;
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getBluetoothStateMessage = (state: State) => {
    if (state === State.PoweredOff) {
      return "البلوتوث مقفل. فعّليه من إعدادات الجوال ثم أعيدي المحاولة.";
    }

    if (state === State.Unauthorized) {
      return "التطبيق لا يملك صلاحية البلوتوث. فعّلي صلاحية البلوتوث للتطبيق.";
    }

    if (state === State.Unsupported) {
      return "هذا الجهاز لا يدعم نوع البلوتوث المطلوب.";
    }

    if (state === State.Resetting) {
      return "البلوتوث يعيد التشغيل الآن. انتظري ثواني ثم أعيدي المحاولة.";
    }

    return "البلوتوث غير جاهز الآن. انتظري ثواني ثم أعيدي المحاولة.";
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  };

  const startScan = async () => {
    try {
      setErrorMessage("");
      setDevices([]);
      setSelectedDevice(null);
      setShowDeviceList(true);

      const state = await manager.state();

      if (state !== State.PoweredOn) {
        setErrorMessage(getBluetoothStateMessage(state));
        return;
      }

      stopScan();
      setIsScanning(true);

      manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          setErrorMessage(error.message || "صار خطأ أثناء البحث عن أجهزة البلوتوث.");
          stopScan();
          return;
        }

        if (!device) return;

        const deviceName =
          device.name ||
          device.localName ||
          `جهاز بلوتوث ${device.id.slice(-5)}`;

        setDevices((prev) => {
          const exists = prev.some((item) => item.id === device.id);
          if (exists) return prev;

          const item: DeviceItem = {
            id: device.id,
            name: deviceName,
            raw: device,
          };

          if (isElmLikeDevice(deviceName)) {
            return [item, ...prev];
          }

          return [...prev, item];
        });
      });

      scanTimeoutRef.current = setTimeout(stopScan, 12000);
    } catch (error: any) {
      setErrorMessage(error?.message || "تعذر تشغيل البحث عن البلوتوث.");
      stopScan();
    }
  };

  const handleSkip = () => {
    stopScan();
    router.replace("/(tabs)/home" as any);
  };

  const handleConnectDevice = async () => {
    if (!selectedDevice) {
      setErrorMessage("اختاري جهاز البلوتوث أولًا");
      return;
    }

    try {
      setIsConnecting(true);
      setErrorMessage("");
      stopScan();

      const readyDevice = await elmBluetoothService.connect(selectedDevice.id);

      console.log(
        "Connected to ELM:",
        readyDevice.name || readyDevice.localName || readyDevice.id
      );

      router.replace("/(tabs)/home" as any);

      vehicleScannerService
        .startAutoScan({ forceFull: false })
        .catch((scanError: any) => {
          console.log("Auto scan background error:", scanError);
        });
    } catch (error: any) {
      console.log("Bluetooth connect error:", error);

      try {
        await elmBluetoothService.disconnect();
        await vehicleScannerService.stopAutoScan();
      } catch {}

      setErrorMessage(
        error?.message ||
          "تعذر الاتصال بالقطعة. لو قطعتك ELM قديمة Bluetooth Classic فلن تظهر هنا، ولازم مكتبة Classic Bluetooth."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        startScan();
      }
    }, true);

    return () => {
      stopScan();
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
            disabled={isConnecting}
          >
            <Ionicons name="arrow-back" size={28} color={BURGUNDY} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            activeOpacity={0.8}
            onPress={handleSkip}
            disabled={isConnecting}
          >
            <Text style={styles.skipText}>تخطي</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stepsContainer}>
          <StepItem label="اختر" iconName="bluetooth" active />
          <View style={styles.lineActive} />
          <StepItem label="جهّز" iconName="car-outline" active />
          <View style={styles.lineActive} />
          <StepItem label="ابدأ" iconName="cellphone-cog" active />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="bluetooth" size={36} color="#9B6B6B" />
            </View>

            <View style={styles.headerTextBox}>
              <Text style={styles.title}>اختاري اتصال البلوتوث</Text>
              <Text style={styles.subtitle}>
                بعد نجاح الربط بننقلك للهوم مباشرة، وتنبه يبدأ سحب البيانات وإرسالها للـ MQTT بالخلفية.
              </Text>
            </View>
          </View>

          <View style={styles.formArea}>
            <Text style={styles.inputLabel}>الأجهزة المتاحة</Text>

            <TouchableOpacity
              style={styles.deviceSelectBox}
              activeOpacity={0.8}
              onPress={startScan}
              disabled={isConnecting}
            >
              <Ionicons name="chevron-down" size={24} color="#8B8B8B" />
              <Text style={styles.deviceSelectText}>
                {isScanning
                  ? "جاري البحث..."
                  : selectedDevice
                  ? selectedDevice.name
                  : "اختاري الجهاز"}
              </Text>
            </TouchableOpacity>

            {showDeviceList && (
              <View style={styles.dropdownBox}>
                {isScanning && (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={BURGUNDY} />
                    <Text style={styles.loadingText}>جاري البحث عن الأجهزة...</Text>
                  </View>
                )}

                <FlatList
                  data={devices}
                  keyExtractor={(item) => item.id}
                  style={styles.deviceList}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    !isScanning ? (
                      <TouchableOpacity
                        style={styles.emptyBox}
                        onPress={startScan}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.emptyText}>
                          ما ظهرت أجهزة. لو قطعتك ELM قديمة Bluetooth Classic فهي لن تظهر هنا بمكتبة BLE.
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.deviceItem,
                        selectedDevice?.id === item.id && styles.deviceItemSelected,
                      ]}
                      disabled={isConnecting}
                      onPress={() => {
                        setSelectedDevice(item);
                        setShowDeviceList(false);
                        setErrorMessage("");
                      }}
                    >
                      <Ionicons name="bluetooth" size={22} color={BURGUNDY} />
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{item.name}</Text>
                        <Text style={styles.deviceId}>ID: {item.id}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            <Text style={styles.inputLabel}>كلمة مرور القطعة</Text>

            <View style={styles.passwordBox}>
              <Ionicons name="lock-closed-outline" size={23} color="#9A9A9A" />
              <TextInput
                style={styles.passwordInput}
                placeholder="اختياري: 1234 أو 0000"
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <Text style={styles.noteText}>
              تقدرين تتخطين الصفحة. وقتها الهوم يفتح عادي، وراح يبان إن قطعة OBD غير متصلة.
            </Text>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          </View>

          <TouchableOpacity
            style={[
              styles.connectButton,
              (!selectedDevice || isConnecting) && styles.disabledButton,
            ]}
            disabled={!selectedDevice || isConnecting}
            activeOpacity={0.9}
            onPress={handleConnectDevice}
          >
            <LinearGradient
              colors={[BURGUNDY_LIGHT, BURGUNDY_DARK]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.connectGradient}
            >
              <View style={styles.buttonHighlight} />

              {isConnecting ? (
                <View style={styles.connectingRow}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.connectButtonText}>جاري الربط...</Text>
                </View>
              ) : (
                <Text style={styles.connectButtonText}>ربط الجهاز</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function StepItem({
  label,
  iconName,
  active,
}: {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
}) {
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
        <MaterialCommunityIcons
          name={iconName}
          size={25}
          color={active ? "#FFFFFF" : "#9B6B6B"}
        />
      </View>

      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: height * 0.055,
  },
  topActions: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: 6,
  },
  skipButton: {
    minWidth: 64,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8EEEE",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  skipText: {
    color: BURGUNDY,
    fontSize: 13,
    fontWeight: "900",
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 36,
  },
  stepItem: { width: 58, alignItems: "center" },
  stepCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: { backgroundColor: BURGUNDY },
  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#B0B0B0",
    fontWeight: "700",
    includeFontPadding: false,
  },
  stepLabelActive: { color: BURGUNDY, fontWeight: "900" },
  lineActive: {
    width: 72,
    height: 1.5,
    backgroundColor: BURGUNDY,
    marginTop: 23,
  },
  card: {
    width: "100%",
    minHeight: 470,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    justifyContent: "space-between",
  },
  cardHeader: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  cardIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  headerTextBox: { flex: 1, alignItems: "flex-end", paddingTop: 2 },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: DARK_TEXT,
    textAlign: "right",
    marginBottom: 8,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 14,
    color: GRAY_TEXT,
    fontWeight: "500",
    textAlign: "right",
    lineHeight: 24,
    includeFontPadding: false,
  },
  formArea: { width: "100%", marginTop: 34 },
  inputLabel: {
    fontSize: 13,
    color: "#B0B0B0",
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 8,
    includeFontPadding: false,
  },
  deviceSelectBox: {
    width: "100%",
    height: 56,
    borderRadius: 14,
    backgroundColor: "#EFEFEF",
    borderWidth: 1,
    borderColor: "#E2E2E2",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  deviceSelectText: {
    flex: 1,
    fontSize: 17,
    color: DARK_TEXT,
    fontWeight: "900",
    textAlign: "right",
    includeFontPadding: false,
  },
  dropdownBox: {
    width: "100%",
    maxHeight: 170,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    marginTop: -10,
    marginBottom: 16,
    overflow: "hidden",
  },
  loadingRow: {
    minHeight: 46,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: { color: GRAY_TEXT, fontSize: 13, fontWeight: "700" },
  deviceList: { maxHeight: 165 },
  emptyBox: {
    minHeight: 58,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  emptyText: {
    color: "#888888",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  deviceItem: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  deviceItemSelected: { backgroundColor: "#FFF4F4" },
  deviceInfo: { flex: 1 },
  deviceName: {
    fontSize: 14.5,
    color: DARK_TEXT,
    fontWeight: "800",
    textAlign: "right",
  },
  deviceId: {
    marginTop: 3,
    fontSize: 10.5,
    color: "#A0A0A0",
    textAlign: "right",
  },
  passwordBox: {
    width: "100%",
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: "600",
    paddingVertical: 0,
    marginRight: 10,
    includeFontPadding: false,
  },
  noteText: {
    color: "#8B8B8B",
    fontSize: 12,
    textAlign: "right",
    lineHeight: 19,
    marginBottom: 8,
  },
  errorText: {
    color: "#C62828",
    fontSize: 13,
    textAlign: "right",
    lineHeight: 20,
    marginTop: 4,
  },
  connectButton: {
    width: "100%",
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
    marginTop: 36,
    shadowColor: "#5F130F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  disabledButton: { opacity: 0.55 },
  connectGradient: {
    flex: 1,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  buttonHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  connectingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  connectButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    includeFontPadding: false,
  },
});