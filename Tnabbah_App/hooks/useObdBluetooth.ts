import { useEffect, useMemo, useState } from "react";
import { BleManager, Device, State } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";

export type BluetoothDeviceItem = {
  id: string;
  name: string;
  raw: Device;
};

export function useObdBluetooth() {
  const manager = useMemo(() => new BleManager(), []);

  const [devices, setDevices] = useState<BluetoothDeviceItem[]>([]);
  const [selectedDevice, setSelectedDevice] =
    useState<BluetoothDeviceItem | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [bluetoothState, setBluetoothState] = useState<State | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== "android") return true;

    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return Object.values(result).every(
      (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
    );
  };

  const startScan = async () => {
    console.log("✅ startScan pressed");

    setErrorMessage("");
    setDevices([]);
    setSelectedDevice(null);

    const hasPermission = await requestAndroidPermissions();

    if (!hasPermission) {
      setErrorMessage("لم يتم السماح بصلاحيات البلوتوث.");
      return;
    }

    const state = await manager.state();
    console.log("Bluetooth state:", state);

    setBluetoothState(state);

    if (state !== State.PoweredOn) {
      setErrorMessage("البلوتوث غير مفعّل. فعّلي البلوتوث ثم حاولي مرة أخرى.");
      return;
    }

    setIsScanning(true);

    manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.log("Bluetooth scan error:", error);
        setIsScanning(false);
        setErrorMessage(error.message || "حدث خطأ أثناء البحث عن الأجهزة.");
        return;
      }

      if (!device) return;

      const deviceName =
        device.name || device.localName || "جهاز بلوتوث غير معروف";

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
  };

  const connectToSelectedDevice = async () => {
    if (!selectedDevice) {
      setErrorMessage("اختاري جهاز البلوتوث أولًا.");
      return false;
    }

    try {
      setErrorMessage("");
      setIsConnecting(true);

      manager.stopDeviceScan();

      const connected = await manager.connectToDevice(selectedDevice.id, {
        timeout: 15000,
      });

      await connected.discoverAllServicesAndCharacteristics();

      setConnectedDevice(connected);
      setIsConnecting(false);

      return true;
    } catch (error: any) {
      console.log("Bluetooth connect error:", error);
      setIsConnecting(false);
      setErrorMessage(error?.message || "تعذر الاتصال بجهاز البلوتوث.");
      return false;
    }
  };

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      setBluetoothState(state);

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

  return {
    devices,
    selectedDevice,
    setSelectedDevice,
    connectedDevice,
    isScanning,
    isConnecting,
    bluetoothState,
    errorMessage,
    startScan,
    connectToSelectedDevice,
  };
}