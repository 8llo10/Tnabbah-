import ELM327 from "./ELM327";
import Mode09Engine from "./Mode09Engine";
import CarIdentityEngine from "./CarIdentityEngine";
import PIDDiscoveryEngine from "./PIDDiscoveryEngine";
import LiveDataEngine from "./LiveDataEngine";
import DTCEngine from "./DTCEngine";
import BluetoothService from "./BluetoothService";

// ---------------------------------------------------------
//  🔥 دمج MQTTClient داخل نفس الملف
// ---------------------------------------------------------
class MQTTClient {
  static connected = false;

  static async connect(userId) {
    try {
      console.log("MQTT connecting for user:", userId);

const url = "ws://207.180.244.27:9001";
MQTTClient.socket = new WebSocket(url);

MQTTClient.socket.onopen = () => {
  console.log("✅ MQTT WebSocket connected");
  MQTTClient.connected = true;
};

MQTTClient.socket.onerror = (err) => {
  console.log("❌ MQTT error:", err.message);
  MQTTClient.connected = false;
};

MQTTClient.socket.onclose = () => {
  console.log("⚠️ MQTT WebSocket closed");
  MQTTClient.connected = false;
};
    } catch (err) {
      console.log("MQTT connect error:", err);
      MQTTClient.connected = false;
    }
  }

  static async publish(topic, payload) {
    if (!MQTTClient.connected) return;
    console.log(`MQTT → ${topic}:`, payload);
    // هنا كود النشر الحقيقي لو تبين
  }
}

// ---------------------------------------------------------
//  🔥 دمج MQTTPublisher داخل نفس الملف
// ---------------------------------------------------------
class MQTTPublisher {
  constructor(userId) {
    this.userId = userId;
  }

  publishStatus(status) {
    MQTTClient.publish("status", { userId: this.userId, status });
  }

  publishVehicleInfo(info) {
    MQTTClient.publish("vehicle/info", { userId: this.userId, info });
  }

  publishVehicleID(id) {
    MQTTClient.publish("vehicle/id", { userId: this.userId, id });
  }

  publishLiveData(data) {
    MQTTClient.publish("vehicle/live", { userId: this.userId, data });
  }

  publishDTC(dtc) {
    MQTTClient.publish("vehicle/dtc", { userId: this.userId, dtc });
  }
}

// ---------------------------------------------------------
//  🔥 كودك الأصلي كامل بدون ولا تغيير
// ---------------------------------------------------------
class OBDManager {
  static instance = null;

  static getInstance() {
    if (!OBDManager.instance) {
      OBDManager.instance = new OBDManager();
    }
    return OBDManager.instance;
  }

  constructor() {
    this.elm = null;
    this.mqtt = null;
    this.connected = false;
    this.supportedPIDs = [];
    this.liveInterval = null;
    this.dtcInterval = null;
    this.userId = null;
  }

  async init(userId) {
    this.userId = userId;

    await MQTTClient.connect(userId);
    this.mqtt = new MQTTPublisher(userId);
    this.mqtt.publishStatus("app_started");

    this.elm = null;
    this.mode09 = null;
    this.carIdentity = null;
    this.pidDiscovery = null;
    this.liveData = null;
    this.dtc = null;

    console.log("OBDManager initialized");
  }

  async connect(deviceId) {
    try {
      this.mqtt?.publishStatus("connecting_bluetooth");

      const bt = await BluetoothService.connect(deviceId);

      this.elm = new ELM327(bt);
      await this.elm.initCharacteristics();
      await this.elm.init();

      this.connected = true;
      this.mqtt?.publishStatus("elm_initialized");

      this.mode09 = new Mode09Engine(this.elm);
      this.carIdentity = new CarIdentityEngine(this.elm);
      this.pidDiscovery = new PIDDiscoveryEngine(this.elm);

      await this.runMode09();
      await this.runPIDDiscovery();

      this.liveData = new LiveDataEngine(this.elm, this.supportedPIDs);
      this.dtc = new DTCEngine(this.elm);

      this.startLiveDataLoop();
      this.startDTCStream();

      BluetoothService.onDisconnect(() => {
        console.log("Bluetooth disconnected");
        this.disconnect();
      });

    } catch (err) {
      console.log("OBDManager connect error:", err);
      this.disconnect();
    }
  }

  async runMode09() {
    const vehicleInfo = await this.mode09.buildVehicleInfoPayload();
    const carId = await this.carIdentity.getCarID();

    global.vehicleInfo = vehicleInfo;
    global.carId = carId;

    this.mqtt?.publishVehicleInfo(vehicleInfo);
    this.mqtt?.publishVehicleID(carId);
  }

  async runPIDDiscovery() {
    this.supportedPIDs = await this.pidDiscovery.discover();
    global.supportedPIDs = this.supportedPIDs;
  }

  startDTCStream() {
    if (this.dtcInterval) clearInterval(this.dtcInterval);

    this.dtcInterval = setInterval(async () => {
      try {
        const dtcPayload = await this.dtc.readAll();
        global.dtcs = dtcPayload;
        this.mqtt?.publishDTC(dtcPayload);
      } catch (err) {
        console.log("DTC stream error:", err);
      }
    }, 5000);
  }

  startLiveDataLoop() {
    if (this.liveInterval) clearInterval(this.liveInterval);

    this.liveInterval = setInterval(async () => {
      try {
        const data = await this.liveData.readAll();
        global.liveData = data;
        this.mqtt?.publishLiveData(data);
      } catch (err) {
        console.log("Live data error:", err);
        this.disconnect();
      }
    }, 1000);
  }

  disconnect() {
    console.log("OBDManager: disconnect called");

    if (this.liveInterval) clearInterval(this.liveInterval);
    if (this.dtcInterval) clearInterval(this.dtcInterval);

    this.connected = false;
    this.elm = null;

    this.mqtt?.publishStatus("disconnected");
    MQTTClient.connected = false;
  }
}

export default OBDManager.getInstance();