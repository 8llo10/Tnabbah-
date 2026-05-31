# TNABBAH (تنبَّه)

TNABBAH is an AI-powered smart vehicle diagnostics and monitoring platform designed to help drivers understand their vehicle’s condition in a simple and accessible way.

The system connects to a vehicle through an OBD-II adapter, collects live diagnostic data, analyzes fault codes and sensor readings, and generates user-friendly reports supported by artificial intelligence.

TNABBAH combines real-time monitoring, vehicle health analysis, maintenance reminders, and an intelligent automotive assistant to help drivers detect problems early, improve vehicle reliability, and make informed maintenance decisions.

---

## Key Features

- Real-time OBD-II vehicle monitoring
- Live sensor and diagnostic data collection
- Fault code (DTC) detection and interpretation
- AI-powered vehicle health analysis
- Arabic and English diagnostic reports
- Beginner-friendly explanations
- Maintenance reminders and tracking
- Intelligent automotive assistant (ChatPot)
- Multi-vehicle support
- Cloud-based architecture using MQTT and Supabase
- Mobile application built with React Native

---

## System Architecture

```txt
Vehicle
   │
   ▼
OBD-II Adapter
   │
   ▼
MQTT Infrastructure
   │
   ▼
Diagnostics Engine
   │
   ▼
AI Analysis Layer
   │
   ▼
Supabase Cloud Services
   │
   ▼
TNABBAH Mobile Application
```

---

## Technologies Used

- React Native (Expo)
- Node.js
- Python (FastAPI)
- MQTT (Mosquitto)
- Supabase
- DeepSeek AI
- OpenAI SDK
- JWT Authentication
- Contabo VPS

---

## Project Goal

The goal of TNABBAH is to bridge the gap between complex vehicle diagnostics and everyday drivers by transforming technical automotive data into clear, actionable insights that improve safety, reduce maintenance uncertainty, and promote proactive vehicle care.