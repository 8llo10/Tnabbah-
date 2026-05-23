import RNBluetoothClassic from "react-native-bluetooth-classic";

export default {
  async connect(device, password) {
    try {
      // لو فيه كلمة مرور
      if (password && password.length > 0) {
        await RNBluetoothClassic.pairDevice(device.id, password);
      }

      // لو ما فيه كلمة مرور، نحاول بدونها
      const connected = await RNBluetoothClassic.connectToDevice(device.id);
      return connected;
    } catch (err) {
      throw new Error("فشل الاتصال عبر Bluetooth Classic");
    }
  }
};