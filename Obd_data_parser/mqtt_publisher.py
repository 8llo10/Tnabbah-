import json
import paho.mqtt.client as mqtt


class MQTTPublisher:
    def __init__(self, host="192.168.68.101", port=1883):
        self.client = mqtt.Client()
        self.client.connect(host, port, 60)

    def publish(self, topic, data, retain=False):
        payload = json.dumps(data, ensure_ascii=False)
        self.client.publish(topic, payload, retain=retain)