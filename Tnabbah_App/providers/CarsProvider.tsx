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

    detectingCar: boolean;
    beginDetectingCar: () => void;
    finishDetectingCar: () => void;

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

    const [detectingCar, setDetectingCar] = useState(false);

    const beginDetectingCar = () => setDetectingCar(true);
    const finishDetectingCar = () => setDetectingCar(false);

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

            const cars = data || [];
            const latestCar = cars[0];

            const selectedStillExists = cars.some(
                (car) => car.car_id === selectedCarIdRef.current
            );

            if (!connectedCarIdRef.current) {
                if (!selectedStillExists && latestCar?.car_id) {
                    await saveSelectedCarId(latestCar.car_id);
                }

                if (!selectedStillExists && !latestCar) {
                    await saveSelectedCarId(null);
                }
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
            setDetectingCar(false);
            setConnectedCarId(null);
            activeVehicleRuntime.setConnectedCarId(null);
            setScannerRunning(false);
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

        if (error) throw error;

        await loadUserCars();

        console.log("AFTER RENAME CHECK:", {
            renamedRowId: carRowId,
            newName: cleanName,
            connectedCarId,
            selectedCarId,
            activeCarId,
        });
    };

    const deleteCar = async (car: UserCar) => {
        const isConnectedCar = connectedCarId === car.car_id;
        const isSelectedCar = selectedCarId === car.car_id;

        const deletedIndex = userCars.findIndex(
            (item) => item.id === car.id
        );

        const remainingCars = userCars.filter(
            (item) => item.id !== car.id
        );

        const fallbackCar =
            remainingCars[deletedIndex - 1] ||
            remainingCars[deletedIndex] ||
            remainingCars[0] ||
            null;

        if (isConnectedCar) {
            await vehicleScannerService.stopAutoScan();
            await elmBluetoothService.disconnect();

            try {
                mqttService.disconnect();
            } catch (error) {
                console.log("MQTT disconnect while deleting car error:", error);
            }

            setDetectingCar(false);
            setObdConnected(false);
            setScannerRunning(false);
            setConnectedCarId(null);
            activeVehicleRuntime.setConnectedCarId(null);

        }

        const userId = session?.user?.id;

        if (!userId) {
            throw new Error("USER_NOT_FOUND");
        }

        const mqttResponse = await fetch(
            `http://207.180.244.27:3300/car/${userId}/${car.car_id}`,
            {
                method: "DELETE",
                headers: {
                    "x-api-token": "tnabbah-delete-secret-2026",
                },
            }
        );

        const mqttText = await mqttResponse.text();

        console.log("MQTT DELETE STATUS:", mqttResponse.status);
        console.log("MQTT DELETE RESPONSE:", mqttText);

        if (!mqttResponse.ok && mqttResponse.status !== 404) {
            throw new Error("MQTT_DELETE_FAILED");
        }

        if (!mqttResponse.ok) {
            console.log("MQTT delete warning");
        }

        const shouldMoveSelection =
            selectedCarId === car.car_id ||
            connectedCarId === car.car_id ||
            activeCarId === car.car_id;

        const { error } = await supabase
            .from("user_cars")
            .delete()
            .eq("id", car.id);

        if (error) {
            throw error;
        }

        if (shouldMoveSelection) {
            const nextCarId = fallbackCar?.car_id || null;

            setSelectedCarId(nextCarId);
            activeVehicleRuntime.setSelectedCarId(nextCarId);

            await saveSelectedCarId(nextCarId);
        }

        await loadUserCars(false);
    };

    const stopScanner = async () => {
        await vehicleScannerService.stopAutoScan();
        await refreshObdState();
    };

    const disconnectObd = async () => {
        await vehicleScannerService.stopAutoScan();
        await elmBluetoothService.disconnect();
        await refreshObdState();
        setDetectingCar(false);
        activeVehicleRuntime.setConnectedCarId(null);
    };

    const connectedCarIdRef = useRef<string | null>(null);
    const selectedCarIdRef = useRef<string | null>(null);

    useEffect(() => {
        connectedCarIdRef.current = connectedCarId;
    }, [connectedCarId]);

    useEffect(() => {
        selectedCarIdRef.current = selectedCarId;
    }, [selectedCarId]);

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

                        if (
                            data?.status === "starting" ||
                            data?.status === "full_discovery_started"
                        ) {
                            setDetectingCar(true);
                        }

                        if (incomingCarId && realUserId) {
                            const now = new Date().toISOString();

                            void (async () => {
                                const { data: existing } = await supabase
                                    .from("user_cars")
                                    .select("id, is_deleted")
                                    .eq("user_id", realUserId)
                                    .eq("car_id", incomingCarId)
                                    .maybeSingle();

                                console.log("MQTT CAR:", incomingCarId);
                                console.log("EXISTING:", existing);

                                console.log("MQTT CAR AFTER RECONNECT:", incomingCarId);
                                console.log("STATE AFTER RECONNECT:", {
                                    connectedCarId: connectedCarIdRef.current,
                                    selectedCarId,
                                    activeCarId,
                                });
                                console.log("EXISTING ROW FOUND:", existing);

                                /* if (existing?.is_deleted && data?.obdConnected !== true) {
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

                                if (
                                    data?.obdConnected === true &&
                                    incomingCarId !== connectedCarIdRef.current
                                ) {
                                    await loadUserCars(false);
                                }يرئر */

                                if (existing?.is_deleted) {
                                    return;
                                }

                                if (existing?.id) {
                                    await supabase
                                        .from("user_cars")
                                        .update({
                                            updated_at: now,
                                            ...(data?.obdConnected === true
                                                ? { last_connected_at: now }
                                                : {}),
                                        })
                                        .eq("id", existing.id);

                                    if (data?.obdConnected === true) {
                                        await loadUserCars(false);
                                        console.log("RELOADED CARS");
                                    }
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

                                    console.log("INSERTED:", incomingCarId);

                                    if (data?.obdConnected === true) {
                                        await loadUserCars(false);
                                        console.log("RELOADED CARS");
                                    }
                                }


                            })();
                        }

                        if (data?.obdConnected === true && incomingCarId) {
                            setDetectingCar(false);

                            setConnectedCarId(incomingCarId);
                            setSelectedCarId(incomingCarId);

                            activeVehicleRuntime.setConnectedCarId(incomingCarId);
                            activeVehicleRuntime.setSelectedCarId(incomingCarId);

                            setObdConnected(true);
                            setScannerRunning(vehicleScannerService.isAutoScanRunning());
                            setLastConnectionTime(new Date().toISOString());

                            if (selectedCarIdRef.current !== incomingCarId) {
                                void saveSelectedCarId(incomingCarId);
                            }
                        }

                        if (data?.obdConnected === false && incomingCarId) {
                            setDetectingCar(false);
                            if (
                                connectedCarIdRef.current &&
                                incomingCarId === connectedCarIdRef.current
                            ) {
                                setConnectedCarId(null);
                                activeVehicleRuntime.setConnectedCarId(null);

                                setObdConnected(false);
                                setScannerRunning(false);
                            }
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
                detectingCar,
                beginDetectingCar,
                finishDetectingCar,
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