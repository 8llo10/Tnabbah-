import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
} from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { elmBluetoothService } from "../services/elmBluetoothService";
import { vehicleScannerService } from "../services/vehicleScannerService";
import { mqttService } from "../services/mqttService";


import { activeVehicleRuntime } from "../services/activeVehicleRuntime";


export type UserCar = {
    id: string;
    user_id: string;
    car_id: string;
    display_name: string | null;
    last_connected_at: string | null;
    is_deleted: boolean;
};



type CarsContextType = {
    activeCarId: string | null;
    obdConnected: boolean;
    scannerRunning: boolean;
    mqttConnected: boolean;
    lastConnectionTime: string | null;

    selectedCarId: string | null;
    connectedCarId: string | null;
    knownCarIds: string[];

    userCars: UserCar[];
    carsLoading: boolean;

    refreshObdState: () => Promise<void>;
    loadUserCars: () => Promise<void>;
    saveSelectedCarId: (carId: string | null) => Promise<void>;

    selectDefaultCar: (carId: string) => Promise<void>;
    renameCar: (carRowId: string, name: string) => Promise<void>;
    deleteCar: (car: UserCar) => Promise<void>;

    stopScanner: () => Promise<void>;
    disconnectObd: () => Promise<void>;
};

const CarsContext = createContext<CarsContextType | null>(null);

export function CarsProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { session } = useAuth();

    const [obdConnected, setObdConnected] = useState(false);
    const [scannerRunning, setScannerRunning] = useState(false);

    const [mqttConnected, setMqttConnected] = useState(false);
    const [lastConnectionTime, setLastConnectionTime] = useState<string | null>(null);

    const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
    const [connectedCarId, setConnectedCarId] = useState<string | null>(null);
    const [knownCarIds, setKnownCarIds] = useState<string[]>([]);

    const [userCars, setUserCars] = useState<UserCar[]>([]);
    const [carsLoading, setCarsLoading] = useState(false);

    /* const activeCarId =
        manualSelectedCarId ||
        connectedCarId ||
        selectedCarId ||
        null; */

    /*  const activeCarId =
         connectedCarId ||
         manualSelectedCarId ||
         selectedCarId ||
         null; */

    const activeCarId =
        connectedCarId ||
        selectedCarId ||
        null;


    const saveSelectedCarId = async (carId: string | null) => {
        const realUserId = session?.user?.id;

        // setManualSelectedCarId(carId);
        setSelectedCarId(carId);
        activeVehicleRuntime.setSelectedCarId(carId);

        if (!realUserId) return;

        const { error } = await supabase
            .from("user_settings")
            .upsert(
                {
                    user_id: realUserId,
                    last_car_id: carId,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
            );

        if (error) {
            console.log("Save selected car id error:", error);
        }
    };

    const loadSelectedCarId = async () => {
        const realUserId = session?.user?.id;
        if (!realUserId) return;

        try {
            const { data, error } = await supabase
                .from("user_settings")
                .select("last_car_id")
                .eq("user_id", realUserId)
                .maybeSingle();

            if (error) throw error;

            if (data?.last_car_id) {
                setSelectedCarId(data.last_car_id);
                activeVehicleRuntime.setSelectedCarId(data.last_car_id);
            }
        } catch (error) {
            console.log("Load selected car id error:", error);
        }
    };

    const loadUserCars = async (showLoading = true) => {
        const realUserId = session?.user?.id;
        if (!realUserId) return;

        if (showLoading) {
            setCarsLoading(true);
        }

        try {
            const { data, error } = await supabase
                .from("user_cars")
                .select("id, user_id, car_id, display_name, last_connected_at, is_deleted")
                .eq("user_id", realUserId)
                .eq("is_deleted", false)
                .order("last_connected_at", {
                    ascending: false,
                    nullsFirst: false,
                });

            if (error) throw error;

            setUserCars(data || []);

            const latestCar = data?.[0];

            if (
                latestCar?.car_id &&
                !connectedCarIdRef.current &&
                !selectedCarId
            ) {
                await saveSelectedCarId(latestCar.car_id);
            }


        } catch (error) {
            console.log("Load user cars error:", error);
        } finally {
            if (showLoading) {
                setCarsLoading(false);
            }
        }
    };

    const refreshObdState = async () => {
        const connected = await elmBluetoothService
            .isActuallyConnected?.()
            .catch(() => false);

        setObdConnected(!!connected);
        setScannerRunning(vehicleScannerService.isAutoScanRunning());

        /*  const cachedCarId = vehicleScannerService.getCachedCarId();
 
         if (connected && cachedCarId) {
             setConnectedCarId(cachedCarId);
         } else {
             setConnectedCarId(null);
         } */

        if (!connected) {
            setConnectedCarId(null);
            activeVehicleRuntime.setConnectedCarId(null);
        }

    };

    const selectDefaultCar = async (carId: string) => {
        await saveSelectedCarId(carId);
    };

    const renameCar = async (carRowId: string, name: string) => {
        const cleanName = name.trim();

        const { error } = await supabase
            .from("user_cars")
            .update({
                display_name: cleanName || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", carRowId);

        if (error) throw error;

        await loadUserCars();
    };

    const deleteCar = async (car: UserCar) => {
        const isConnectedCar = connectedCarId === car.car_id;
        const isSelectedCar = selectedCarId === car.car_id;

        if (isConnectedCar) {
            await vehicleScannerService.stopAutoScan();
            await elmBluetoothService.disconnect();

            try {
                mqttService.disconnect();
            } catch (error) {
                console.log("MQTT disconnect while deleting car error:", error);
            }

            setObdConnected(false);
            setScannerRunning(false);
            setConnectedCarId(null);
            activeVehicleRuntime.setConnectedCarId(null);
        }

        const { error } = await supabase
            .from("user_cars")


            .update({
                is_deleted: true,
                updated_at: new Date().toISOString(),
            })
            .eq("id", car.id);

        if (error) throw error;

        if (isSelectedCar) {
            await saveSelectedCarId(null);
        }

        await loadUserCars();
    };

    const stopScanner = async () => {
        await vehicleScannerService.stopAutoScan();
        await refreshObdState();
    };

    const disconnectObd = async () => {
        await vehicleScannerService.stopAutoScan();
        await elmBluetoothService.disconnect();
        await refreshObdState();
        activeVehicleRuntime.setConnectedCarId(null);
    };

    const connectedCarIdRef = useRef<string | null>(null);

    useEffect(() => {
        connectedCarIdRef.current = connectedCarId;
    }, [connectedCarId]);

    useEffect(() => {
        if (!session?.user?.id) return;

        loadSelectedCarId();
        loadUserCars();
    }, [session?.user?.id]);

    useEffect(() => {
        refreshObdState();

        const interval = setInterval(refreshObdState, 1500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let mounted = true;
        let client: any = null;
        let cleanup: any;

        const setupCarsListener = async () => {
            try {
                const realUserId = session?.user?.id;

                if (!realUserId) return;

                client = await mqttService.connectAsync();

                if (!mounted) return;

                setMqttConnected(true);

                const identityTopic = `Tnabbah/${realUserId}/+/identity`;
                const statusTopic = `Tnabbah/${realUserId}/+/status`;

                const handleMessage = (payload: any, raw: string, topic: string) => {
                    if (!mounted) return;

                    const parts = topic.split("/");
                    const incomingCarId = parts[2];

                    if (incomingCarId) {
                        setKnownCarIds((prev) =>
                            prev.includes(incomingCarId) ? prev : [...prev, incomingCarId]
                        );
                    }

                    try {
                        const data = payload?.data ?? payload;

                        if (incomingCarId && realUserId) {
                            const now = new Date().toISOString();

                            void (async () => {
                                const { data: existing } = await supabase
                                    .from("user_cars")
                                    .select("id, is_deleted")
                                    .eq("user_id", realUserId)
                                    .eq("car_id", incomingCarId)
                                    .maybeSingle();

                                if (existing?.is_deleted && data?.obdConnected !== true) {
                                    return;
                                }

                                if (existing?.id) {
                                    await supabase
                                        .from("user_cars")
                                        .update({
                                            is_deleted: false,
                                            updated_at: now,
                                            ...(data?.obdConnected === true
                                                ? { last_connected_at: now }
                                                : {}),
                                        })
                                        .eq("id", existing.id);
                                } else {
                                    await supabase.from("user_cars").insert({
                                        user_id: realUserId,
                                        car_id: incomingCarId,
                                        is_deleted: false,
                                        updated_at: now,
                                        ...(data?.obdConnected === true
                                            ? { last_connected_at: now }
                                            : {}),
                                    });
                                }

                                if (data?.obdConnected === true) {
                                    await loadUserCars(false);
                                }
                            })();
                        }

                        if (data?.obdConnected === true && incomingCarId) {
                            setConnectedCarId(incomingCarId);
                            activeVehicleRuntime.setConnectedCarId(incomingCarId);

                            setObdConnected(true);
                            setScannerRunning(vehicleScannerService.isAutoScanRunning());
                            setLastConnectionTime(new Date().toISOString());
                        }

                        if (data?.obdConnected === false && incomingCarId) {
                            if (
                                connectedCarIdRef.current &&
                                incomingCarId === connectedCarIdRef.current
                            ) {
                                setConnectedCarId(null);
                                activeVehicleRuntime.setConnectedCarId(null);
                            }

                            setObdConnected(false);
                            setScannerRunning(false);
                        }
                    } catch (error) {
                        console.log("CarsProvider MQTT message parse error:", error);
                    }
                };

                await mqttService.subscribeAsync(identityTopic, handleMessage);
                await mqttService.subscribeAsync(statusTopic, handleMessage);

                cleanup = () => {
                    mqttService.unsubscribeAsync(identityTopic, handleMessage);
                    mqttService.unsubscribeAsync(statusTopic, handleMessage);
                };
            } catch (error) {
                console.log("CarsProvider MQTT listener error:", error);
                setMqttConnected(false);
            }
        };

        setupCarsListener();

        return () => {
            mounted = false;
            setMqttConnected(false);

            if (cleanup) cleanup();
        };
    }, [session?.user?.id]);

    return (
        <CarsContext.Provider
            value={{
                obdConnected,
                scannerRunning,
                mqttConnected,
                lastConnectionTime,
                activeCarId,

                selectedCarId,
                connectedCarId,
                knownCarIds,

                userCars,
                carsLoading,

                refreshObdState,
                loadUserCars,
                saveSelectedCarId,

                selectDefaultCar,
                renameCar,
                deleteCar,

                stopScanner,
                disconnectObd,
            }}
        >
            {children}
        </CarsContext.Provider>
    );
}

export function useCars() {
    const context = useContext(CarsContext);

    if (!context) {
        throw new Error("useCars must be used inside CarsProvider");
    }

    return context;
}