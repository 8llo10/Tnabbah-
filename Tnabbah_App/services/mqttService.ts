import mqtt, { MqttClient } from "mqtt";

const MQTT_URL = "ws://207.180.244.27:9001";

let client: MqttClient | null = null;
let connectingPromise: Promise<MqttClient> | null = null;

type Listener = (payload: any, raw: string, topic: string) => void;

const listenersByTopic = new Map<string, Set<Listener>>();
const subscribedTopics = new Set<string>();

let globalMessageHandlerAttached = false;

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

function topicMatches(filter: string, topic: string) {
  const filterParts = filter.split("/");
  const topicParts = topic.split("/");

  for (let i = 0; i < filterParts.length; i++) {
    if (filterParts[i] === "#") return true;
    if (filterParts[i] === "+") {
      if (topicParts[i] === undefined) return false;
      continue;
    }
    if (filterParts[i] !== topicParts[i]) return false;
  }

  return filterParts.length === topicParts.length;
}

function attachGlobalMessageHandler(c: MqttClient) {
  if (globalMessageHandlerAttached) return;

  globalMessageHandlerAttached = true;

  c.on("message", (incomingTopic, buffer) => {
    const raw = buffer.toString();

    let payload: any = raw;
    try {
      payload = JSON.parse(raw);
    } catch { }

    listenersByTopic.forEach((listeners, filter) => {
      if (!topicMatches(filter, incomingTopic)) return;

      listeners.forEach((listener) => {
        listener(payload, raw, incomingTopic);
      });
    });
  });
}

export const mqttService = {
  async connectAsync(): Promise<MqttClient> {
    if (client?.connected) {
      attachGlobalMessageHandler(client);
      return client;
    }

    if (connectingPromise) {
      return connectingPromise;
    }

    connectingPromise = new Promise((resolve, reject) => {
      console.log("MQTT connecting:", MQTT_URL);

      client = mqtt.connect(MQTT_URL, {
        clientId: `tnabbah_mobile_${Date.now()}`,
        clean: false,

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

        attachGlobalMessageHandler(client as MqttClient);

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
      qos: 1,
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
    onMessage: Listener
  ) {
    const c = await this.connectAsync();

    let listeners = listenersByTopic.get(topic);

    if (!listeners) {
      listeners = new Set<Listener>();
      listenersByTopic.set(topic, listeners);
    }

    listeners.add(onMessage);

    if (subscribedTopics.has(topic)) {
      return;
    }

    subscribedTopics.add(topic);

    return new Promise<void>((resolve, reject) => {
      c.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          subscribedTopics.delete(topic);
          reject(error);
          return;
        }

        console.log("✅ MQTT subscribed:", topic);
        resolve();
      });
    });
  },

  async unsubscribeAsync(topic: string, onMessage?: Listener) {
    if (!client) return;

    const listeners = listenersByTopic.get(topic);

    if (listeners && onMessage) {
      listeners.delete(onMessage);
    } else {
      listenersByTopic.delete(topic);
    }

    if (listenersByTopic.get(topic)?.size) {
      return;
    }

    listenersByTopic.delete(topic);
    subscribedTopics.delete(topic);

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
    } catch { }

    client = null;
    connectingPromise = null;

    globalMessageHandlerAttached = false;
    listenersByTopic.clear();
    subscribedTopics.clear();
  },
};