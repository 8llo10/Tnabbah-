import { obdCoreService } from "./obdCoreService";

let cachedIdentity: any = null;

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

function cleanRawFingerprint(value: unknown) {
  const text = normalizeText(value);

  if (
    !text ||
    text.includes("NODATA") ||
    text.includes("NO DATA") ||
    text.includes("ERROR") ||
    text.includes("SEARCHING") ||
    text.includes("UNABLETOCONNECT") ||
    text.includes("UNABLE TO CONNECT") ||
    text.includes("STOPPED") ||
    text.includes("?")
  ) {
    return "";
  }
  return text.replace(/[^A-Z0-9]/g, "");
}

function buildStableFingerprint(parts: {
  vin: string;
  calibrationId: string;
  ecuName: string;
  mode09Supported: string;
}) {
  if (parts.vin) return `VIN:${parts.vin}`;
  if (parts.calibrationId) return `CAL:${parts.calibrationId}`;
  if (parts.ecuName) return `ECU:${parts.ecuName}`;
  if (parts.mode09Supported) return `MODE09:${parts.mode09Supported}`;

  return "LOCAL_UNKNOWN_VEHICLE";
}

export const carIdentityService = {
  async getCarIdentity(options?: { forceRefresh?: boolean }) {

    if (options?.forceRefresh) {
      cachedIdentity = null;
    }

    if (cachedIdentity) {
      return cachedIdentity;
    }

    const mode09 = await obdCoreService.readMode09();

    const vin = normalizeText(mode09.vin);

    const calibrationId = cleanRawFingerprint(
      mode09.raw?.["0904"] || mode09.raw?.["09 04"] || ""
    );

    const ecuName = cleanRawFingerprint(
      mode09.raw?.["090A"] || mode09.raw?.["09 0A"] || ""
    );

    const mode09Supported = cleanRawFingerprint(
      mode09.raw?.["0900"] || mode09.raw?.["09 00"] || ""
    );

    const identityBase = buildStableFingerprint({
      vin,
      calibrationId,
      ecuName,
      mode09Supported,
    });

    const carId = `car_${simpleHash(identityBase)}`;

    cachedIdentity = {
      carId,
      vin: vin || null,

      source: vin
        ? "vin_mode09"
        : calibrationId
          ? "calibration_mode09"
          : ecuName
            ? "ecu_mode09"
            : mode09Supported
              ? "mode09_supported"
              : "mode09_fallback",

      fingerprints: {
        identityBase,
        vin: vin || null,
        calibrationId: calibrationId || null,
        ecuName: ecuName || null,
        mode09Supported: mode09Supported || null,
      },

      mode09,
      createdAt: Date.now(),
    };

    return cachedIdentity;
  },

  resetCache() {
    cachedIdentity = null;
  },

  getCachedIdentity() {
    return cachedIdentity;
  },
};