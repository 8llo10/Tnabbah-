# TNABBAH VPS Infrastructure

This repository contains the backend infrastructure deployed on the TNABBAH VPS server.

The VPS is responsible for running all backend services required by the TNABBAH platform, including vehicle diagnostics, AI analysis, MQTT communication, notifications, and cloud APIs used by the mobile application.

---

## Why We Used a VPS

A VPS (Virtual Private Server) was selected because the TNABBAH platform requires services that must run continuously 24/7.

Unlike local development environments, a VPS provides:

- Permanent availability
- Public internet access
- Stable API endpoints
- Continuous MQTT communication
- Background processing
- Centralized service management

This allows the mobile application to communicate with backend services from anywhere without requiring a developer's computer to remain online.

---

## Why Contabo VPS

Contabo was selected because it provides:

- Affordable pricing
- Full root access
- Linux server environment
- Sufficient resources for multiple backend services
- Reliable uptime

These features made it suitable for hosting all TNABBAH backend components during development and testing.

---

## Why This Repository Exists

This repository serves as a backup, documentation, and deployment source for the VPS infrastructure.

If the VPS subscription expires, the server is replaced, or the system needs to be migrated, all backend services can be restored directly from this repository.

The repository also documents:

- Service configurations
- Environment setup
- Deployment procedures
- Startup commands
- Recovery procedures

---

## Services Hosted On The VPS

The TNABBAH VPS currently hosts:

- Mosquitto MQTT Broker
- Diagnostics Service
- Cortex Service
- ChatPot Service
- Notifications Worker
- Proxy Service
- MQTT Cleaner

Each service has its own documentation, configuration, and startup instructions.

---

## Deployment Goal

The goal of this VPS infrastructure is to provide a centralized backend environment that supports:

- Real-time vehicle monitoring
- AI-powered diagnostics
- Cloud synchronization
- Maintenance notifications
- Multi-vehicle management
- Mobile application communication

---

## Backup And Recovery

All source code, configurations, and deployment instructions are stored in this repository.

This allows the entire backend infrastructure to be recreated on a new VPS by:

1. Cloning the repository.
2. Installing dependencies.
3. Restoring environment variables.
4. Starting the services.

This ensures long-term maintainability and prevents loss of work if the original VPS becomes unavailable.