import mqtt from "mqtt";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

// نخزن البيانات هنا بشكل مرتب
let cache = {
    status: null,
    live: null,
    dtcs: null,
    raw: {}   // كل التوبكس الأصلية
};

// اتصال MQTT
const client = mqtt.connect("ws://192.168.68.101:9001");

client.on("connect", () => {
    console.log("MQTT Connected");
    client.subscribe("obd/UNKNOWN-CAR/#");
});

// استقبال الرسائل
client.on("message", (topic, msg) => {
    try {
        const data = JSON.parse(msg.toString());

        // نخزن النسخة الخام
        cache.raw[topic] = data;

        // نخزن حسب النوع
        if (topic.includes("status")) {
            cache.status = data;
        }

        if (topic.includes("live")) {
            cache.live = data;
        }

        if (topic.includes("dtcs")) {
            cache.dtcs = data;
        }

        console.log("MQTT → Proxy:", topic, data);

    } catch (e) {
        console.log("Invalid JSON from topic:", topic);
    }
});

// API
app.get("/car", (req, res) => {
    res.json(cache);
});

// البروكسي للويب 
app.listen(3000, "127.0.0.1", () => {
    console.log("Proxy running on http://127.0.0.1:3000");
});
