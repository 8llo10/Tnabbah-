import { hexToAscii, extractMode09Text } from "./Mode09Utils";
  import * as Crypto from "expo-crypto";


export default class Mode09Engine {
  constructor(elm) {
    this.elm = elm;
    this.cache = null;
  }

  async readSupportedInfoPIDs() {
    const resp = await this.elm.send_normal("0900");
    return {
      mode: "0900",
      name: "Supported Mode 09 PIDs",
      raw: resp,
      parsed: null,
    };
  }

  async readVIN() {
    const resp = await this.elm.send_slow("0902");
    return {
      mode: "0902",
      name: "VIN",
      raw: resp,
      parsed: extractMode09Text(resp, "4902"),
    };
  }

  async readCalibrationID() {
    const resp = await this.elm.send_slow("0904");
    return {
      mode: "0904",
      name: "Calibration ID",
      raw: resp,
      parsed: extractMode09Text(resp, "4904"),
    };
  }

  async readCVN() {
    const resp = await this.elm.send_normal("0906");
    return {
      mode: "0906",
      name: "CVN",
      raw: resp,
      parsed: resp || null,
    };
  }

  async readInUsePerfTracking() {
    const resp = await this.elm.send_normal("0908");
    return {
      mode: "0908",
      name: "In-use performance tracking",
      raw: resp,
      parsed: resp || null,
    };
  }

  async readECUName() {
    const resp = await this.elm.send_slow("090A");
    return {
      mode: "090A",
      name: "ECU Name",
      raw: resp,
      parsed: extractMode09Text(resp, "490A"),
    };
  }

  async readAll(useCache = true) {
    if (useCache && this.cache) return this.cache;

    const result = {
      supported_info_pids: await this.readSupportedInfoPIDs(),
      vin: await this.readVIN(),
      calibration_id: await this.readCalibrationID(),
      cvn: await this.readCVN(),
      in_use_perf_tracking: await this.readInUsePerfTracking(),
      ecu_name: await this.readECUName(),
    };

    this.cache = result;
    return result;
  }

  async buildVehicleInfoPayload() {
    const info = await this.readAll();

    const vin = info.vin.parsed;
    const ecu = info.ecu_name.parsed;
    const cal = info.calibration_id.parsed;

    return {
      vin,
      ecu_name: ecu,
      calibration_id: cal,
      cvn: info.cvn.parsed,
      supported_info_pids: info.supported_info_pids.raw,
      in_use_perf_tracking: info.in_use_perf_tracking.parsed,
      limited_access: !vin,
      access_message: vin ? null : "الوصول لكمبيوتر سيارتك محدود",
    };
  }

  async buildCarIdentity(fallback = "unknown-car") {
    const payload = await this.buildVehicleInfoPayload();

    const vin = payload.vin;
    const ecu = payload.ecu_name;

    if (vin) {
      return {
        car_id: vin,
        identity_source: "vin",
        limited_access: false,
        access_message: null,
        vehicle_info: payload,
      };
    }

    if (ecu) {
      return {
        car_id: ecu,
        identity_source: "ecu_name",
        limited_access: true,
        access_message: "الوصول لكمبيوتر سيارتك محدود",
        vehicle_info: payload,
      };
    }

    return {
      car_id: fallback,
      identity_source: "fallback",
      limited_access: true,
      access_message: "الوصول لكمبيوتر سيارتك محدود",
      vehicle_info: payload,
    };
  }



async buildStableCarID() {
  const info = await this.buildVehicleInfoPayload();

  const base =
    info.vin ||
    info.ecu_name ||
    info.calibration_id ||
    info.cvn ||
    "fallback";

  // hash ثابت
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base
  );

  return hash.slice(0, 16); // car_id ثابت
}
}