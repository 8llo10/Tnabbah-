# car-chatbot-backend
this is backend for chatbot about tnabbah project
# ChatPot Service - TNABBAH VPS Backend

ChatPot is the AI-powered vehicle assistant backend for the TNABBAH platform.

It provides conversational vehicle support, interprets diagnostic reports, explains vehicle health, uses live vehicle telemetry, and answers user questions in a simple and user-friendly manner.

The service is deployed on the TNABBAH Contabo VPS and communicates with the TNABBAH mobile application.

---

## Service Name

ChatPot Service

---

## Main Purpose

ChatPot acts as the intelligent automotive assistant of the TNABBAH ecosystem.

It allows users to interact with their vehicle using natural language instead of reading technical diagnostic reports.

The service combines:

- AI conversation
- Vehicle diagnostics
- Live vehicle telemetry
- Supabase reports
- Driver-friendly explanations

into a single conversational experience.

---

## Technology Used

- Node.js
- Express.js
- OpenAI API
- Supabase
- dotenv
- cors
- PM2
- Ubuntu 24.04
- Contabo VPS

---

## VPS Usage

This service runs continuously on the TNABBAH VPS infrastructure.

It is accessed by the TNABBAH mobile application and is currently used during testing and development on Android devices.

---

## Default Port

```txt
4010
```

The service listens on:

```txt
http://0.0.0.0:4010
```

---

## Why Port 4010?

TNABBAH separates backend services into dedicated ports.

```txt
1883 = Mosquitto MQTT Broker
9001 = MQTT WebSocket
3101 = Cortex Service
3300 = MQTT Cleaner
4000 = Proxy Service
4010 = ChatPot Service
8001 = Diagnostics Service
```

This architecture improves:

- Scalability
- Service isolation
- Monitoring
- Maintenance
- Recovery

---

## Main Features

ChatPot can:

- Answer vehicle-related questions
- Explain vehicle issues
- Evaluate vehicle condition
- Read the latest diagnostic report
- Interpret live vehicle data
- Explain maintenance recommendations
- Respond in Arabic or English
- Generate human-friendly explanations
- Assist beginner drivers

---

## AI Provider

The service uses:

```txt
OpenAI GPT-4o Mini
```

Current model:

```txt
gpt-4o-mini
```

---

## Health Check Endpoint

```http
GET /health
```

Example response:

```json
{
  "ok": true,
  "message": "Server is running 🚗"
}
```

---

## Root Endpoint

```http
GET /
```

Returns:

```txt
🚗 Tanaabbuh AI Backend Running
```

---

## Live Snapshot System

The service contains an in-memory live vehicle snapshot cache.

Endpoint:

```http
POST /snapshot
```

Payload:

```json
{
  "userId": "user123",
  "carId": "car456",
  "snapshot": {}
}
```

The snapshot cache stores:

- Vehicle speed
- Engine temperature
- Battery voltage
- RPM
- Vehicle health

This allows ChatPot to answer questions using real-time vehicle data.

---

## Snapshot Cache Structure

```txt
latestSnapshots
 └── userId
      └── carId
            ├── snapshot
            └── updatedAt
```

---

## Chat Endpoint

```http
POST /chat
```

Payload:

```json
{
  "userId": "user123",
  "carId": "car456",
  "message": "كيف حالة سيارتي؟"
}
```

Returns:

```json
{
  "reply": "..."
}
```

---

## Greeting Detection

The service automatically detects greetings.

Examples:

```txt
مرحبا
السلام عليكم
اهلا
هلا
hello
hi
```

Response:

```txt
أهلاً، أنا مساعدك الذكي تنبه 🚗 كيف يمكنني مساعدتك اليوم بخصوص سيارتك؟
```

---

## Vehicle Question Detection

ChatPot automatically detects vehicle-related questions.

Examples:

```txt
سيارتي
السيارة
فحص
تقرير
عطل
صيانة
المحرك
البطارية
الفرامل
الراديتر
حرارة
oil
engine
car
problem
```

When detected, the service retrieves the latest vehicle report from Supabase.

---

## Vehicle Health Evaluation

ChatPot can evaluate:

```txt
كيف حالة سيارتي؟
قيم السيارة
هل السيارة جيدة؟
هل السيارة سليمة؟
```

The assistant builds a summary using:

- Overall health score
- Issue count
- Drive advice
- Healthy sensors
- Current warnings

---

## Supabase Integration

The service retrieves the latest diagnostic report from:

```txt
reports
```

Query logic:

```txt
Latest Report
By User ID
By Car ID
Ordered By Creation Date
```

Used data includes:

- Diagnostic summary
- Health score
- Issues
- Recommendations
- Drive advice

---

## Vehicle Report Interpretation

The assistant explains:

- Problem descriptions
- Severity levels
- Symptoms
- Possible causes
- Recommended actions

without exposing raw technical report structures.

---

## Live Vehicle Context

ChatPot enriches AI prompts using live vehicle telemetry.

Current values include:

```txt
Vehicle Speed
Engine Temperature
Battery Voltage
RPM
Vehicle Health
```

This allows responses to reflect current vehicle conditions.

---

## Multi-Car Support

The service supports multiple vehicles.

Context selection is based on:

```txt
userId
carId
```

Each vehicle maintains its own:

- Diagnostic reports
- Live snapshot
- Health status

---

## AI Prompt Design

ChatPot uses a custom system prompt.

Assistant behavior:

- Automotive expert
- Human-friendly
- Beginner-friendly
- Professional
- Short and clear responses

---

## AI Restrictions

The assistant is instructed to avoid:

```txt
Raw JSON
Diagnostic payloads
Technical report structures
Fault code dumping
```

Instead it provides:

```txt
Simple explanations
Maintenance advice
Driver guidance
Vehicle understanding
```

---

## Language Support

The assistant automatically responds in the user's language.

Supported:

```txt
Arabic
English
```

---

## Environment Variables

Example:

```env
OPENAI_API_KEY=

PORT=4010

SUPABASE_URL=

SUPABASE_SERVICE_ROLE_KEY=
```

---

## Installation

Install dependencies:

```bash
npm install
```

---

## Run Locally

```bash
node index.js
```

---

## PM2 Deployment

Start service:

```bash
pm2 start index.js --name chatpot
```

Save process list:

```bash
pm2 save
```

Enable startup:

```bash
pm2 startup
```

Restart:

```bash
pm2 restart chatpot
```

Logs:

```bash
pm2 logs chatpot
```

Status:

```bash
pm2 list
```

---

## Recovery Procedure

If the VPS is replaced:

```bash
git clone YOUR_REPOSITORY_URL

cd chatpot

npm install

nano .env

pm2 start index.js --name chatpot

pm2 save
```

Verify:

```bash
curl http://localhost:4010/health
```

---

## TNABBAH Architecture Position

```txt
Mobile App
      │
      ▼
ChatPot Service
      │
 ┌────┴────┐
 ▼         ▼
Supabase   Live Snapshot Cache
      │
      ▼
OpenAI GPT-4o Mini
      │
      ▼
Driver-Friendly Response
```

---

## Files To Upload To GitHub

```txt
index.js
package.json
package-lock.json
README.md
.env.example
supabase.js
```

---

## Files Not To Upload

```txt
.env
node_modules
logs
```

---

## Notes

- ChatPot is the conversational AI assistant of TNABBAH.
- It combines diagnostic reports with live vehicle data.
- It supports multiple vehicles.
- It retrieves reports from Supabase.
- It uses OpenAI GPT-4o Mini for natural language responses.
- It is deployed on the Contabo VPS.
- It is designed to help both technical and non-technical drivers understand vehicle health.