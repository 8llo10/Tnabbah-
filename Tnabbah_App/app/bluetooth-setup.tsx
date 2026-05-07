import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BleManager, Device, State } from "react-native-ble-plx";

const BURGUNDY = "#871B17";

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
  const [errorMessage, setErrorMessage] = useState("");

  const startScan = async () => {
    try {
      console.log("✅ startScan pressed");

      setErrorMessage("");
      setDevices([]);
      setSelectedDevice(null);

      const state = await manager.state();
      console.log("Bluetooth state:", state);

      if (state !== State.PoweredOn) {
        setErrorMessage(
          "البلوتوث غير مفعّل. فعّلي البلوتوث من الجوال ثم اضغطي بحث."
        );
        return;
      }

      setIsScanning(true);

      manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          console.log("Bluetooth scan error:", error);
          setErrorMessage(error.message || "صار خطأ أثناء البحث عن الأجهزة.");
          setIsScanning(false);
          return;
        }

        if (!device) return;

        const deviceName =
          device.name ||
          device.localName ||
          `جهاز قريب ${device.id.slice(-5)}`;

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
      });

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
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Ionicons name="bluetooth" size={38} color={BURGUNDY} />
            </View>

            <Text style={styles.title}>أجهزة البلوتوث المتوفرة</Text>
            <Text style={styles.subtitle}>
              اضغطي بحث لعرض أجهزة البلوتوث القريبة من جوالك.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={startScan}
            disabled={isScanning || isConnecting}
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="search" size={20} color="#fff" />
            )}

            <Text style={styles.scanButtonText}>
              {isScanning ? "جاري البحث..." : "بحث عن الأجهزة"}
            </Text>
          </TouchableOpacity>

          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          {selectedDevice && (
            <View style={styles.selectedBox}>
              <Text style={styles.selectedLabel}>الجهاز المختار:</Text>
              <Text style={styles.selectedName}>{selectedDevice.name}</Text>
              <Text style={styles.selectedId}>ID: {selectedDevice.id}</Text>
            </View>
          )}

          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            style={styles.list}
            ListEmptyComponent={
              !isScanning ? (
                <Text style={styles.emptyText}>
                  ما ظهرت أجهزة حتى الآن. تأكدي أن البلوتوث شغال والقطعة قريبة.
                </Text>
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
                  setErrorMessage("");
                }}
              >
                <Ionicons name="bluetooth" size={24} color={BURGUNDY} />

                <View style={styles.deviceTextBox}>
                  <Text style={styles.deviceName}>{item.name}</Text>
                  <Text style={styles.deviceId}>ID: {item.id}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={[
              styles.connectButton,
              (!selectedDevice || isConnecting) && styles.disabledButton,
            ]}
            disabled={!selectedDevice || isConnecting}
            onPress={handleConnectDevice}
          >
            {isConnecting ? (
              <View style={styles.connectingRow}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.connectButtonText}>جاري الاتصال...</Text>
              </View>
            ) : (
              <Text style={styles.connectButtonText}>اختيار الجهاز</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: "#E0D0D0",
    borderRadius: 22,
    padding: 22,
    backgroundColor: "#FFFFFF",
    minHeight: 560,
  },
  header: {
    alignItems: "center",
    marginBottom: 22,
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#F8E8E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1F1F1F",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
  },
  scanButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: BURGUNDY,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  errorText: {
    marginTop: 14,
    color: "#C62828",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  selectedBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8E8E8",
  },
  selectedLabel: {
    fontSize: 12,
    color: "#777",
    textAlign: "right",
  },
  selectedName: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "900",
    color: BURGUNDY,
    textAlign: "right",
  },
  selectedId: {
    marginTop: 4,
    fontSize: 11,
    color: "#999",
    textAlign: "right",
  },
  list: {
    marginTop: 18,
    maxHeight: 280,
  },
  emptyText: {
    marginTop: 30,
    textAlign: "center",
    color: "#888",
    lineHeight: 22,
  },
  deviceItem: {
    minHeight: 66,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FAFAFA",
  },
  deviceItemSelected: {
    borderColor: BURGUNDY,
    backgroundColor: "#FFF4F4",
  },
  deviceTextBox: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F1F1F",
    textAlign: "right",
  },
  deviceId: {
    marginTop: 4,
    fontSize: 11,
    color: "#999",
    textAlign: "right",
  },
  connectButton: {
    marginTop: 14,
    height: 50,
    borderRadius: 15,
    backgroundColor: BURGUNDY,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.45,
  },
  connectingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  connectButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
});