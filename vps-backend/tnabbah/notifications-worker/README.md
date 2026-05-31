# Notifications Worker - TNABBAH VPS Backend

The Notifications Worker service is responsible for automatically monitoring maintenance reminders and sending notifications to TNABBAH users.

It runs continuously on the VPS and checks upcoming maintenance schedules stored in Supabase.

When a maintenance event becomes due or approaches its scheduled date, the service automatically generates notifications and sends push notifications through Expo Push Notifications.

---

## Service Name

Notifications Worker

---

## Main Purpose

The Notifications Worker automates maintenance reminder tracking.

Its responsibilities include:

- Monitoring maintenance reminders
- Detecting upcoming maintenance dates
- Detecting overdue maintenance
- Creating notification records in Supabase
- Sending Expo push notifications
- Preventing excessive duplicate notifications
- Updating existing unread notifications

---

## Technology Used

- Node.js
- Supabase
- Expo Push Notifications
- node-cron
- HTTP Server
- WebSocket
- Contabo VPS

---

## System Role

The Notifications Worker acts as a background automation service.

Instead of requiring the mobile application to constantly check reminder dates, the worker performs the monitoring process automatically on the VPS.

This reduces:

- Mobile battery usage
- Mobile network requests
- Client-side processing

---

## Data Sources

The service reads data from:

```txt
maintenance_reminders
```

and

```txt
maintenance_types
```

and

```txt
profiles
```

inside Supabase.

---

## Notification Types

The worker currently supports:

### Upcoming Maintenance

Example:

```txt
اقترب موعد صيانة تغيير الزيت.
باقي 3 أيام.
```

---

### Due Today

Example:

```txt
صيانة تغيير الزيت مستحقة اليوم.
```

---

### Overdue Maintenance

Example:

```txt
صيانة تغيير الزيت متأخرة منذ 5 أيام.
```

---

## Reminder Logic

The worker calculates:

```txt
next_date
```

for every active reminder.

The service then determines:

```txt
Overdue
Due Today
Upcoming
Future
```

Only reminders within:

```txt
7 days
```

are processed.

---

## Duplicate Notification Protection

The worker prevents excessive notification spam.

Rules:

- Unread notifications are not repeatedly recreated.
- Existing notifications are updated when appropriate.
- Notifications are not resent continuously.
- Reminder cooldown period is applied.

Current cooldown:

```txt
1 day
```

---

## Push Notification System

Push notifications are sent through:

```txt
Expo Push Notifications
```

Endpoint:

```txt
https://exp.host/--/api/v2/push/send
```

Each notification includes:

- Title
- Body
- Reminder ID
- Notification Type

---

## Supabase Integration

The worker uses:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

The service reads:

```txt
maintenance_reminders
maintenance_types
profiles
```

The service writes:

```txt
notifications
```

---

## Cron Schedule

The worker runs automatically using:

```js
cron.schedule("* * * * *", checkMaintenance);
```

Current schedule:

```txt
Every 1 minute
```

Purpose:

- Near real-time reminder monitoring
- Fast notification generation
- Immediate maintenance tracking

---

## HTTP API

### Manual Check

```http
POST /check-now
```

Purpose:

Force immediate reminder processing.

Example:

```bash
curl -X POST http://localhost:3102/check-now
```

Response:

```json
{
  "ok": true
}
```

---

## Default Port

```txt
3102
```

The worker exposes a lightweight HTTP endpoint on:

```txt
http://localhost:3102
```

---

## Why Port 3102?

TNABBAH backend services use dedicated ports:

```txt
1883 = Mosquitto Broker
3101 = Cortex Service
3102 = Notifications Worker
3300 = MQTT Cleaner
4000 = Proxy Service
4010 = ChatPot Service
8001 = Diagnostics Service
```

---

## Environment Variables

Create:

```txt
.env
```

Example:

```env
PORT=3102

SUPABASE_URL=YOUR_SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
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
node server.js
```

Expected output:

```txt
Notifications worker running...
Notifications worker HTTP running on 3102
```

---

## PM2 Deployment

Start service:

```bash
pm2 start server.js --name notifications-worker
```

Check status:

```bash
pm2 status
```

View logs:

```bash
pm2 logs notifications-worker
```

Restart:

```bash
pm2 restart notifications-worker
```

Save configuration:

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

Check process:

```bash
pm2 status
```

Check port:

```bash
ss -tulpn | grep 3102
```

Force reminder check:

```bash
curl -X POST http://localhost:3102/check-now
```

View logs:

```bash
pm2 logs notifications-worker
```

---

## Files To Upload To GitHub

```txt
server.js
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
cd notifications-worker
npm install
nano .env
pm2 start server.js --name notifications-worker
pm2 save
pm2 startup
```

Verify:

```bash
curl -X POST http://localhost:3102/check-now
```

---

## TNABBAH Backend Position

```txt
Supabase
     │
     ▼
Notifications Worker
     │
     ▼
Expo Push API
     │
     ▼
Mobile Device
```

---

## Notes

- The service runs continuously on the VPS.
- Maintenance reminders are checked every minute.
- Push notifications are delivered through Expo.
- Notification history is stored in Supabase.
- Duplicate notifications are automatically controlled.
- The worker is currently deployed on the Contabo VPS.