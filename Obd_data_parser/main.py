import time
import re
from elm327 import ELM327
from scanner import OBDScanner
from mqtt_publisher import MQTTPublisher

PORT = "COM6"
BAUD = 38400
FALLBACK_CAR_ID = "unknown-car"


def normalize_topic_part(text: str, fallback: str) -> str:
    if not text:
        return fallback

    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9_-]", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or fallback


def normalize_car_id(text: str) -> str:
    if not text:
        return FALLBACK_CAR_ID

    text = text.strip().upper()
    text = re.sub(r"[^A-Z0-9_-]", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or FALLBACK_CAR_ID


def main():
    print("1) start")

    elm = ELM327(PORT, BAUD)
    elm.init()

    scanner = OBDScanner(elm)
    mqtt = MQTTPublisher("localhost", 1883)

    print("2) detect vehicle identity")
    identity = scanner.get_vehicle_identity(fallback_car_id=FALLBACK_CAR_ID)

    raw_car_id = identity.get("car_id")
    car_id = normalize_car_id(raw_car_id)

    vehicle_info = identity.get("vehicle_info", {})
    limited_access = identity.get("limited_access", True)
    access_message = identity.get("access_message")
    identity_source = identity.get("identity_source")

    print(f"car_id = {car_id}")
    print(f"identity_source = {identity_source}")

    print("3) publish status")
    mqtt.publish(
        f"obd/{car_id}/status",
        {
            "car_id": car_id,
            "state": "connected",
            "port": PORT,
            "baud": BAUD,
            "identity_source": identity_source,
            "limited_access": limited_access,
            "access_message": access_message,
            "ts": int(time.time()),
        },
        retain=True,
    )

    print("4) publish vehicle info once")
    mqtt.publish(
        f"obd/{car_id}/info",
        {
            "car_id": car_id,
            "identity_source": identity_source,
            "limited_access": limited_access,
            "access_message": access_message,
            "vin": vehicle_info.get("vin"),
            "ecu_name": vehicle_info.get("ecu_name"),
            "calibration_id": vehicle_info.get("calibration_id"),
            "cvn": vehicle_info.get("cvn"),
            "supported_info_pids": vehicle_info.get("supported_info_pids"),
            "in_use_perf_tracking": vehicle_info.get("in_use_perf_tracking"),
            "ts": int(time.time()),
        },
        retain=True,
    )

    print("5) publish dtcs")
    # توبيك مجمع لكل الأنواع
    all_dtcs = scanner.dtc.read_all()
    mqtt.publish(
        f"obd/{car_id}/dtcs",
        {
            "car_id": car_id,
            "stored": all_dtcs.get("stored", {}).get("dtcs", []),
            "pending": all_dtcs.get("pending", {}).get("dtcs", []),
            "permanent": all_dtcs.get("permanent", {}).get("dtcs", []),
            "limited_access": limited_access,
            "access_message": access_message,
            "ts": int(time.time()),
        },
        retain=True,
    )

    # توبيك لكل نوع
    for group in scanner.dtc.stream_grouped_dtcs():
        group_type = group["type"]

        mqtt.publish(
            f"obd/{car_id}/dtcs/{group_type}",
            {
                "car_id": car_id,
                "mode": group["mode"],
                "type": group_type,
                "codes": group["dtcs"],
                "raw": group["raw"],
                "ts": int(time.time()),
            },
            retain=True,
        )

    # توبيك لكل كود لحاله
    for item in scanner.stream_all_dtcs():
        code = item["code"]
        dtc_type = item["type"]

        mqtt.publish(
            f"obd/{car_id}/dtcs/{dtc_type}/{code}",
            {
                "car_id": car_id,
                "mode": item["mode"],
                "type": dtc_type,
                "code": code,
                "raw": item["raw"],
                "ts": int(time.time()),
            },
            retain=True,
        )

    print("6) start live stream")
    supported = scanner.discover_supported_pids()

    mqtt.publish(
        f"obd/{car_id}/live/supported_pids",
        {
            "car_id": car_id,
            "supported_pids": [f"0x{pid:02X}" for pid in supported],
            "count": len(supported),
            "ts": int(time.time()),
        },
        retain=True,
    )
    
    print("7) init SRS timer")
    last_srs_update = 0

    while True:
        now = time.time()

        if now - last_srs_update >= 10:
            print("scan SRS")
            srs_data = scanner.scan_srs_once()

            mqtt.publish(
                f"obd/{car_id}/srs",
                {
                    "car_id": car_id,
                    "module": "srs_airbag",
                    "data": srs_data,
                    "ts": int(now),
                },
                retain=True,
            )

            last_srs_update = now

        for item in scanner.stream_all_pids(include_none_values=True):
            name = item.get("name")
            pid_hex = item.get("pid_hex", "0x00")

            # إذا الاسم معروف → نستخدمه
            # إذا لا → نستخدم الكود
            if name and not name.lower().startswith("pid 0x"):
                topic_name = normalize_topic_part(name, pid_hex.lower())
            else:
                topic_name = pid_hex.replace("0x", "").lower()

            mqtt.publish(
                f"obd/{car_id}/live/{topic_name}",
                {
                    "car_id": car_id,
                    "pid": item.get("pid"),
                    "pid_hex": item.get("pid_hex"),
                    "name": item.get("name"),
                    "unit": item.get("unit"),
                    "raw": item.get("raw"),
                    "value": item.get("value"),
                    "limited_access": limited_access,
                    "access_message": access_message,
                    "ts": int(time.time()),
                },
                retain=False,
            )

            print(f"{item.get('pid_hex')} | {item.get('name')} | {item.get('value')} {item.get('unit') or ''}".strip())


if __name__ == "__main__":
    main()