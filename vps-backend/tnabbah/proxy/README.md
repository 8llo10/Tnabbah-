# Proxy Service - TNABBAH VPS Backend

The Proxy Service acts as the public API gateway of the TNABBAH backend infrastructure.

It receives requests from the TNABBAH mobile application and safely forwards them to internal backend services such as Cortex.

The Proxy Service also monitors MQTT broker connectivity and provides backend health information.

---

## Service Name

Proxy Service

---

## Main Purpose

The Proxy Service acts as the public API gateway of the TNABBAH backend.

Instead of exposing internal services directly, the mobile application communicates with the Proxy Service.

The Proxy Service then forwards requests to internal backend services such as Cortex.

This architecture improves:

- Security
- Service isolation
- Scalability
- Backend maintainability
- Internal service protection

---

## Current Responsibilities

The Proxy Service currently:

- Provides a public HTTP endpoint
- Exposes a health endpoint
- Reports MQTT connection status
- Forwards Cortex API requests
- Hides internal Cortex endpoints from external clients

The mobile application communicates with the Proxy Service instead of directly accessing Cortex.

---

## Technology Used

- Node.js
- Native HTTP Server
- MQTT.js
- dotenv
- Ubuntu 24.04
- Systemd
- Contabo VPS

---

## Environment Configuration

Environment file location:

```txt
/opt/tnabbah/proxy/env/.env
```

Current configuration:

```env
MQTT_HOST=localhost
MQTT_PORT=1883
PROXY_PORT=4000
```

---

## MQTT Monitoring

The Proxy Service establishes a connection to the MQTT broker.

Purpose:

- Verify broker availability
- Report MQTT status through the health endpoint
- Assist backend monitoring

The service does not currently process vehicle MQTT topics directly.

MQTT connection:

```txt
mqtt://localhost:1883
```

---

## Internal Cortex Connection

The Proxy Service forwards requests to Cortex.

Internal Cortex configuration:

```txt
Host: 127.0.0.1
Port: 3101
```

Internal Cortex URL:

```txt
http://127.0.0.1:3101
```

---

## Default Port

```txt
4000
```

The Proxy Service listens on:

```txt
http://0.0.0.0:4000
```

---

## Why Port 4000?

TNABBAH backend services use dedicated ports:

```txt
1883 = Mosquitto MQTT Broker
9001 = Mosquitto MQTT WebSocket
3101 = Cortex Service
3102 = Notifications Worker
3300 = MQTT Cleaner
4000 = Proxy Service
4010 = ChatPot Service
8001 = Diagnostics Service
```

This separation improves:

- Maintainability
- Monitoring
- Scalability
- Service Recovery
- Debugging

---

## Available Endpoints

### Health Check

```http
GET /health
```

Returns:

- Proxy status
- MQTT connection status
- Internal Cortex information
- Timestamp

Example Response:

```json
{
  "ok": true,
  "service": "tnabbah-proxy",
  "proxyPort": 4000,
  "mqtt": {
    "host": "localhost",
    "port": 1883,
    "connected": true
  },
  "cortex": {
    "internalUrl": "http://127.0.0.1:3101"
  },
  "timestamp": 1740000000000
}
```

---

### Root Endpoint

```http
GET /
```

Returns the same information as the health endpoint.

---

### Cortex Proxy Endpoint

```http
GET /cortex/*
```

The Proxy Service forwards Cortex requests to the internal Cortex service.

Example:

```http
GET /cortex/user123/car456/home
```

Forwarded internally to:

```http
GET http://127.0.0.1:3101/cortex/user123/car456/home
```

The response is returned back to the mobile application.

---

## Request Flow

```txt
Mobile Application
        │
        ▼
Proxy Service :4000
        │
        ▼
Cortex Service :3101
        │
        ▼
Vehicle Analysis Engine
```

---

## CORS Support

The service supports CORS requests.

Allowed:

```txt
GET
OPTIONS
```

Headers:

```txt
Content-Type
Authorization
```

Current configuration:

```js
Access-Control-Allow-Origin: *
```

This allows requests from mobile and web clients.

---

## Systemd Service

Service file:

```ini
[Unit]
Description=MQTT Proxy Server
After=network.target

[Service]
WorkingDirectory=/opt/tnabbah/proxy/src
ExecStart=/usr/bin/node index.js
Restart=always
EnvironmentFile=/opt/tnabbah/proxy/env/.env

[Install]
WantedBy=multi-user.target
```

---

## Working Directory

The service runs from:

```txt
/opt/tnabbah/proxy/src
```

Main startup file:

```txt
index.js
```

---

## Why Restart=always?

The service uses:

```ini
Restart=always
```

This ensures automatic recovery if:

- The Node.js process crashes
- The service stops unexpectedly
- The VPS experiences temporary issues

---

## Installation

Install dependencies:

```bash
npm install
```

---

## Run Manually

```bash
node index.js
```

Expected output:

```txt
✅ Proxy connected to MQTT broker
🚀 Proxy running on http://0.0.0.0:4000
```

---

## Service Management

Start:

```bash
sudo systemctl start proxy
```

Stop:

```bash
sudo systemctl stop proxy
```

Restart:

```bash
sudo systemctl restart proxy
```

Status:

```bash
sudo systemctl status proxy
```

Enable startup:

```bash
sudo systemctl enable proxy
```

Disable startup:

```bash
sudo systemctl disable proxy
```

---

## Verification Commands

Check service:

```bash
sudo systemctl status proxy
```

Check port:

```bash
ss -tulpn | grep 4000
```

Check logs:

```bash
journalctl -u proxy -f
```

Check health endpoint:

```bash
curl http://localhost:4000/health
```

Check root endpoint:

```bash
curl http://localhost:4000/
```

---

## Environment Variables

Required variables:

```env
MQTT_HOST=localhost
MQTT_PORT=1883
PROXY_PORT=4000
```

---

## Files To Upload To GitHub

```txt
src/
package.json
package-lock.json
README.md
.env.example
```

---

## Files Not To Upload

```txt
.env
node_modules
logs
```

---

## Recovery Procedure

If the VPS is replaced:

```bash
git clone YOUR_REPOSITORY_URL
cd proxy

npm install

nano .env

sudo systemctl enable proxy
sudo systemctl start proxy

sudo systemctl status proxy
```

Verify:

```bash
curl http://localhost:4000/health
```

---

## TNABBAH Backend Architecture

```txt
Vehicle Device
        │
        ▼
Mosquitto MQTT Broker
        │
        ▼
Cortex Service
        │
        ▼
Proxy Service
        │
        ▼
Mobile Application
```

---

## Notes

- Proxy is the public gateway of the TNABBAH backend.
- Cortex is not exposed directly to mobile clients.
- MQTT status is monitored through the Proxy Service.
- Internal Cortex requests are forwarded automatically.
- The service runs on the Contabo VPS.
- The service automatically restarts through systemd.
- The service is part of the TNABBAH backend infrastructure.