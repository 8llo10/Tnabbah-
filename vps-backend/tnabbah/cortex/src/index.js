require("dotenv").config({
  path: "/opt/tnabbah/cortex/env/.env",
});

const http = require("http");
const mqtt = require("mqtt");
const { analyzeVehicle } = require("./analyzer");
const CHATBOT_URL = "http://127.0.0.1:4010/snapshot";

const MQTT_URL = process.env.MQTT_URL || "mqtt://127.0.0.1:1883";
const MQTT_ROOT = process.env.MQTT_ROOT || "Tnabbah";
const CLIENT_ID =
  process.env.CORTEX_CLIENT_ID || `tnabbah_cortex_${Date.now()}`;
const CORTEX_PORT = Number(process.env.CORTEX_PORT || 3101);

const vehicles = new Map();

console.log("🧠 Cortex starting...");

const client = mqtt.connect(MQTT_URL, {
  clientId: CLIENT_ID,
  reconnectPeriod: 3000,
  clean: true,
});

function parseJson(buffer) {
  try {
    return JSON.parse(buffer.toString());
  } catch {
    return null;
  }
}

function parseTopic(topic) {
  const parts = topic.split("/");

  return {
    root: parts[0],
    userId: parts[1],
    carId: parts[2],
    path: parts.slice(3).join("/"),
  };
}

function getVehicleKey(userId, carId) {
  return `${userId}:${carId}`;
}

function getVehicleState(userId, carId) {
  const key = getVehicleKey(userId, carId);

  if (!vehicles.has(key)) {
    vehicles.set(key, {
      userId,
      carId,
      pids: {},
      dtcFull: null,
      srsFull: null,
      identity: null,
      status: null,
      updatedAt: Date.now(),
      lastAnalysisHash: "",
      analysis: null,
    });
  }

  return vehicles.get(key);
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "stringify_failed" });
  }
}

function analysisHash(result) {
  return safeStringify({
    health: result.health,
    alerts: result.alerts.map((a) => ({
      type: a.type,
      level: a.level,
      code: a.code,
      value: a.value,
    })),
  });
}

async function sendSnapshotToChatbot(vehicle, result) {

  try {

    const snapshot = {
      speed:
        vehicle.pids?.["010D"]?.value ?? null,

      engineTemp:
        vehicle.pids?.["0105"]?.value ?? null,

      rpm:
        vehicle.pids?.["010C"]?.value ?? null,

      batteryVoltage:
        vehicle.pids?.["0142"]?.value ?? null,

      overallHealth:
        result.health?.score ?? 100,

      healthLevel:
        result.health?.level ?? "normal",

      driveAdvice:
        result.summary?.recommendedAction ?? null,

      alerts:
        result.alerts ?? [],
    }

    await fetch(CHATBOT_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        userId: vehicle.userId,
        carId: vehicle.carId,
        snapshot,
      }),
    });

    console.log("📡 Snapshot sent:", {
      userId: vehicle.userId,
      carId: vehicle.carId,
    });

  } catch (error) {

    console.log(
      "❌ Snapshot failed:",
      error.message
    );
  }
}

function runAnalysis(vehicle) {
  const result = analyzeVehicle(vehicle);
  const hash = analysisHash(result);

  if (hash === vehicle.lastAnalysisHash) return;

  vehicle.lastAnalysisHash = hash;
  vehicle.analysis = result;
  sendSnapshotToChatbot(vehicle, result);
  vehicle.updatedAt = Date.now();

  console.log("🧠 Cortex analyzed:", {
    userId: vehicle.userId,
    carId: vehicle.carId,
    level: result.health.level,
    alerts: result.alerts.length,
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(data));
}

function buildHomePayload(userId, carId, vehicle, analysis) {
  const health = analysis.health || {};
  const summary = analysis.summary || {};
  const alerts = Array.isArray(analysis.alerts) ? analysis.alerts : [];

  const importantAlerts = alerts.filter((a) =>
    ["critical", "warning"].includes(a.level)
  );

  const mainIssue = importantAlerts[0] || null;

  const status =
    health.level === "critical"
      ? "urgent"
      : health.level === "warning"
        ? "watch"
        : "safe";

  return {
    ok: true,
    userId,
    carId,

    status,
    level: health.level || "normal",
    levelText: health.levelText || "طبيعي",
    score: health.score ?? 100,

    title: summary.title || health.title || "سيارتك مطمئنة",
    message:
      health.message ||
      "سيارتك تتكلم… اضغطي فحص وخلينا نطمن عليها 🤍",

    action:
      summary.recommendedAction ||
      (status === "urgent"
        ? "وقفي بأمان وافحصي السيارة."
        : status === "watch"
          ? "راقبي التنبيه وافحصي إذا تكرر."
          : "كملي عادي."),

    mainIssue,
    topIssues: importantAlerts.slice(0, 3),

    alertsCount: importantAlerts.length,
    totalAlertsCount: alerts.length,
    criticalCount: health.criticalCount || 0,
    warningCount: health.warningCount || 0,

    obdConnected: !!health.obdConnected,
    streaming: !!health.streaming,

    identity: vehicle.identity || null,
    updatedAt: vehicle.updatedAt || Date.now(),
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  const url = new URL(req.url, `http://0.0.0.0:${CORTEX_PORT}`);

  if (url.pathname === "/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "tnabbah-cortex",
      vehicles: vehicles.size,
      mqttConnected: client.connected,
      timestamp: Date.now(),
    });
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (parts[0] === "cortex" && parts.length >= 3) {
    const userId = decodeURIComponent(parts[1]);
    const carId = decodeURIComponent(parts[2]);
    const section = parts[3] || "full";

    const vehicle = vehicles.get(getVehicleKey(userId, carId));

    if (!vehicle) {
      return sendJson(res, 404, {
        ok: false,
        error: "vehicle_not_found",
      });
    }

    const analysis = vehicle.analysis || analyzeVehicle(vehicle);

    if (section === "home") {
      return sendJson(res, 200, buildHomePayload(userId, carId, vehicle, analysis));
    }

    if (section === "health") {
      return sendJson(res, 200, analysis.health);
    }

    if (section === "alerts") {
      return sendJson(res, 200, analysis.alerts);
    }

    if (section === "summary") {
      return sendJson(res, 200, analysis.summary);
    }

    return sendJson(res, 200, {
      ok: true,
      userId,
      carId,
      updatedAt: vehicle.updatedAt,
      analysis,
    });
  }

  sendJson(res, 404, {
    ok: false,
    error: "not_found",
  });
});

server.listen(CORTEX_PORT, "0.0.0.0", () => {
  console.log(`🧠 Cortex API listening on http://0.0.0.0:${CORTEX_PORT}`);
});

client.on("connect", () => {
  console.log("✅ Cortex connected to MQTT");

  const listenTopic = `${MQTT_ROOT}/+/+/#`;

  client.subscribe(listenTopic, { qos: 0 }, (error) => {
    if (error) {
      console.log("❌ Subscribe error:", error.message);
      return;
    }

    console.log("📡 Cortex listening:", listenTopic);
  });
});

client.on("message", (topic, buffer) => {
  const payload = parseJson(buffer);
  if (!payload) return;

  const info = parseTopic(topic);

  if (info.root !== MQTT_ROOT || !info.userId || !info.carId) return;

  const data = payload.data ?? payload;
  const vehicle = getVehicleState(info.userId, info.carId);

  vehicle.updatedAt = Date.now();

  if (info.path === "status") {
    vehicle.status = data;
    runAnalysis(vehicle);
    return;
  }

  if (info.path === "identity") {
    vehicle.identity = data;
    runAnalysis(vehicle);
    return;
  }

  if (info.path.startsWith("pids/")) {
    const pid = info.path.split("/")[1];

    if (
      pid &&
      pid !== "supported" &&
      pid !== "support-blocks" &&
      pid !== "all" &&
      data &&
      typeof data === "object" &&
      "value" in data
    ) {
      vehicle.pids[pid] = data;
      runAnalysis(vehicle);
    }

    return;
  }

  if (info.path === "dtc/full") {
    vehicle.dtcFull = data;
    runAnalysis(vehicle);
    return;
  }

  if (info.path === "srs/full") {
    vehicle.srsFull = data;
    runAnalysis(vehicle);
    return;
  }
});

client.on("reconnect", () => {
  console.log("🔄 MQTT reconnecting...");
});

client.on("offline", () => {
  console.log("⚠️ MQTT offline");
});

client.on("error", (error) => {
  console.log("❌ MQTT error:", error.message);
});