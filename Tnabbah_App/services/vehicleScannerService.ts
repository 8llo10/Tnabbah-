import { supabase } from "../lib/supabase";
import { carIdentityService } from "./carIdentityService";
import { elmBluetoothService } from "./elmBluetoothService";
import { mqttService } from "./mqttService";
import { obdCoreService, ObdValue } from "./obdCoreService";

const APP_ROOT = "Tnabbah";

let isRunning = false;
let isLiveLoopRunning = false;
let isSlowLoopRunning = false;

let liveTimer: ReturnType<typeof setTimeout> | null = null;
let slowTimer: ReturnType<typeof setTimeout> | null = null;
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

let cachedUserId: string | null = null;
let cachedCarId: string | null = null;
let cachedIdentity: any = null;

let lastMode09: any = null;
let lastSupportedPids: string[] = [];

let scannerQueue: Promise<unknown> = Promise.resolve();

const LIVE_LOOP_DELAY_MS = 50;
const SLOW_SCAN_INTERVAL_MS = 5 * 60 * 1000;
const DISCONNECT_CHECK_MS = 1200;

const READ_ONLY_SRS_REQUESTS = ["1902FF", "1902FFFFFF", "03"];

const SRS_ATTEMPTS = [
  { brand: "toyota_lexus", headers: ["7A0", "7A1", "7A2", "7A3"] },
  { brand: "mazda", headers: ["720", "730", "760", "780"] },
];

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

function wrapPayload(userId: string, carId: string, path: string, payload: unknown) {
  return {
    app: APP_ROOT,
    userId,
    carId,
    path,
    timestamp: Date.now(),
    data: safeJson(payload),
  };
}

async function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = scannerQueue.then(task, task);
  scannerQueue = run.catch(() => {});
  return run;
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

async function getIdentity(forceRefresh = false) {
  if (!forceRefresh && cachedCarId && cachedIdentity) {
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

async function publish(
  userId: string,
  carId: string,
  path: string,
  payload: unknown,
  options?: { retain?: boolean }
) {
  const finalTopic = topic(userId, carId, path);
  const finalPayload = wrapPayload(userId, carId, path, payload);

  if (options?.retain) {
    await mqttService.publishRetainedAsync(finalTopic, finalPayload);
    return;
  }

  await mqttService.publishAsync(finalTopic, finalPayload);
}

async function publishStatus(
  userId: string,
  carId: string,
  status: string,
  extra: any = {}
) {
  await publish(
    userId,
    carId,
    "status",
    {
      status,
      obdConnected: elmBluetoothService.isConnected(),
      streaming: isRunning && isLiveLoopRunning,
      lastSeen: Date.now(),
      ...extra,
    },
    { retain: true }
  );
}

function isBadRaw(raw: unknown) {
  const text = String(raw || "").toUpperCase();

  return (
    !text ||
    text.includes("NO DATA") ||
    text.includes("ERROR") ||
    text.includes("UNABLE TO CONNECT") ||
    text.includes("STOPPED") ||
    text.includes("?")
  );
}

async function handleDisconnect(reason = "obd_disconnected") {
  try {
    const userId = cachedUserId || (await getUserId());
    const carId = cachedCarId;

    isRunning = false;
    isLiveLoopRunning = false;
    isSlowLoopRunning = false;

    if (liveTimer) clearTimeout(liveTimer);
    if (slowTimer) clearTimeout(slowTimer);
    if (disconnectTimer) clearTimeout(disconnectTimer);

    liveTimer = null;
    slowTimer = null;
    disconnectTimer = null;

    if (carId) {
      await publishStatus(userId, carId, "disconnected", {
        reason,
        obdConnected: false,
        streaming: false,
      });
    }
  } catch (error) {
    console.log("handleDisconnect error:", error);
  }
}

async function publishIdentity(userId: string, carId: string, identity: any) {
  await publish(userId, carId, "identity", identity, { retain: true });
}

async function publishPidValue(userId: string, carId: string, pid: string, value: ObdValue) {
  await publish(
    userId,
    carId,
    `pids/${pid}`,
    {
      ...value,
      stream: true,
    },
    { retain: true }
  );
}

async function publishMode09(userId: string, carId: string, force = false) {
  if (lastMode09 && !force) return lastMode09;

  const mode09 = await obdCoreService.readMode09({
    onResult: async (command, resultRaw) => {
      await publish(
        userId,
        carId,
        `mode09/${command}`,
        {
          command,
          raw: resultRaw,
        },
        { retain: true }
      );
    },
  });

  lastMode09 = mode09;

  await publish(userId, carId, "mode09/full", mode09, { retain: true });

  if (mode09.vin) {
    await publish(userId, carId, "mode09/vin", { vin: mode09.vin }, { retain: true });
  }

  return mode09;
}

async function publishDtcs(userId: string, carId: string) {
  const dtcs = await obdCoreService.readGenericDtcs({
    onResult: async (type, result) => {
      await publish(userId, carId, `dtc/${type}`, result, { retain: true });
    },
  });

  await publish(userId, carId, "dtc/full", dtcs, { retain: true });

  return dtcs;
}

async function publishSupportedPids(userId: string, carId: string) {
  const supported = await obdCoreService.getSupportedPids({
    onBlock: async (command, raw, list) => {
      await publish(
        userId,
        carId,
        `pids/support-blocks/${command}`,
        {
          command,
          raw,
          supportedPids: list,
        },
        { retain: true }
      );

      for (const pid of list) {
        await publish(
          userId,
          carId,
          `pids/supported/${pid}`,
          {
            pid,
            supported: true,
          },
          { retain: true }
        );
      }
    },
  });

  lastSupportedPids = supported.supportedPids || [];

  await publish(userId, carId, "pids/supported", supported, { retain: true });

  return supported;
}

async function publishAllSupportedPidValues(userId: string, carId: string) {
  const all = await obdCoreService.readAllSupportedPidValues({
    onValue: async (pid, value) => {
      await publishPidValue(userId, carId, pid, value);
    },
  });

  lastSupportedPids = all.supported.supportedPids || lastSupportedPids;

  await publish(userId, carId, "pids/all", all, { retain: true });

  return all;
}

async function publishContinuousAllSupportedPids(userId: string, carId: string) {
  await publishStatus(userId, carId, "streaming_all_supported_pids");

  const all = await obdCoreService.readAllSupportedPidValues({
    onValue: async (pid, value) => {
      if (!isRunning || !isLiveLoopRunning) return;
      await publishPidValue(userId, carId, pid, value);
    },
  });

  lastSupportedPids = all.supported.supportedPids || lastSupportedPids;

  await publish(userId, carId, "pids/all", all, { retain: true });

  return all;
}

async function trySrsReadOnlyScan(userId: string, carId: string) {
  const results: any[] = [];

  await publish(
    userId,
    carId,
    "srs/status",
    {
      status: "scanning",
      readOnly: true,
      message: "SRS scan is read-only. No clear/reset/write commands are used.",
    },
    { retain: true }
  );

  for (const attempt of SRS_ATTEMPTS) {
    for (const header of attempt.headers) {
      try {
        const setHeader = await elmBluetoothService.send(`ATSH${header}`, 900);

        for (const command of READ_ONLY_SRS_REQUESTS) {
          const raw = await elmBluetoothService.send(command, 2500);

          const item = {
            brand: attempt.brand,
            header,
            command,
            readOnly: true,
            setHeader,
            raw,
            hasResponse: !isBadRaw(raw),
            timestamp: Date.now(),
          };

          results.push(item);

          await publish(userId, carId, `srs/${attempt.brand}/${header}/${command}`, item, {
            retain: true,
          });

          await sleep(150);
        }
      } catch (error: any) {
        const item = {
          brand: attempt.brand,
          header,
          readOnly: true,
          error: error?.message || "SRS read failed",
          timestamp: Date.now(),
        };

        results.push(item);

        await publish(userId, carId, `srs/${attempt.brand}/${header}/error`, item, {
          retain: true,
        });
      }
    }
  }

  try {
    await elmBluetoothService.send("ATSH7DF", 700);
    await elmBluetoothService.send("ATSP0", 1200);
  } catch {}

  const found = results.filter((item) => item.hasResponse);

  const summary = {
    readOnly: true,
    foundCount: found.length,
    found,
    results,
    note:
      "If foundCount is 0, the car did not expose SRS data through these safe read-only attempts.",
  };

  await publish(userId, carId, "srs/full", summary, { retain: true });

  await publish(
    userId,
    carId,
    "srs/status",
    {
      status: "done",
      readOnly: true,
      foundCount: found.length,
      hasSrsResponse: found.length > 0,
    },
    { retain: true }
  );

  return summary;
}

export const vehicleScannerService = {
  async startAutoScan(options?: { forceFull?: boolean }) {
    if (!elmBluetoothService.isConnected()) {
      throw new Error("قطعة OBD غير متصلة.");
    }

    const { userId, carId, identity } = await getIdentity(!!options?.forceFull);

    isRunning = true;

    await publishStatus(userId, carId, "starting", {
      forceFull: !!options?.forceFull,
      identity,
    });

    if (options?.forceFull) {
      await runExclusive(() => this.runFullDiscovery());
    } else {
      await runExclusive(() => this.runInitialDiscovery());
    }

    this.startLiveStreaming();
    this.startSlowScanLoop();
    this.startDisconnectWatch();

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

    await publishIdentity(userId, carId, identity);

    const mode09 = await publishMode09(userId, carId, false);
    const dtcs = await publishDtcs(userId, carId);
    const supported = await publishSupportedPids(userId, carId);
    const allPids = await publishAllSupportedPidValues(userId, carId);
    const srs = await trySrsReadOnlyScan(userId, carId);

    const result = {
      identity,
      mode09,
      dtcs,
      supported,
      allPids,
      srs,
      timestamp: Date.now(),
    };

    await publish(userId, carId, "discovery/initial", result, { retain: true });

    return result;
  },

  async runFullDiscovery() {
    const { userId, carId, identity } = await getIdentity();

    await publishStatus(userId, carId, "full_discovery_started");
    await publishIdentity(userId, carId, identity);

    const mode09 = await publishMode09(userId, carId, true);
    const dtcs = await publishDtcs(userId, carId);
    const supported = await publishSupportedPids(userId, carId);
    const allPids = await publishAllSupportedPidValues(userId, carId);
    const srs = await trySrsReadOnlyScan(userId, carId);

    const result = {
      identity,
      mode09,
      dtcs,
      supported,
      allPids,
      srs,
      timestamp: Date.now(),
    };

    await publish(userId, carId, "discovery/full", result, { retain: true });
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
          await handleDisconnect("obd_disconnected_live_loop");
          return;
        }

        const { userId, carId } = await getIdentity();

        await runExclusive(() => publishContinuousAllSupportedPids(userId, carId));
      } catch (error: any) {
        console.log("Live stream error:", error?.message || error);

        try {
          const { userId, carId } = await getIdentity();
          await publishStatus(userId, carId, "live_stream_error", {
            error: error?.message || String(error),
          });
        } catch {}
      }

      if (!isRunning || !isLiveLoopRunning) return;

      liveTimer = setTimeout(loop, LIVE_LOOP_DELAY_MS);
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
          await handleDisconnect("obd_disconnected_slow_loop");
          return;
        }

        const { userId, carId } = await getIdentity();

        await publishStatus(userId, carId, "slow_scan_started");

        await runExclusive(async () => {
          await publishDtcs(userId, carId);
          await publishSupportedPids(userId, carId);
          await trySrsReadOnlyScan(userId, carId);
        });

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

      if (!isRunning || !isSlowLoopRunning) return;

      slowTimer = setTimeout(loop, SLOW_SCAN_INTERVAL_MS);
    };

    slowTimer = setTimeout(loop, SLOW_SCAN_INTERVAL_MS);
  },

  startDisconnectWatch() {
    if (disconnectTimer) return;

    const loop = async () => {
      if (!isRunning) {
        disconnectTimer = null;
        return;
      }

      if (!elmBluetoothService.isConnected()) {
        await handleDisconnect("obd_disconnected_watch");
        return;
      }

      disconnectTimer = setTimeout(loop, DISCONNECT_CHECK_MS);
    };

    disconnectTimer = setTimeout(loop, DISCONNECT_CHECK_MS);
  },

  async forceFullScanNow() {
    if (!elmBluetoothService.isConnected()) {
      throw new Error("قطعة OBD غير متصلة.");
    }

    isRunning = true;

    const result = await runExclusive(() => this.runFullDiscovery());

    this.startLiveStreaming();
    this.startSlowScanLoop();
    this.startDisconnectWatch();

    return result;
  },

  async stopAutoScan() {
    const wasRunning = isRunning;

    isRunning = false;
    isLiveLoopRunning = false;
    isSlowLoopRunning = false;

    if (liveTimer) clearTimeout(liveTimer);
    if (slowTimer) clearTimeout(slowTimer);
    if (disconnectTimer) clearTimeout(disconnectTimer);

    liveTimer = null;
    slowTimer = null;
    disconnectTimer = null;

    if (wasRunning && cachedUserId && cachedCarId) {
      await publishStatus(cachedUserId, cachedCarId, "stopped", {
        streaming: false,
        obdConnected: elmBluetoothService.isConnected(),
      });
    }
  },

  resetCache() {
    cachedUserId = null;
    cachedCarId = null;
    cachedIdentity = null;
    lastMode09 = null;
    lastSupportedPids = [];
  },

  isAutoScanRunning() {
    return isRunning;
  },

  getCachedIdentity() {
    return cachedIdentity;
  },

  getCachedCarId() {
    return cachedCarId;
  },
};