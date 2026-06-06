import React, {
<<<<<<< HEAD
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

type VehicleRealtimeContextType = {
  isConnected: boolean;
  isAutoRunning: boolean;
  isConnecting: boolean;
  lastIdentityMessage: any;
  lastStatusMessage: any;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAutoRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConnecting: React.Dispatch<React.SetStateAction<boolean>>;
  setLastIdentityMessage: React.Dispatch<React.SetStateAction<any>>;
  setLastStatusMessage: React.Dispatch<React.SetStateAction<any>>;
};

const VehicleRealtimeContext =
  createContext<VehicleRealtimeContextType | null>(null);

export function VehicleRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastIdentityMessage, setLastIdentityMessage] = useState<any>(null);
  const [lastStatusMessage, setLastStatusMessage] = useState<any>(null);

  const value = useMemo(
    () => ({
      isConnected,
      isAutoRunning,
      isConnecting,
      lastIdentityMessage,
      lastStatusMessage,
      setIsConnected,
      setIsAutoRunning,
      setIsConnecting,
      setLastIdentityMessage,
      setLastStatusMessage,
    }),
    [
      isConnected,
      isAutoRunning,
      isConnecting,
      lastIdentityMessage,
      lastStatusMessage,
    ]
  );

  return (
    <VehicleRealtimeContext.Provider value={value}>
      {children}
    </VehicleRealtimeContext.Provider>
  );
}

export function useVehicleRealtime() {
  const context = useContext(VehicleRealtimeContext);

  if (!context) {
    throw new Error(
      "useVehicleRealtime must be used inside VehicleRealtimeProvider"
    );
  }

  return context;
=======
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

import { supabase } from "../lib/supabase";
import { mqttService } from "../services/mqttService";
import { useCars } from "./CarsProvider";
import { vehicleRealtimeStore } from "../services/VehicleRealtimeStore";
type MetricsState = {
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
};

type VehicleRealtimeContextType = {
    metrics: MetricsState;
    vin: string | null;
    dtcCount: number;
    supportedCount: number;
    lastRaw: string;
    statusText: string;
    isConnected: boolean;
    isAutoRunning: boolean;
    hasLiveData: boolean;
};

const VehicleRealtimeContext =
    createContext<VehicleRealtimeContextType | null>(
        null
    );

export function VehicleRealtimeProvider({
    children,
}: any) {
    const { activeCarId } = useCars();

    const activeCarIdRef = useRef<string | null>(null);

    const [, forceUpdate] = useState(0);

    const snapshot = vehicleRealtimeStore.getSnapshot(activeCarId);

    const hasLiveData =
        snapshot?.metrics?.rpm !== null &&
        snapshot?.metrics?.speed !== null &&
        snapshot?.metrics?.voltage !== null &&
        snapshot?.metrics?.coolant !== null;

    useEffect(() => {
        activeCarIdRef.current =
            activeCarId || null;
    }, [activeCarId]);

    useEffect(() => {
        return vehicleRealtimeStore.subscribe(() => {
            const current =
                activeCarIdRef.current;

            if (!current) return;

            const snapshot =
                vehicleRealtimeStore.getSnapshot(current);

            if (snapshot) {
                forceUpdate((v) => v + 1);
            }
        });
    }, []);

    useEffect(() => {
        let mounted = true;

        let cleanup: any;

        const setup = async () => {
            try {
                const { data } =
                    await supabase.auth.getUser();

                const userId = data.user?.id;

                if (!userId) return;

                const root =
                    `Tnabbah/${userId}/+/`;

                const topics = [
                    `${root}status`,
                    `${root}identity`,
                    `${root}mode09/#`,
                    `${root}pids/#`,
                    `${root}dtc/#`,
                    `${root}discovery/#`,
                ];

                const handleMessage = (
                    payload: any,
                    raw: string,
                    topic: string
                ) => {
                    if (!mounted) return;

                    const parts = topic.split("/");

                    const incomingCarId =
                        parts[2];

                    if (!incomingCarId) return;

                    const section = parts[3];
                    const sub = parts[4];

                    console.log("MQTT ARRIVED:", {
                        topic,
                        incomingCarId,
                        activeCarId: activeCarIdRef.current,
                    });

                    const data =
                        payload?.data ?? payload;

                    if (!data) return;

                    if (section === "status") {
                        vehicleRealtimeStore.updateStatus(incomingCarId, data);
                    }

                    if (section === "identity") {
                        vehicleRealtimeStore.updateIdentity(incomingCarId, data);
                    }

                    if (section === "mode09") {
                        vehicleRealtimeStore.updateMode09(incomingCarId, data);
                    }

                    if (section === "pids") {
                        if (sub === "supported") {
                            vehicleRealtimeStore.updateSupportedPids(incomingCarId, data);
                        } else if (sub) {
                            vehicleRealtimeStore.updatePidValue(incomingCarId, sub, data);
                        }
                    }

                    if (section === "dtc" && sub === "full") {
                        vehicleRealtimeStore.updateDtc(incomingCarId, data);
                    }
                };

                await Promise.all(
                    topics.map((topic) =>
                        mqttService.subscribeAsync(
                            topic,
                            handleMessage
                        )
                    )
                );

                cleanup = () => {
                    topics.forEach((topic) => {
                        mqttService.unsubscribeAsync(
                            topic,
                            handleMessage
                        );
                    });
                };
            } catch (error) {
                console.log(
                    "VehicleRealtimeProvider error:",
                    error
                );
            }
        };

        setup();

        return () => {
            mounted = false;

            if (cleanup) cleanup();
        };
    }, []);



    return (
        <VehicleRealtimeContext.Provider
            value={{
                metrics: snapshot?.metrics || {
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
                },
                vin: snapshot?.vin || null,
                dtcCount: snapshot?.dtcCount || 0,
                supportedCount: snapshot?.supportedCount || 0,
                lastRaw: snapshot?.lastRaw || "",
                statusText: snapshot?.statusText || "جاهز للفحص",
                isConnected: snapshot?.isConnected || false,
                isAutoRunning: snapshot?.isAutoRunning || false,
                hasLiveData,
            }}
        >
            {children}
        </VehicleRealtimeContext.Provider>
    );
}

export function useVehicleRealtime() {
    const context = useContext(
        VehicleRealtimeContext
    );

    if (!context) {
        throw new Error(
            "useVehicleRealtime must be used inside VehicleRealtimeProvider"
        );
    }

    return context;
>>>>>>> 30814681d235d3cb6ed7db323a7b27a6a6de5e19
}