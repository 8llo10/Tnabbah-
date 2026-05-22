import Mode09Engine from "./Mode09Engine";
import * as Crypto from "expo-crypto";

export default class CarIdentityEngine {
  constructor(elm) {
    this.mode09 = new Mode09Engine(elm);
  }

  async getCarID() {
    const info = await this.mode09.buildVehicleInfoPayload();

    const base =
      info.vin ||
      info.ecu_name ||
      info.calibration_id ||
      info.cvn ||
      "fallback";

    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      base
    );

    return hash.slice(0, 16);
  }
}