import { obdCoreService } from "./obdCoreService";

function simpleHash(text: string) {
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(16);
}

function normalizeText(value: unknown) {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

export const carIdentityService = {
  async getCarIdentity() {
    const mode09 = await obdCoreService.readMode09();

    const vin = normalizeText(mode09.vin);

    const calibrationId = normalizeText(
      mode09.raw?.["0904"] ||
        mode09.raw?.["09 04"] ||
        ""
    );

    const ecuName = normalizeText(
      mode09.raw?.["090A"] ||
        mode09.raw?.["09 0A"] ||
        ""
    );

    const fallbackBase = JSON.stringify({
      calibrationId,
      ecuName,
      raw0100: mode09.raw?.["0900"] || "",
    });

    const identityBase =
      vin ||
      calibrationId ||
      ecuName ||
      fallbackBase ||
      "unknown_vehicle";

    const carId = `car_${simpleHash(identityBase)}`;

    return {
      carId,
      vin: vin || null,

      source: vin
        ? "vin_mode09"
        : calibrationId
        ? "calibration_mode09"
        : ecuName
        ? "ecu_mode09"
        : "mode09_fallback",

      fingerprints: {
        vin: vin || null,
        calibrationId: calibrationId || null,
        ecuName: ecuName || null,
      },

      mode09,
      createdAt: Date.now(),
    };
  },
};