# MQTT Cleaner Service - TNABBAH VPS Backend

The MQTT Cleaner service is a small backend utility used by the TNABBAH platform to remove retained MQTT messages for a specific vehicle.

It runs on the VPS and connects directly to the local Mosquitto MQTT broker.

---

## Service Name

MQTT Cleaner Service

---

## Main Purpose

The MQTT Cleaner service is responsible for deleting stored MQTT retained topics related to a specific car.

When a car is removed from the TNABBAH application, its old MQTT retained messages may still exist inside the broker.

This service helps clean those retained messages so deleted cars do not continue appearing with old data.

---

## Why This Service Exists

MQTT retained messages stay stored inside the broker until they are cleared.

If a vehicle is deleted from the app but its retained MQTT messages remain, the system may still receive old data from that deleted car.

This service solves that by:

- Finding retained topics for a selected user and car
- Publishing empty retained messages to those topics
- Clearing stored MQTT retained data
- Keeping the vehicle list cleaner
- Preventing old vehicle data from reappearing

---

## Technology Used

- Node.js
- Express.js
- MQTT.js
- Mosquitto MQTT Broker
- Contabo VPS

---

## Package Information

```json
{
  "name": "mqtt-cleaner",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "express": "^5.2.1",
    "mqtt": "^5.15.1"
  }
}
```

---

## Default Port

```txt
3300
```

The service listens on:

```js
app.listen(3300, "0.0.0.0")
```

This allows the service to receive API requests from outside the VPS if the port is open.

---

## Why Port 3300?

Port `3300` is dedicated to the MQTT Cleaner service.

In the TNABBAH backend, each service has a separate port:

```txt
1883 = Mosquitto MQTT Broker
9001 = Mosquitto WebSocket MQTT
3101 = Cortex Service
3300 = MQTT Cleaner Service
4000 = Proxy Service
4010 = ChatPot Service
8001 = Diagnostics API
```

Using a separate port makes each service easier to debug, restart, and document.

---

## MQTT Broker Connection

The service connects to the local MQTT broker:

```js
const MQTT_URL = "mqtt://127.0.0.1:1883";
```

This means MQTT Cleaner expects Mosquitto to be running on the same VPS.

---

## API Security

The service uses a simple API token header:

```js
const API_TOKEN = "tnabbah-delete-secret-2026";
```

Requests must include:

```txt
x-api-token
```

Example:

```txt
x-api-token: tnabbah-delete-secret-2026
```

If the token is missing or incorrect, the service returns:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

Security note:

For public or production deployments, the token should be moved to an `.env` file instead of being hardcoded.

---

## API Endpoint

### Delete Vehicle Retained MQTT Topics

```http
DELETE /car/:userId/:carId
```

Example:

```http
DELETE /car/USER_ID/CAR_ID
```

Full example:

```bash
curl -X DELETE http://YOUR_VPS_IP:3300/car/USER_ID/CAR_ID \
  -H "x-api-token: tnabbah-delete-secret-2026"
```

---

## What This Endpoint Does

When this endpoint is called, the service:

1. Reads `userId` and `carId` from the URL
2. Builds the MQTT topic filter
3. Subscribes to retained topics under that car
4. Waits for retained messages to arrive
5. Collects all matching topic names
6. Publishes an empty retained message to each topic
7. Clears the retained data from Mosquitto
8. Returns a list of deleted topics

---

## MQTT Topic Filter

The service builds this filter:

```js
const filter = `Tnabbah/${userId}/${carId}/#`;
```

Example:

```txt
Tnabbah/user123/car456/#
```

This targets all MQTT topics under one specific user and car.

---

## How MQTT Retained Deletion Works

In MQTT, retained messages are deleted by publishing an empty payload with the retain flag enabled.

The service does this using:

```js
client.publish(topic, Buffer.alloc(0), { retain: true, qos: 1 })
```

This tells Mosquitto to clear the retained message for that topic.

---

## Response Examples

### Success

```json
{
  "success": true,
  "userId": "USER_ID",
  "carId": "CAR_ID",
  "deletedTopicsCount": 5,
  "deletedTopics": [
    "Tnabbah/USER_ID/CAR_ID/status",
    "Tnabbah/USER_ID/CAR_ID/identity",
    "Tnabbah/USER_ID/CAR_ID/pids/010C"
  ]
}
```

### Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### No Retained Topics Found

```json
{
  "success": false,
  "message": "No retained topics found for this carId",
  "userId": "USER_ID",
  "carId": "CAR_ID"
}
```

---

## Installation

Install dependencies:

```bash
npm install
```

---

## Run Manually

```bash
node server.js
```

Expected output:

```txt
MQTT Cleaner running on :3300
```

---

## Run With PM2

Start service:

```bash
pm2 start server.js --name mqtt-cleaner
```

Check status:

```bash
pm2 status
```

View logs:

```bash
pm2 logs mqtt-cleaner
```

Restart:

```bash
pm2 restart mqtt-cleaner
```

Stop:

```bash
pm2 stop mqtt-cleaner
```

Save PM2 process list:

```bash
pm2 save
```

Enable startup after reboot:

```bash
pm2 startup
```

Run the command printed by PM2, then:

```bash
pm2 save
```

---

## Firewall

If this service needs to be accessed from outside the VPS:

```bash
sudo ufw allow 3300
```

Check firewall:

```bash
sudo ufw status
```

If the service is only called internally from the VPS, the port does not need to be publicly exposed.

---

## Verification Commands

Check service:

```bash
curl http://localhost:3300
```

This service does not currently include a health endpoint, so the main verification is through PM2 logs and the delete endpoint.

Check port:

```bash
ss -tulpn | grep 3300
```

Check PM2:

```bash
pm2 status
```

---

## Test Delete Command From VPS

```bash
curl -X DELETE http://localhost:3300/car/USER_ID/CAR_ID \
  -H "x-api-token: tnabbah-delete-secret-2026"
```

---

## Files To Upload To GitHub

```txt
server.js
package.json
package-lock.json
README.md
```

---

## Files Not To Upload

```txt
node_modules
logs
.env
```

---

## Recovery Procedure

If the VPS is replaced:

```bash
git clone YOUR_REPOSITORY_URL
cd mqtt-cleaner
npm install
pm2 start server.js --name mqtt-cleaner
pm2 save
pm2 startup
```

If external access is needed:

```bash
sudo ufw allow 3300
```

Verify:

```bash
pm2 status
ss -tulpn | grep 3300
```

---

## TNABBAH Backend Position

```txt
Mobile App / Backend Request
        │
        ▼
MQTT Cleaner Service :3300
        │
        ▼
Mosquitto Broker :1883
        │
        ▼
Retained Topics Deleted
```

---

## Notes

- MQTT Cleaner is a maintenance utility service.
- It is used to remove retained MQTT data for deleted cars.
- It connects to the local Mosquitto broker.
- It uses retained empty messages to delete retained MQTT topics.
- It should be protected because it deletes MQTT data.
- The current token should be moved to `.env` in future versions.