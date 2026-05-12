import { supabase } from "../lib/supabase";
import { carIdentityService } from "./carIdentityService";
import { elmBluetoothService } from "./elmBluetoothService";
import { mqttService } from "./mqttService";
import { obdCoreService } from "./obdCoreService";

const APP_ROOT = "Tnabbah";

let isRunning = false;
let isLiveLoopRunning = false;
let isSlowLoopRunning = false;

let liveTimer: ReturnType<typeof setTimeout> | null = null;
let slowTimer: ReturnType<typeof setTimeout> | null = null;

let cachedUserId: string | null = null;
let cachedCarId: string | null = null;
let cachedIdentity: any = null;

const LIVE_INTERVAL_MS = 850;
const SLOW_SCAN_INTERVAL_MS = 5 * 60 * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function topic(userId: string, carId: string, path: string) {
  return `${APP_ROOT}/${userId}/${carId}/${path}`;
}

function safeJson(value: unknown) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

async function getUserId() {
  if (cachedUserId) return cachedUserId;

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.id) {
    throw new Error("ما قدرنا نجيب userId من Supabase.");
  }

  cachedUserId = data.user.id;
  return cachedUserId;
}

async function getIdentity() {
  if (cachedCarId && cachedIdentity) {
    return {
      userId: await getUserId(),
      carId: cachedCarId,
      identity: cachedIdentity,
    };
  }

  const userId = await getUserId();
  const identity = await carIdentityService.getCarIdentity();

  cachedCarId = identity.carId;
  cachedIdentity = identity;

  return {
    userId,
    carId: identity.carId,
    identity,
  };
}

async function publish(userId: string, carId: string, path: string, payload: unknown) {
  await mqttService.publishAsync(topic(userId, carId, path), {
    app: APP_ROOT,
    userId,
    carId,
    path,
    timestamp: Date.now(),
    data: safeJson(payload),
  });
}

async function publishStatus(userId: string, carId: string, status: string, extra: any = {}) {
  await publish(userId, carId, "status", {
    status,
    obdConnected: elmBluetoothService.isConnected(),
    ...extra,
  });
}

async function publishMode09(userId: string, carId: string) {
  const mode09 = await obdCoreService.readMode09();

  await publish(userId, carId, "mode09/full", mode09);

  if (mode09.vin) {
    await publish(userId, carId, "mode09/vin", {
      vin: mode09.vin,
    });
  }

  for (const [command, raw] of Object.entries(mode09.raw)) {
    await publish(userId, carId, `mode09/${command}`, {
      command,
      raw,
    });
  }

  return mode09;
}

async function publishDtcs(userId: string, carId: string) {
  const dtcs = await obdCoreService.readGenericDtcs();
  const anyDtcs: any = dtcs;

  await publish(userId, carId, "dtc/full", dtcs);
  await publish(userId, carId, "dtc/stored", anyDtcs.stored || {});
  await publish(userId, carId, "dtc/pending", anyDtcs.pending || {});
  await publish(userId, carId, "dtc/permanent", anyDtcs.permanent || {});

  return dtcs;
}

async function publishSupportedPids(userId: string, carId: string) {
  const supported = await obdCoreService.getSupportedPids();

  await publish(userId, carId, "pids/supported", supported);

  for (const pid of supported.supportedPids) {
    await publish(userId, carId, `pids/supported/${pid}`, {
      pid,
      supported: true,
    });
  }

  return supported;
}

async function publishAllSupportedPidValues(userId: string, carId: string) {
  const all = await obdCoreService.readAllSupportedPidValues();

  await publish(userId, carId, "pids/all", all);

  for (const [pid, value] of Object.entries(all.values)) {
    await publish(userId, carId, `pids/${pid}`, value);
  }

  return all;
}

async function publishLiveData(userId: string, carId: string) {
  const live = await obdCoreService.readLiveImportantPids();

  await publish(userId, carId, "live/full", live);

  for (const [pid, value] of Object.entries(live.values)) {
    await publish(userId, carId, `live/${pid}`, value);
  }

  return live;
}

async function trySrsForKnownBrands(userId: string, carId: string) {
  const attempts = [
    {
      brand: "toyota_lexus",
      headers: ["7A0", "7A1", "7A2"],
      commands: ["1902FF", "1902FFFFFF", "03"],
    },
    {
      brand: "mazda",
      headers: ["720", "730", "760"],
      commands: ["1902FF", "1902FFFFFF", "03"],
    },
  ];

  const results: any[] = [];

  await publish(userId, carId, "srs/status", {
    supported: "unknown",
    message:
      "SRS uses manufacturer-specific modules. We will try safe Toyota/Lexus/Mazda requests if the car responds.",
  });

  for (const attempt of attempts) {
    for (const header of attempt.headers) {
      try {
        const setHeader = await elmBluetoothService.send(`ATSH${header}`, 1000);

        for (const command of attempt.commands) {
          const raw = await elmBluetoothService.send(command, 2500);

          const item = {
            brand: attempt.brand,
            header,
            command,
            setHeader,
            raw,
            timestamp: Date.now(),
          };

          results.push(item);

          await publish(userId, carId, `srs/${attempt.brand}/${header}/${command}`, item);

          await sleep(150);
        }
      } catch (error: any) {
        const item = {
          brand: attempt.brand,
          header,
          error: error?.message || "SRS request failed",
          timestamp: Date.now(),
        };

        results.push(item);

        await publish(userId, carId, `srs/${attempt.brand}/${header}/error`, item);
      }
    }
  }

  try {
    await elmBluetoothService.send("ATSH7DF", 700);
    await elmBluetoothService.send("ATSP0", 1200);
  } catch {}

  await publish(userId, carId, "srs/full", {
    note: "If raw is EMPTY/NO DATA/ERROR, this car did not expose SRS through these generic enhanced attempts.",
    results,
  });

  return results;
}

export const vehicleScannerService = {
  async startAutoScan(options?: { forceFull?: boolean }) {
    if (!elmBluetoothService.isConnected()) {
      throw new Error("قطعة OBD غير متصلة.");
    }

    const { userId, carId, identity } = await getIdentity();

    isRunning = true;

    await publishStatus(userId, carId, "starting", {
      forceFull: !!options?.forceFull,
      identity,
    });

    if (options?.forceFull) {
      await this.runFullDiscovery();
    } else {
      await this.runInitialDiscovery();
    }

    this.startLiveStreaming();
    this.startSlowScanLoop();

    await publishStatus(userId, carId, "running");

    return {
      userId,
      carId,
      identity,
      running: true,
    };
  },

  async runInitialDiscovery() {
    const { userId, carId, identity } = await getIdentity();

    await publish(userId, carId, "identity", identity);

    const [mode09, dtcs, supported, srs] = await Promise.all([
      publishMode09(userId, carId),
      publishDtcs(userId, carId),
      publishSupportedPids(userId, carId),
      trySrsForKnownBrands(userId, carId),
    ]);

    await publish(userId, carId, "discovery/initial", {
      identity,
      mode09,
      dtcs,
      supported,
      srs,
    });

    return {
      identity,
      mode09,
      dtcs,
      supported,
      srs,
    };
  },

  async runFullDiscovery() {
    const { userId, carId, identity } = await getIdentity();

    await publishStatus(userId, carId, "full_discovery_started");
    await publish(userId, carId, "identity", identity);

    const mode09 = await publishMode09(userId, carId);
    const dtcs = await publishDtcs(userId, carId);
    const supported = await publishSupportedPids(userId, carId);
    const allPids = await publishAllSupportedPidValues(userId, carId);
    const srs = await trySrsForKnownBrands(userId, carId);

    const result = {
      identity,
      mode09,
      dtcs,
      supported,
      allPids,
      srs,
      timestamp: Date.now(),
    };

    await publish(userId, carId, "discovery/full", result);
    await publishStatus(userId, carId, "full_discovery_done");

    return result;
  },

  startLiveStreaming() {
    if (isLiveLoopRunning) return;

    isLiveLoopRunning = true;

    const loop = async () => {
      if (!isRunning || !isLiveLoopRunning) return;

      try {
        if (!elmBluetoothService.isConnected()) {
          const { userId, carId } = await getIdentity();
          await publishStatus(userId, carId, "obd_disconnected");
          this.stopAutoScan();
          return;
        }

        const { userId, carId } = await getIdentity();

        await publishLiveData(userId, carId);
      } catch (error: any) {
        console.log("Live stream error:", error?.message || error);

        try {
          const { userId, carId } = await getIdentity();
          await publishStatus(userId, carId, "live_stream_error", {
            error: error?.message || String(error),
          });
        } catch {}
      }

      liveTimer = setTimeout(loop, LIVE_INTERVAL_MS);
    };

    loop();
  },

  startSlowScanLoop() {
    if (isSlowLoopRunning) return;

    isSlowLoopRunning = true;

    const loop = async () => {
      if (!isRunning || !isSlowLoopRunning) return;

      try {
        if (!elmBluetoothService.isConnected()) {
          const { userId, carId } = await getIdentity();
          await publishStatus(userId, carId, "obd_disconnected");
          this.stopAutoScan();
          return;
        }

        const { userId, carId } = await getIdentity();

        await publishStatus(userId, carId, "slow_scan_started");

        await publishDtcs(userId, carId);
        await publishSupportedPids(userId, carId);
        await publishAllSupportedPidValues(userId, carId);
        await trySrsForKnownBrands(userId, carId);

        await publishStatus(userId, carId, "slow_scan_done");
      } catch (error: any) {
        console.log("Slow scan error:", error?.message || error);

        try {
          const { userId, carId } = await getIdentity();
          await publishStatus(userId, carId, "slow_scan_error", {
            error: error?.message || String(error),
          });
        } catch {}
      }

      slowTimer = setTimeout(loop, SLOW_SCAN_INTERVAL_MS);
    };

    slowTimer = setTimeout(loop, SLOW_SCAN_INTERVAL_MS);
  },

  async forceFullScanNow() {
    if (!elmBluetoothService.isConnected()) {
      throw new Error("قطعة OBD غير متصلة.");
    }

    isRunning = true;

    const result = await this.runFullDiscovery();

    this.startLiveStreaming();
    this.startSlowScanLoop();

    return result;
  },

  stopAutoScan() {
    isRunning = false;
    isLiveLoopRunning = false;
    isSlowLoopRunning = false;

    if (liveTimer) {
      clearTimeout(liveTimer);
      liveTimer = null;
    }

    if (slowTimer) {
      clearTimeout(slowTimer);
      slowTimer = null;
    }
  },

  resetCache() {
    cachedUserId = null;
    cachedCarId = null;
    cachedIdentity = null;
  },

  isAutoScanRunning() {
    return isRunning;
  },
};