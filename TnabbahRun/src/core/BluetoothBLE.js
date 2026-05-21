// BluetoothBLE.js
export default {
  async tryConnect(device) {
    try {
      const connected = await device.connect({ timeout: 8000 });
      await connected.discoverAllServicesAndCharacteristics();
      return connected; // نجاح BLE
    } catch (err) {
      return null; // فشل BLE → نخلي BluetoothService يجرب Classic
    }
  }
};