# Cortex Service - TNABBAH Intelligent Vehicle Analysis Engine

The Cortex service is the intelligent vehicle analysis engine of the TNABBAH platform.

It receives live vehicle data from MQTT topics, analyzes diagnostic information, evaluates vehicle health, generates alerts, calculates health scores, creates user-friendly recommendations, and provides summarized vehicle status for the TNABBAH mobile application.

---

## Service Name

Cortex Service

---

## Main Purpose

The Cortex service acts as the central decision-making layer between raw vehicle data and the TNABBAH mobile application.

Its responsibilities include:

- Receiving live vehicle data from MQTT
- Decoding OBD-II PID values
- Processing Diagnostic Trouble Codes (DTCs)
- Processing SRS safety information
- Generating intelligent vehicle alerts
- Calculating vehicle health scores
- Producing user-friendly recommendations
- Building dashboard summaries
- Providing vehicle status APIs
- Sending live vehicle snapshots to the ChatPot AI service

---

## Technology Used

- Node.js
- Express.js
- MQTT
- Axios
- dotenv
- PM2
- Contabo VPS

---

## System Role

Cortex is responsible for transforming raw vehicle data into meaningful information that can be displayed inside the TNABBAH application.

Instead of showing raw hexadecimal OBD responses, Cortex converts the information into:

- Health Scores
- Alerts
- Vehicle Summaries
- Recommendations
- Dashboard Information
- AI Context Data

---

## Internal Components

### MQTT Engine

Receives vehicle data from MQTT topics.

Subscribed topics include:

```txt
Tnabbah/{userId}/{carId}/status
Tnabbah/{userId}/{carId}/identity
Tnabbah/{userId}/{carId}/pids/*
Tnabbah/{userId}/{carId}/dtc/full
Tnabbah/{userId}/{carId}/srs/full
```

---

### PID Decoder Engine

Responsible for converting raw OBD-II hexadecimal responses into readable values.

Examples:

```txt
010C → Engine RPM
010D → Vehicle Speed
0105 → Coolant Temperature
0142 → Battery Voltage
0110 → Mass Air Flow
012F → Fuel Level
```

Example:

```txt
Raw:
410C1AF8
```

Becomes:

```txt
Engine RPM = 1726 RPM
```

---

### DTC Knowledge Engine

Provides explanations for diagnostic trouble codes.

Example:

```txt
P0300
```

Becomes:

```txt
Random Engine Misfire

Severity:
Critical

Possible Causes:
- Spark Plugs
- Ignition Coils
- Fuel Injectors
```

This makes fault codes understandable for non-technical users.

---

### SRS Knowledge Engine

Processes safety-system information.

Supported systems include:

- Airbags
- Seatbelt Pretensioners
- Crash Sensors
- Occupancy Sensors
- Safety Communication Modules

The engine translates safety-related faults into simple user explanations.

---

### Brand Knowledge Engine

Provides manufacturer-specific vehicle knowledge.

Current supported manufacturers include:

```txt
Toyota
Lexus
```

Examples:

- Hybrid Systems
- CVT Systems
- TPMS Systems
- Radar Systems
- Blind Spot Monitoring
- Smart Key Systems
- Climate Systems

---

### Vehicle Analysis Engine

Analyzes all collected vehicle information.

Processes:

- PID Data
- DTC Data
- SRS Data
- Vehicle Identity
- Live Status

Generates:

- Health Score
- Vehicle Status
- Alerts
- Recommendations

---

### Alert Engine

Generates alerts based on detected vehicle conditions.

Examples:

- Engine Overheating
- Low Battery Voltage
- Abnormal Fuel Trim
- High Idle RPM
- Communication Problems
- Critical DTC Faults

---

### Health Score Engine

Calculates a vehicle health score between:

```txt
0 - 100
```

Used by the mobile application to quickly show the overall condition of the vehicle.

---

### Summary Engine

Creates user-friendly summaries for:

- Home Screen
- Reports
- Notifications
- AI Assistant

---

## ChatPot Integration

Cortex communicates directly with the ChatPot AI service.

Snapshot endpoint:

```txt
http://127.0.0.1:4010/snapshot
```

Purpose:

- Send live vehicle snapshots
- Provide AI context
- Improve ChatPot responses

---

## REST API Endpoints

### Health Check

```http
GET /health
```

Used to verify that Cortex is running.

---

### Vehicle Overview

```http
GET /cortex/:userId/:carId
```

Returns complete vehicle analysis.

---

### Home Dashboard

```http
GET /cortex/:userId/:carId/home
```

Returns optimized dashboard information.

---

### Vehicle Health

```http
GET /cortex/:userId/:carId/health
```

Returns health score and status.

---

### Vehicle Alerts

```http
GET /cortex/:userId/:carId/alerts
```

Returns generated alerts.

---

### Vehicle Summary

```http
GET /cortex/:userId/:carId/summary
```

Returns a user-friendly vehicle summary.

---

## Service Architecture

```txt
MQTT Topics
      │
      ▼
MQTT Engine
      │
      ▼
PID Decoder Engine
      │
      ├── DTC Knowledge Engine
      │
      ├── SRS Knowledge Engine
      │
      ├── Brand Knowledge Engine
      │
      ▼
Vehicle Analysis Engine
      │
      ▼
Health Score Engine
      │
      ▼
Alert Engine
      │
      ▼
Summary Engine
      │
      ├── Mobile App APIs
      │
      └── ChatPot Integration
```

---

## VPS Deployment

The service is currently deployed on the Contabo VPS.

Used by:

- TNABBAH Mobile Application
- ChatPot Service
- Vehicle Dashboard
- Diagnostic Reports
- Alert System

---

## Environment Variables

Create:

```txt
.env
```

Example:

```env
MQTT_URL=mqtt://127.0.0.1:1883

PORT=3101

CHATBOT_URL=http://127.0.0.1:4010/snapshot
```

---

## Default Port

```txt
3101
```

The Cortex service runs on port 3101.

---

## Installation

Install dependencies:

```bash
npm install
```

---

## Run Locally

```bash
node server.js
```

---

## PM2 Deployment

Start service:

```bash
pm2 start server.js --name cortex
```

Check status:

```bash
pm2 status
```

View logs:

```bash
pm2 logs cortex
```

Restart:

```bash
pm2 restart cortex
```

Save:

```bash
pm2 save
```

Enable startup:

```bash
pm2 startup
```

Run the generated command and then:

```bash
pm2 save
```

---

## Verification Commands

Check service:

```bash
curl http://localhost:3101/health
```

Check process:

```bash
pm2 status
```

Check listening port:

```bash
ss -tulpn | grep 3101
```

---

## Files To Upload To GitHub

```txt
server.js
analyzer.js
decodePid.js
dtcKnowledge.js
srsKnowledge.js
brandKnowledge.js
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
env
```

---

## Recovery Procedure

If the VPS is replaced:

```bash
git clone YOUR_REPOSITORY_URL
cd cortex
npm install
nano .env
pm2 start server.js --name cortex
pm2 save
pm2 startup
```

Open firewall:

```bash
sudo ufw allow 3101
```

Verify:

```bash
curl http://localhost:3101/health
```

---

## Current TNABBAH Backend Position

```txt
Vehicle
   │
   ▼
MQTT Broker
   │
   ▼
Cortex Service
   │
   ├── Vehicle Analysis
   ├── Health Scoring
   ├── Alert Generation
   ├── Recommendations
   └── ChatPot Snapshot
   │
   ▼
Mobile Application
```

---

## Notes

- Cortex is the core analysis engine of TNABBAH.
- It is responsible for transforming raw vehicle data into meaningful insights.
- It provides the health scoring and alert systems used by the mobile application.
- It integrates directly with MQTT and ChatPot.
- The service is currently deployed on the Contabo VPS.