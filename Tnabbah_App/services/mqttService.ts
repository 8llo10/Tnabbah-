import mqtt, { MqttClient } from "mqtt";

const MQTT_URL = "ws://207.180.244.27:9001";

let client: MqttClient | null = null;
let connectingPromise: Promise<MqttClient> | null = null;

const subscriptions = new Set<string>();

type PublishOptions = {
  retain?: boolean;
  qos?: 0 | 1 | 2;
};

function safeStringify(payload: unknown) {
  try {
    return typeof payload === "string"
      ? payload
      : JSON.stringify(payload);
  } catch {
    return JSON.stringify({
      error: "payload_stringify_failed",
    });
  }
}

export const mqttService = {
  async connectAsync(): Promise<MqttClient> {
    if (client?.connected) {
      return client;
    }

    if (connectingPromise) {
      return connectingPromise;
    }

    connectingPromise = new Promise((resolve, reject) => {
      console.log("MQTT connecting:", MQTT_URL);

      client = mqtt.connect(MQTT_URL, {
        clientId: `tnabbah_mobile_${Date.now()}`,
        clean: true,

        reconnectPeriod: 2500,
        connectTimeout: 10000,
        keepalive: 30,

        resubscribe: true,
      });

      const timeout = setTimeout(() => {
        connectingPromise = null;

        reject(new Error("MQTT connection timeout"));
      }, 12000);

      client.on("connect", () => {
        console.log("✅ MQTT connected");

        clearTimeout(timeout);

        connectingPromise = null;

        resolve(client as MqttClient);
      });

      client.on("reconnect", () => {
        console.log("MQTT reconnecting...");
      });

      client.on("offline", () => {
        console.log("MQTT offline");
      });

      client.on("close", () => {
        console.log("MQTT closed");
      });

      client.on("error", (error) => {
        console.log("❌ MQTT error:", error);
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

    const message = safeStringify(payload);

    const retain = options.retain ?? false;
    const qos = options.qos ?? 0;

    console.log("📤 MQTT publish:", {
      topic,
      qos,
      retain,
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

          resolve();
        }
      );
    });
  },

  async publishRetainedAsync(
    topic: string,
    payload: unknown
  ) {
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

  async subscribeAsync(
    topic: string,
    onMessage: (payload: any, raw: string, topic: string) => void
  ) {
    const c = await this.connectAsync();

    if (subscriptions.has(topic)) {
      return;
    }

    subscriptions.add(topic);

    return new Promise<void>((resolve, reject) => {
      c.subscribe(topic, { qos: 0 }, (error) => {
        if (error) {
          console.log("❌ MQTT subscribe failed:", topic, error);

          reject(error);
          return;
        }

        console.log("✅ MQTT subscribed:", topic);

        resolve();
      });

      c.on("message", (incomingTopic, buffer) => {
        if (incomingTopic !== topic) return;

        const raw = buffer.toString();

        try {
          const parsed = JSON.parse(raw);

          onMessage(parsed, raw, incomingTopic);
        } catch {
          onMessage(raw, raw, incomingTopic);
        }
      });
    });
  },

  async unsubscribeAsync(topic: string) {
    if (!client) return;

    subscriptions.delete(topic);

    return new Promise<void>((resolve, reject) => {
      client?.unsubscribe(topic, (error) => {
        if (error) {
          reject(error);
          return;
        }

        console.log("MQTT unsubscribed:", topic);

        resolve();
      });
    });
  },

  isConnected() {
    return !!client?.connected;
  },

  getClient() {
    return client;
  },

  disconnect() {
    try {
      client?.end(true);
    } catch {}

    client = null;
    connectingPromise = null;

    subscriptions.clear();
  },
};