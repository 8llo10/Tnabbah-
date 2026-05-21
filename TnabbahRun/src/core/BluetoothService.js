// BluetoothService.js
import RNBluetoothClassic from "react-native-bluetooth-classic";

class BluetoothService {
  static async connect(device, password) {
    try {
      // إذا الجهاز BLE
      if (device.isConnectable) {
        console.log("🔵 Trying BLE connection...");
        const bleDevice = await device.connect();
        return bleDevice;
      }

      // إذا الجهاز Classic
      console.log("🟦 Trying Classic connection with PIN:", password);

      const classicDevice = await RNBluetoothClassic.connectToDevice(
        device.id,
        { PIN: password }
      );

      return classicDevice;
    } catch (err) {
      console.log("❌ BluetoothService connect error:", err);
      return null;
    }
  }
}

export default BluetoothService;