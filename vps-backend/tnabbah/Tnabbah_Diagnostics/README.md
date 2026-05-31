# TNABBAH Diagnostics Service

The Diagnostics Service is the core intelligence engine of the TNABBAH platform.

It receives vehicle telemetry from MQTT, analyzes live OBD-II data, evaluates diagnostic trouble codes (DTCs), detects anomalies, calculates vehicle health, generates maintenance recommendations, and produces AI-enhanced Arabic diagnostic reports for drivers.

The service is built using FastAPI and is deployed on the TNABBAH Contabo VPS infrastructure.

---

# Service Information

| Item | Value |
|--------|--------|
| Service Name | TNABBAH Diagnostics Service |
| Version | 1.0.0 |
| Framework | FastAPI |
| Language | Python 3.11+ |
| Default Port | 8001 |
| MQTT Broker Port | 1883 |
| MQTT WebSocket Port | 9001 |
| AI Provider | DeepSeek AI |
| Storage | Supabase |
| Authentication | Supabase JWT |
| Deployment | Contabo VPS |

---

# Main Responsibilities

The Diagnostics Service is responsible for:

- Processing OBD-II diagnostic data
- Decoding raw PID responses
- Decoding Diagnostic Trouble Codes (DTCs)
- Building vehicle snapshots
- Detecting abnormal sensor behavior
- Running rule-based diagnostics
- Performing AI-enhanced analysis
- Generating Arabic reports
- Providing beginner-friendly explanations
- Calculating vehicle health scores
- Generating maintenance recommendations
- Storing reports in Supabase
- Serving API endpoints to the mobile application

---

# System Architecture

```txt
Vehicle
   │
   ▼
ELM327 / OBD-II
   │
   ▼
MQTT Publisher
   │
   ▼
Mosquitto Broker
   │
   ▼
MQTT Listener
   │
   ▼
Snapshot Cache
   │
   ▼
Rules Engine
   │
   ▼
PID Analyzer
   │
   ▼
DTC Analyzer
   │
   ▼
AI Interpretation Layer
   │
   ▼
Arabic Report Generator
   │
   ▼
Supabase Storage
   │
   ▼
Mobile Application
```

---

# Technology Stack

## Backend

- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic
- NumPy
- Pandas

## MQTT

- Paho MQTT

## AI

- DeepSeek AI
- OpenAI Compatible SDK

## Authentication

- Supabase Auth
- JWT Verification
- PyJWT

## Storage

- Supabase PostgreSQL

---

# FastAPI Endpoints

## Health

```http
GET /health
GET /api/health
```

Returns service health status.

---

## Vehicle Scanning

```http
POST /api/scan
POST /api/scan-obd-json
POST /api/scan-from-mqtt
```

Used to generate complete diagnostic reports.

---

## Reports

```http
GET /api/reports

GET /api/reports/{report_id}

POST /api/save-report

POST /api/reject-report

POST /api/delete-report

GET /api/reports/saved/{user_id}

GET /api/reports/pending/{user_id}
```

---

## Knowledge Base APIs

```http
GET /api/dtc/{code}

GET /api/pid/{pid}
```

Used for educational and diagnostic lookups.

---

## MQTT Snapshot APIs

```http
GET /api/mqtt/snapshot
```

Returns the latest cached vehicle snapshot.

---

## Translation

```http
POST /api/translate
```

Translates generated reports.

---

## Service Info

```http
GET /api/info
```

Returns service metadata.

---

## API Documentation

Swagger UI:

```txt
/api/docs
```

ReDoc:

```txt
/api/redoc
```

---

# MQTT Integration

The Diagnostics Service subscribes to live vehicle telemetry.

Topics include:

```txt
Tnabbah/{userId}/{carId}/pids/*
Tnabbah/{userId}/{carId}/dtc/full
Tnabbah/{userId}/{carId}/dtc/stored
Tnabbah/{userId}/{carId}/dtc/pending
Tnabbah/{userId}/{carId}/dtc/permanent
```

---

# Snapshot Cache Layer

Instead of analyzing MQTT messages directly, the service builds a frozen vehicle snapshot.

Benefits:

- Consistent analysis
- Faster report generation
- Multi-car support
- Reduced MQTT dependency

---

# OBD-II Decoder Engine

The service contains a dedicated decoder for SAE J1979 PID responses.

Examples:

```txt
010C → Engine RPM
010D → Vehicle Speed
0105 → Coolant Temperature
0142 → Battery Voltage
```

Raw ECU responses are automatically converted into engineering values.

---

# Rules Engine

The Rules Engine evaluates:

- DTC severity
- PID anomalies
- Vehicle health
- Maintenance urgency
- System risk level

Supported severity levels:

```txt
LOW
MEDIUM
HIGH
CRITICAL
```

---

# PID Analyzer

The PID Analyzer detects:

- Out-of-range values
- Sensor drift
- Oscillation
- Stuck sensors
- Intermittent failures

Supported failure modes:

```txt
STUCK_HIGH
STUCK_LOW
OSCILLATING
DRIFT
```

---

# DTC Knowledge Base

The service contains a large internal database of DTC fault codes.

Each DTC includes:

- Description
- Severity
- Symptoms
- Common causes
- Diagnostic steps
- Maintenance recommendations
- Driving safety advice

Examples:

```txt
P0100
P0101
P0171
P0172
P0300
P0301
```

---

# PID Knowledge Base

The service contains a structured PID database.

Each PID contains:

- Sensor name
- Arabic title
- Units
- Normal range
- Warning range
- Critical range
- Professional explanation
- Related systems
- Related DTCs

---

# Cause Knowledge Base

The service maintains a dedicated dataset for:

- Common causes
- Symptoms
- Mechanical terminology
- Arabic ↔ English translations

Examples:

```txt
Weak Fuel Pump
Bad Oxygen Sensor
Vacuum Leak
Damaged Wiring
Failed Ignition Coil
```

---

# Beginner Driver Mode

The Diagnostics Service contains a beginner-focused reporting mode.

Purpose:

Convert mechanical terminology into understandable language.

Examples:

```txt
MAF Sensor
↓
حساس الهواء

Oxygen Sensor
↓
حساس الأكسجين

ECU
↓
كمبيوتر السيارة
```

The beginner mode provides:

- Simple explanations
- Driving advice
- What to tell the mechanic
- Safety recommendations
- Automotive glossary

---

# Arabic Report Pipeline

The report generation system is modular.

Modules:

```txt
severity.py
grouping.py
pid_formatter.py
dtc_formatter.py
beginner.py
ai_enhancer.py
```

Responsibilities:

- Severity formatting
- DTC grouping
- PID normalization
- Arabic report generation
- Beginner report generation
- AI enrichment

---

# Health Score Engine

Vehicle health is calculated dynamically.

Typical scale:

```txt
100%  Excellent
95%   Healthy
70%   Warning
45%   High Risk
20%   Critical
```

Health is influenced by:

- DTC severity
- PID anomalies
- Safety systems
- Engine conditions

---

# AI Layer

AI is powered by DeepSeek.

Configuration:

```env
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

Capabilities:

- PID interpretation
- DTC interpretation
- Vehicle summaries
- Maintenance recommendations
- Driver explanations
- Report translation

---

# AI Fallback Mode

If AI is unavailable:

```env
TNABBAH_ENABLE_AI=false
```

The service continues operating using:

- Rules Engine
- Knowledge Bases
- OBD Analysis Engine

---

# Authentication

Authentication is handled through Supabase JWT tokens.

Headers:

```http
Authorization: Bearer <TOKEN>
```

Verification includes:

- Signature validation
- Expiration validation
- Audience validation
- User ownership validation

---

# Local Development Authentication

Development mode:

```env
TNABBAH_DISABLE_AUTH=true

TNABBAH_DEV_USER_ID=YOUR_TEST_USER_ID
```

Never enable in production.

---

# Environment Variables

```env
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8001

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

SUPABASE_JWT_SECRET=
SUPABASE_JWT_AUDIENCE=authenticated

DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat

TNABBAH_ENABLE_AI=true
TNABBAH_AI_FAST=false
TNABBAH_AI_TIMEOUT=15

TNABBAH_DATA_PATH=
```

---

# Python Dependencies

```txt
FastAPI
Uvicorn
Pydantic
NumPy
Pandas
OpenAI
Paho MQTT
PyJWT
python-dotenv
httpx
emoji
pytest
```

---

# Installation

```bash
python -m venv venv

source venv/bin/activate

pip install -r requirements.txt
```

---

# Run Locally

```bash
uvicorn src.diagnostics.main:app \
  --host 0.0.0.0 \
  --port 8001
```

---

# Verification

Health:

```bash
curl http://localhost:8001/health
```

Docs:

```txt
http://localhost:8001/api/docs
```

---

# TNABBAH Ecosystem Position

```txt
Mobile App
      │
      ▼
Proxy Service
      │
      ▼
Diagnostics Service
      │
 ┌────┼────┐
 ▼    ▼    ▼
MQTT  AI  Supabase
```

---

# Notes

- This service is the primary intelligence engine of TNABBAH.
- It performs all vehicle analysis and report generation.
- It supports multiple vehicles simultaneously.
- It integrates with MQTT, Supabase, and DeepSeek AI.
- It is deployed on the Contabo VPS infrastructure.
- It is designed for both technical users and beginner drivers.