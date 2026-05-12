import mqtt, { MqttClient } from "mqtt";

const MQTT_URL = "ws://207.180.244.27:9001";

let client: MqttClient | null = null;
let connectingPromise: Promise<MqttClient> | null = null;

type PublishOptions = {
  retain?: boolean;
  qos?: 0 | 1 | 2;
};

export const mqttService = {
  connectAsync(): Promise<MqttClient> {
    if (client?.connected) {
      return Promise.resolve(client);
    }

    if (connectingPromise) {
      return connectingPromise;
    }

    connectingPromise = new Promise((resolve, reject) => {
      console.log("MQTT connecting to:", MQTT_URL);

      client = mqtt.connect(MQTT_URL, {
        clientId: `tnabbah_mobile_${Date.now()}`,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 10000,
        keepalive: 30,
      });

      const timeout = setTimeout(() => {
        connectingPromise = null;
        reject(new Error("MQTT connection timeout"));
      }, 12000);

      client.on("connect", () => {
        clearTimeout(timeout);
        console.log("✅ MQTT connected");
        connectingPromise = null;
        resolve(client as MqttClient);
      });

      client.on("error", (error) => {
        console.log("❌ MQTT error:", error);
      });

      client.on("close", () => {
        console.log("MQTT closed");
      });

      client.on("offline", () => {
        console.log("MQTT offline");
      });

      client.on("reconnect", () => {
        console.log("MQTT reconnecting...");
      });
    });

    return connectingPromise;
  },

  async publishAsync(
    topic: string,
    payload: unknown,
    options: PublishOptions = {}
  ) {
    const c = await this.connectAsync();

    const message =
      typeof payload === "string" ? payload : JSON.stringify(payload);

    const retain = options.retain ?? false;
    const qos = options.qos ?? 0;

    console.log("📤 MQTT publish:", {
      topic,
      retain,
      qos,
      message,
    });

    return new Promise<void>((resolve, reject) => {
      c.publish(
        topic,
        message,
        {
          qos,
          retain,
        },
        (error) => {
          if (error) {
            console.log("❌ MQTT publish failed:", topic, error);
            reject(error);
            return;
          }

          console.log("✅ MQTT published:", topic);
          resolve();
        }
      );
    });
  },

  async publishRetainedAsync(topic: string, payload: unknown) {
    return this.publishAsync(topic, payload, {
      retain: true,
      qos: 0,
    });
  },

  async clearRetainedAsync(topic: string) {
    return this.publishAsync(topic, "", {
      retain: true,
      qos: 0,
    });
  },

  disconnect() {
    client?.end();
    client = null;
    connectingPromise = null;
  },
};