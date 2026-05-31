const http = require("http");
const mqtt = require("mqtt");

require("dotenv").config({
  path: "/opt/tnabbah/proxy/env/.env",
});

const MQTT_HOST = process.env.MQTT_HOST || "localhost";
const MQTT_PORT = process.env.MQTT_PORT || "1883";
const PROXY_PORT = process.env.PROXY_PORT || "4000";

const CORTEX_HOST = "127.0.0.1";
const CORTEX_PORT = "3101";

const mqttClient = mqtt.connect(`mqtt://${MQTT_HOST}:${MQTT_PORT}`);

mqttClient.on("connect", () => {
  console.log("✅ Proxy connected to MQTT broker");
});

mqttClient.on("error", (error) => {
  console.log("❌ Proxy MQTT error:", error.message);
});

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });

  res.end(JSON.stringify(data, null, 2));
}

function proxyToCortex(res, cortexPath) {
  const options = {
    hostname: CORTEX_HOST,
    port: CORTEX_PORT,
    path: cortexPath,
    method: "GET",
  };

  const cortexReq = http.request(options, (cortexRes) => {
    let body = "";

    cortexRes.on("data", (chunk) => {
      body += chunk;
    });

    cortexRes.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        sendJson(res, cortexRes.statusCode || 200, parsed);
      } catch {
        sendJson(res, 502, {
          ok: false,
          error: "invalid_cortex_response",
          raw: body,
        });
      }
    });
  });

  cortexReq.on("error", (error) => {
    sendJson(res, 502, {
      ok: false,
      error: "cortex_unreachable",
      message: error.message,
    });
  });

  cortexReq.end();
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  const url = new URL(req.url, `http://127.0.0.1:${PROXY_PORT}`);
  const parts = url.pathname.split("/").filter(Boolean);

  if (url.pathname === "/" || url.pathname === "/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "tnabbah-proxy",
      proxyPort: Number(PROXY_PORT),
      mqtt: {
        host: MQTT_HOST,
        port: Number(MQTT_PORT),
        connected: mqttClient.connected,
      },
      cortex: {
        internalUrl: `http://${CORTEX_HOST}:${CORTEX_PORT}`,
      },
      timestamp: Date.now(),
    });
  }

  if (parts[0] === "cortex") {
    const cortexPath = "/" + parts.map(encodeURIComponent).join("/");
    return proxyToCortex(res, cortexPath);
  }

  return sendJson(res, 404, {
    ok: false,
    error: "not_found",
  });
});

server.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log(`🚀 Proxy running on http://0.0.0.0:${PROXY_PORT}`);
});
