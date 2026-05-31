const express = require("express");
const mqtt = require("mqtt");

const app = express();
app.use(express.json());

const MQTT_URL = "mqtt://127.0.0.1:1883";
const API_TOKEN = "tnabbah-delete-secret-2026";

function connectMqtt() {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(MQTT_URL, {
      clientId: `mqtt_cleaner_${Date.now()}`,
      clean: true,
      connectTimeout: 8000,
    });

    client.on("connect", () => resolve(client));
    client.on("error", reject);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function publishDelete(client, topic) {
  return new Promise((resolve, reject) => {
    client.publish(topic, Buffer.alloc(0), { retain: true, qos: 1 }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

app.delete("/car/:userId/:carId", async (req, res) => {
  const token = req.headers["x-api-token"];

  if (token !== API_TOKEN) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { userId, carId } = req.params;
  const filter = `Tnabbah/${userId}/${carId}/#`;

  console.log("DELETE MQTT CAR:", filter);

  const client = await connectMqtt();
  const topics = new Set();

  client.on("message", (topic) => {
    topics.add(topic);
  });

  client.subscribe(filter, { qos: 1 }, async (err) => {
    if (err) {
      client.end(true);
      return res.status(500).json({ success: false, error: err.message });
    }

    await wait(2500);

    const topicList = Array.from(topics);
    console.log("FOUND TOPICS:", topicList.length);

    if (topicList.length === 0) {
      client.end(true);
      return res.status(404).json({
        success: false,
        message: "No retained topics found for this carId",
        userId,
        carId,
      });
    }

    try {
      for (const topic of topicList) {
        await publishDelete(client, topic);
      }

      await wait(1000);

      client.end(false);

      return res.json({
        success: true,
        userId,
        carId,
        deletedTopicsCount: topicList.length,
        deletedTopics: topicList,
      });
    } catch (error) {
      client.end(true);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
});

app.listen(3300, "0.0.0.0", () => {
  console.log("MQTT Cleaner running on :3300");
});