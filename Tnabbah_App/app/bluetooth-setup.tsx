import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { BleManager, Device, State } from "react-native-ble-plx";

const { height } = Dimensions.get("window");

const BURGUNDY = "#971B1B";
const BURGUNDY_LIGHT = "#9A3A33";
const BURGUNDY_DARK = "#5F130F";

const DARK_TEXT = "#111111";
const GRAY_TEXT = "#9A9A9A";
const LIGHT_GRAY = "#EFEFEF";
const LINE_GRAY = "#E3E3E3";

type DeviceItem = {
  id: string;
  name: string;
  raw: Device;
};

export default function BluetoothSetupScreen() {
  const manager = useMemo(() => new BleManager(), []);

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
      return "التطبيق لا يملك صلاحية البلوتوث. افتحي إعدادات الجوال وفعّلي صلاحية البلوتوث لتطبيق تنبه.";
    }

    if (state === State.Unsupported) {
      return "هذا الجهاز لا يدعم البحث عن أجهزة البلوتوث المطلوبة.";
    }

    if (state === State.Resetting) {
      return "البلوتوث يعيد التشغيل الآن. انتظري ثواني ثم أعيدي المحاولة.";
    }

    if (state === State.Unknown) {
      return "حالة البلوتوث غير جاهزة الآن. انتظري ثواني ثم أعيدي المحاولة.";
    }

    return "البلوتوث غير جاهز الآن. انتظري ثواني ثم أعيدي المحاولة.";
  };

  const startScan = async () => {
    try {
      console.log("✅ startScan pressed");

      setErrorMessage("");
      setDevices([]);
      setSelectedDevice(null);
      setShowDeviceList(true);

      const state = await manager.state();
      console.log("Bluetooth state:", state);

      if (state !== State.PoweredOn) {
        setErrorMessage(getBluetoothStateMessage(state));
        return;
      }

      setIsScanning(true);

      manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.log("Bluetooth scan error:", error);
            console.log("Bluetooth state:", state);

            setErrorMessage(
              error.message || "صار خطأ أثناء البحث عن أجهزة البلوتوث."
            );

            setIsScanning(false);
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

            return [
              ...prev,
              {
                id: device.id,
                name: deviceName,
                raw: device,
              },
            ];
          });
        }
      );

      setTimeout(() => {
        manager.stopDeviceScan();
        setIsScanning(false);
      }, 10000);
    } catch (error: any) {
      console.log("Scan catch error:", error);
      setErrorMessage(error?.message || "تعذر تشغيل البحث عن البلوتوث.");
      setIsScanning(false);
    }
  };

  const handleConnectDevice = async () => {
    if (!selectedDevice) {
      setErrorMessage("اختاري جهاز البلوتوث أولًا");
      return;
    }

    try {
      setIsConnecting(true);
      setErrorMessage("");

      console.log("Trying to connect to:", selectedDevice.id);

      manager.stopDeviceScan();
      setIsScanning(false);

      const connectedDevice = await manager.connectToDevice(selectedDevice.id, {
        timeout: 15000,
      });

      await connectedDevice.discoverAllServicesAndCharacteristics();

      console.log(
        "Connected successfully:",
        connectedDevice.name || connectedDevice.localName || connectedDevice.id
      );

      router.replace("/(tabs)/home" as any);
    } catch (error: any) {
      console.log("Bluetooth connect error:", error);

      setErrorMessage(
        "تعذر الاتصال بالجهاز. تأكدي أن القطعة قريبة وشغالة وغير متصلة بجهاز آخر."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      console.log("Bluetooth state changed:", state);

      if (state === State.PoweredOn) {
        startScan();
      }
    }, true);

    return () => {
      manager.stopDeviceScan();
      subscription.remove();
      manager.destroy();
    };
  }, [manager]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color={BURGUNDY} />
        </TouchableOpacity>

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
                ابحثي عن القطعة من الأجهزة المتاحة، ثم اختاريها لإكمال الربط.
              </Text>
            </View>
          </View>

          <View style={styles.formArea}>
            <Text style={styles.inputLabel}>الأجهزة المتاحة</Text>

            <TouchableOpacity
              style={styles.deviceSelectBox}
              activeOpacity={0.8}
              onPress={() => {
                setShowDeviceList(true);
                startScan();
              }}
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
                    <Text style={styles.loadingText}>
                      جاري البحث عن الأجهزة...
                    </Text>
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
                          لا توجد أجهزة بلوتوث متاحة الآن. تأكدي أن الجهاز قريب
                          ويعمل بنظام BLE، ثم اضغطي لإعادة البحث.
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.deviceItem,
                        selectedDevice?.id === item.id &&
                          styles.deviceItemSelected,
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

            <Text style={styles.inputLabel}>كلمة مرور</Text>

            <View style={styles.passwordBox}>
              <Ionicons name="lock-closed-outline" size={23} color="#9A9A9A" />

              <TextInput
                style={styles.passwordInput}
                placeholder="اكتب كلمة المرور"
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>

            {!!errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
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
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: height * 0.055,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: 6,
    marginBottom: 28,
  },

  stepsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 36,
  },

  stepItem: {
    width: 58,
    alignItems: "center",
  },

  stepCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
  },

  stepCircleActive: {
    backgroundColor: BURGUNDY,
  },

  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#B0B0B0",
    fontWeight: "700",
    includeFontPadding: false,
  },

  stepLabelActive: {
    color: BURGUNDY,
    fontWeight: "900",
  },

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

  headerTextBox: {
    flex: 1,
    alignItems: "flex-end",
    paddingTop: 2,
  },

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

  formArea: {
    width: "100%",
    marginTop: 34,
  },

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

  loadingText: {
    color: GRAY_TEXT,
    fontSize: 13,
    fontWeight: "700",
  },

  deviceList: {
    maxHeight: 165,
  },

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

  deviceItemSelected: {
    backgroundColor: "#FFF4F4",
  },

  deviceInfo: {
    flex: 1,
  },

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

  disabledButton: {
    opacity: 0.55,
  },

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