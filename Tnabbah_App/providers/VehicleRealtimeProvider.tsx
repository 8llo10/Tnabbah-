import React, {
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
}