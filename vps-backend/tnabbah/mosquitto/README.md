# Mosquitto MQTT Broker - TNABBAH VPS Backend

Mosquitto is the central MQTT message broker used by the TNABBAH platform.

It acts as the communication layer between vehicle devices, backend services, and the mobile application.

All live vehicle data passes through Mosquitto before being processed by the Cortex analysis engine and displayed inside the TNABBAH mobile application.

---

## Service Name

Mosquitto MQTT Broker

---

## Main Purpose

The Mosquitto broker is responsible for receiving, routing, and distributing real-time vehicle data.

It enables communication between:

- Vehicle OBD devices
- MQTT publishers
- Cortex Service
- ChatPot Service
- Diagnostics Service
- Mobile Application

Without Mosquitto, the backend services would not receive live vehicle information.

---

## Why MQTT?

MQTT was selected because it is lightweight, efficient, and designed for real-time communication.

Benefits include:

- Low bandwidth usage
- Fast message delivery
- Reliable communication
- Scalable architecture
- Suitable for IoT devices
- Suitable for vehicle telemetry

---

## Technology Used

- Mosquitto MQTT Broker
- Ubuntu 24.04
- Contabo VPS
- Systemd Service

---

## Current Folder Structure

```txt
mosquitto/
├── config/
│   └── mosquitto.conf
│
├── data/
│
├── logs/
│
├── service/
│   └── mosquitto-tnabbah.service
│
└── README.md
```

---

## Configuration File

Location:

```txt
/opt/tnabbah/mosquitto/config/mosquitto.conf
```

Current configuration:

```conf
listener 1883
allow_anonymous true

persistence true
persistence_location /opt/tnabbah/mosquitto/data/

log_dest file /opt/tnabbah/mosquitto/logs/mosquitto.log

listener 9001
protocol websockets
```

---

## MQTT Port

Primary MQTT port:

```txt
1883
```

Used by:

- Vehicle Devices
- Cortex Service
- Backend Services
- MQTT Publishers
- MQTT Subscribers

---

## WebSocket Port

WebSocket MQTT port:

```txt
9001
```

Used for:

- Web Applications
- Browser MQTT Clients
- WebSocket MQTT Connections

---

## Persistence

Persistence is enabled.

```conf
persistence true
```

Purpose:

- Store retained messages
- Improve reliability
- Recover broker state after restart

Data location:

```txt
/opt/tnabbah/mosquitto/data/
```

---

## Logging

Broker logs are written to:

```txt
/opt/tnabbah/mosquitto/logs/mosquitto.log
```

Purpose:

- Debugging
- Monitoring
- Troubleshooting MQTT communication

---

## Current Security Configuration

Current development configuration:

```conf
allow_anonymous true
```

This allows clients to connect without authentication.

This configuration is acceptable for development and testing environments.

For production deployments, authentication and ACL policies should be enabled.

---

## MQTT Topic Structure

The TNABBAH platform uses the following topic structure:

```txt
Tnabbah/{userId}/{carId}/...
```

Examples:

```txt
Tnabbah/user123/car456/status

Tnabbah/user123/car456/identity

Tnabbah/user123/car456/pids/010C

Tnabbah/user123/car456/pids/010D

Tnabbah/user123/car456/pids/0105

Tnabbah/user123/car456/pids/0142

Tnabbah/user123/car456/dtc/full

Tnabbah/user123/car456/srs/full
```

---

## Integration With Cortex

Mosquitto delivers live vehicle data to the Cortex service.

Flow:

```txt
Vehicle Device
      │
      ▼
Mosquitto Broker
      │
      ▼
Cortex Service
      │
      ▼
Vehicle Analysis
```

---

## Integration With ChatPot

ChatPot does not subscribe directly to vehicle devices.

Instead:

```txt
Vehicle
      │
      ▼
Mosquitto
      │
      ▼
Cortex
      │
      ▼
ChatPot Snapshot
```

This allows ChatPot to use analyzed vehicle data instead of raw MQTT messages.

---

## Systemd Service

Service file location:

```txt
service/mosquitto-tnabbah.service
```

Configuration:

```ini
[Unit]
Description=Mosquitto MQTT Broker (tnabbah)
After=network.target

[Service]
ExecStart=/usr/sbin/mosquitto -c /opt/tnabbah/mosquitto/config/mosquitto.conf
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Why Restart=always?

```ini
Restart=always
```

Ensures the MQTT broker automatically restarts if:

- The process crashes
- The service stops unexpectedly
- The VPS experiences temporary issues

This improves system reliability.

---

## Service Management Commands

Start:

```bash
sudo systemctl start mosquitto-tnabbah
```

Stop:

```bash
sudo systemctl stop mosquitto-tnabbah
```

Restart:

```bash
sudo systemctl restart mosquitto-tnabbah
```

Status:

```bash
sudo systemctl status mosquitto-tnabbah
```

Enable startup:

```bash
sudo systemctl enable mosquitto-tnabbah
```

Disable startup:

```bash
sudo systemctl disable mosquitto-tnabbah
```

---

## Verification Commands

Check broker process:

```bash
sudo systemctl status mosquitto-tnabbah
```

Check listening ports:

```bash
ss -tulpn | grep mosquitto
```

Check logs:

```bash
tail -f /opt/tnabbah/mosquitto/logs/mosquitto.log
```

---

## Recovery Procedure

If the VPS is replaced:

1. Install Mosquitto.
2. Restore the configuration file.
3. Restore the systemd service file.
4. Create data and log directories.
5. Enable the service.
6. Verify ports 1883 and 9001.
7. Test MQTT communication.

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
      ├── Health Analysis
      ├── Alert Generation
      ├── Recommendations
      └── Vehicle Summary
      │
      ▼
ChatPot Service
      │
      ▼
Mobile Application
```

---

## Notes

- Mosquitto is the central communication hub of the TNABBAH backend.
- All real-time vehicle data passes through this broker.
- Persistence is enabled.
- Logging is enabled.
- WebSocket support is enabled.
- The broker is deployed on the Contabo VPS.
- The broker automatically restarts through systemd.