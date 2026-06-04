export type VehicleMetrics = {
    rpm: number | string | null;
    speed: number | string | null;
    voltage: number | string | null;
    coolant: number | string | null;

    oilTemp: number | string | null;
    fuelPressure: number | string | null;
    manifoldPressure: number | string | null;

    intakeAirTemp: number | string | null;
    fuelLevel: number | string | null;
    fuelRate: number | string | null;

    torque: number | string | null;
    engineLoad: number | string | null;

    /*  oilPressure: number | string | null;
     tirePressure: number | string | null; */
};

export type VehicleSnapshot = {
    carId: string;
    metrics: VehicleMetrics;
    vin: string | null;
    dtcCount: number;
    supportedCount: number;
    lastRaw: string;
    statusText: string;
    isConnected: boolean;
    isAutoRunning: boolean;
    updatedAt: number;
};

type Listener = () => void;

const emptyMetrics: VehicleMetrics = {
    rpm: null,
    speed: null,
    voltage: null,
    coolant: null,

    oilTemp: null,
    fuelPressure: null,
    manifoldPressure: null,

    intakeAirTemp: null,
    fuelLevel: null,
    fuelRate: null,

    torque: null,
    engineLoad: null,

    /* oilPressure: null,
    tirePressure: null, */
};

const snapshotsByCarId: Record<string, VehicleSnapshot> = {};
const listeners = new Set<Listener>();

function emit() {
    listeners.forEach((listener) => listener());
}

function createEmptySnapshot(carId: string): VehicleSnapshot {
    return {
        carId,
        metrics: { ...emptyMetrics },
        vin: null,
        dtcCount: 0,
        supportedCount: 0,
        lastRaw: "",
        statusText: "جاهز للفحص",
        isConnected: false,
        isAutoRunning: false,
        updatedAt: Date.now(),
    };
}

export const vehicleRealtimeStore = {
    subscribe(listener: Listener) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    getSnapshot(carId: string | null) {
        if (!carId) return null;
        return snapshotsByCarId[carId] || null;
    },

    getOrCreateSnapshot(carId: string) {
        if (!snapshotsByCarId[carId]) {
            snapshotsByCarId[carId] = createEmptySnapshot(carId);
        }

        return snapshotsByCarId[carId];
    },

    getAllSnapshots() {
        return snapshotsByCarId;
    },

    updateSnapshot(
        carId: string,
        updater: (snapshot: VehicleSnapshot) => VehicleSnapshot
    ) {
        const current =
            snapshotsByCarId[carId] || createEmptySnapshot(carId);

        snapshotsByCarId[carId] = {
            ...updater(current),
            carId,
            updatedAt: Date.now(),
        };

        emit();
    },

    updateStatus(carId: string, data: any) {
        this.updateSnapshot(carId, (snapshot) => ({
            ...snapshot,

            // لا نمسح آخر قراءات عند الفصل
            metrics: snapshot.metrics,
            vin: snapshot.vin,
            dtcCount: snapshot.dtcCount,
            supportedCount: snapshot.supportedCount,
            lastRaw: snapshot.lastRaw,

            statusText:
                data?.status === "disconnected" || data?.obdConnected === false
                    ? "القطعة غير متصلة"
                    : data?.status || "تم تحديث الحالة",

            isConnected: data?.obdConnected === true,
            isAutoRunning: data?.streaming === true,
        }));
    },

    updateIdentity(carId: string, data: any) {
        this.updateSnapshot(carId, (snapshot) => ({
            ...snapshot,
            vin: data?.vin || data?.fingerprints?.vin || snapshot.vin || null,
            lastRaw: JSON.stringify(data, null, 2),
        }));
    },

    updateMode09(carId: string, data: any) {
        this.updateSnapshot(carId, (snapshot) => ({
            ...snapshot,
            vin: data?.vin || snapshot.vin || null,
            lastRaw: JSON.stringify(data, null, 2),
        }));
    },

    updateSupportedPids(carId: string, data: any) {
        this.updateSnapshot(carId, (snapshot) => ({
            ...snapshot,
            supportedCount: Array.isArray(data?.supportedPids)
                ? data.supportedPids.length
                : snapshot.supportedCount,
            lastRaw: JSON.stringify(data, null, 2),
        }));
    },

    updatePidValue(carId: string, pid: string, data: any) {
        this.updateSnapshot(carId, (snapshot) => {
            const value = data?.value;

            if (value === null || value === undefined || value === "") {
                return snapshot;
            }

            return {
                ...snapshot,
                metrics: {
                    ...snapshot.metrics,

                    rpm: pid === "010C" ? value : snapshot.metrics.rpm,
                    speed: pid === "010D" ? value : snapshot.metrics.speed,
                    voltage: pid === "0142" ? value : snapshot.metrics.voltage,
                    coolant: pid === "0105" ? value : snapshot.metrics.coolant,

                    oilTemp: pid === "015C" ? value : snapshot.metrics.oilTemp,
                    /* oilPressure:
                        pid === "015B" || pid === "0167"
                            ? value
                            : snapshot.metrics.oilPressure,

                    tirePressure:
                        pid === "017C"
                            ? value
                            : snapshot.metrics.tirePressure, */
                    fuelPressure: pid === "010A" ? value : snapshot.metrics.fuelPressure,
                    manifoldPressure: pid === "010B" ? value : snapshot.metrics.manifoldPressure,

                    intakeAirTemp: pid === "010F" ? value : snapshot.metrics.intakeAirTemp,
                    fuelLevel: pid === "012F" ? value : snapshot.metrics.fuelLevel,
                    fuelRate: pid === "015E" ? value : snapshot.metrics.fuelRate,

                    torque: pid === "0162" ? value : snapshot.metrics.torque,
                    engineLoad: pid === "0104" ? value : snapshot.metrics.engineLoad,
                },
            };
        });
    },

    updateDtc(carId: string, data: any) {
        this.updateSnapshot(carId, (snapshot) => {
            const allCodes = [
                ...(data?.stored?.dtcs || []),
                ...(data?.pending?.dtcs || []),
                ...(data?.permanent?.dtcs || []),
            ];

            const uniqueCodes = Array.from(new Set(allCodes));

            return {
                ...snapshot,
                dtcCount: uniqueCodes.length,
                lastRaw: JSON.stringify(data, null, 2),
            };
        });
    },

    resetCar(carId: string) {
        snapshotsByCarId[carId] = createEmptySnapshot(carId);
        emit();
    },

    clearAll() {
        Object.keys(snapshotsByCarId).forEach((carId) => {
            delete snapshotsByCarId[carId];
        });

        emit();
    },
};