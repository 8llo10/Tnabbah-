# Contabo VPS Setup Guide for Tnabbah Diagnostics

## Overview
Your Tnabbah_Diagnostics backend is now configured to run on your Contabo VPS at `207.180.244.27:8001`. The mobile app has been updated to connect directly to this server.

## VPS Configuration Details
- **VPS IP**: 207.180.244.27
- **Backend Port**: 8001
- **Protocol**: HTTP
- **API Endpoint**: `http://207.180.244.27:8001`

## Steps to Deploy on Contabo VPS

### 1. Connect to Your VPS
```bash
ssh root@207.180.244.27
# Or use your configured username if not root
```

### 2. Install Python & Dependencies
```bash
# Update system packages
apt-get update && apt-get upgrade -y

# Install Python 3.10+
apt-get install python3 python3-pip python3-venv -y

# Install MQTT broker (if not already installed)
apt-get install mosquitto mosquitto-clients -y
```

### 3. Upload Tnabbah_Diagnostics Folder
```bash
# From your local machine
scp -r /path/to/Tnabbah_Diagnostics root@207.180.244.27:/opt/tnabbah/

# Or use SFTP/git clone if you have a repository
```

### 4. Set Up Python Virtual Environment
```bash
cd /opt/tnabbah/Tnabbah_Diagnostics
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 5. Configure Environment
```bash
# Copy and edit the .env configuration
cp config/.env.example config/.env
nano config/.env

# Set the MQTT broker URL to your VPS:
# MQTT_URL=mqtt://127.0.0.1:1883
# Or if using a remote MQTT: mqtt://your-mqtt-server:1883
```

### 6. Configure Firewall (UFW)
```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP (FastAPI)
ufw allow 8001/tcp

# Allow MQTT
ufw allow 1883/tcp

# Enable firewall
ufw enable
```

### 7. Start MQTT Broker
```bash
# Ensure mosquitto is running
systemctl start mosquitto
systemctl enable mosquitto  # Auto-start on reboot

# Check status
systemctl status mosquitto
```

### 8. Run FastAPI Backend
```bash
cd /opt/tnabbah/Tnabbah_Diagnostics
source .venv/bin/activate

# Run with Uvicorn
uvicorn src.diagnostics.main:app --host 0.0.0.0 --port 8001
```

### 9. Set Up as systemd Service (Recommended for Production)
Create a service file `/etc/systemd/system/tnabbah-diagnostics.service`:

```ini
[Unit]
Description=Tnabbah Diagnostics Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/tnabbah/Tnabbah_Diagnostics
Environment="PATH=/opt/tnabbah/Tnabbah_Diagnostics/.venv/bin"
ExecStart=/opt/tnabbah/Tnabbah_Diagnostics/.venv/bin/uvicorn src.diagnostics.main:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable it:
```bash
systemctl daemon-reload
systemctl enable tnabbah-diagnostics
systemctl start tnabbah-diagnostics
systemctl status tnabbah-diagnostics
```

### 10. Configure Nginx Reverse Proxy (Optional but Recommended)
For better security and performance:

```bash
apt-get install nginx -y

# Create config at /etc/nginx/sites-available/tnabbah
sudo nano /etc/nginx/sites-available/tnabbah
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name 207.180.244.27;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:
```bash
ln -s /etc/nginx/sites-available/tnabbah /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Testing the Connection

### From Mobile App
1. The app will automatically use the VPS URL from `.env.local`
2. Tap the "تحليل بالذكاء الاصطناعي" button on the home page
3. It will directly call `http://207.180.244.27:8001/api/scan-from-mqtt`

### From Your Machine
```bash
# Test if the backend is accessible
curl http://207.180.244.27:8001/docs

# Check MQTT is running
mosquitto_sub -h 207.180.244.27 -t "Tnabbah/#" -v
```

## Mobile App Configuration
The app is configured to connect to your VPS with these settings:
- **Environment Variable**: `EXPO_PUBLIC_DIAGNOSTICS_API=http://207.180.244.27:8001`
- **Location**: `.env.local` file in `Tnabbah_App/`

## Troubleshooting

### Backend not responding
```bash
# Check if FastAPI is running
netstat -tlnp | grep 8001

# Check logs
journalctl -u tnabbah-diagnostics -f
```

### MQTT Connection Issues
```bash
# Check MQTT broker
netstat -tlnp | grep 1883

# Test MQTT connection
mosquitto_pub -h 127.0.0.1 -t "test" -m "hello"
```

### Firewall Issues
```bash
# Check firewall rules
ufw status
ufw show added
```

## HTTPS Setup (For Production)
For secure connections, set up SSL/TLS with Let's Encrypt:

```bash
apt-get install certbot python3-certbot-nginx -y
certbot certonly --standalone -d your-domain.com
```

Then update the Nginx config to use HTTPS and update the app's `.env.local`:
```
EXPO_PUBLIC_DIAGNOSTICS_API=https://your-domain.com:8001
```

## Next Steps
1. Deploy the backend to your VPS following the steps above
2. Ensure MQTT is running and accessible
3. Test the connection from the mobile app
4. Set up monitoring/logging for production use
5. Consider SSL/HTTPS for production environments
