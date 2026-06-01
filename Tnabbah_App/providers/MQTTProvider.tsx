/* import { createContext, useContext, useEffect, useState } from "react";
import { connect } from "mqtt";

const MQTTContext = createContext<any>(null);

export const MQTTProvider = ({ children }: any) => {
    const [status, setStatus] = useState(null);
    const [info, setInfo] = useState(null);
    const [dtcs, setDtcs] = useState(null);
    const [liveData, setLiveData] = useState(null);

    useEffect(() => {
        const client = connect("ws://192.168.68.115:9001"); // اليوم لوكل

        client.on("connect", () => {
            console.log("MQTT Connected");

            client.subscribe("obd/UNKNOWN-CAR/status");
            client.subscribe("obd/UNKNOWN-CAR/info");
            client.subscribe("obd/UNKNOWN-CAR/dtcs");
            client.subscribe("obd/UNKNOWN-CAR/live");
        });

        client.on("message", (topic, message) => {
            const data = JSON.parse(message.toString());

            if (topic === "obd/UNKNOWN-CAR/status") setStatus(data);
            if (topic === "obd/UNKNOWN-CAR/info") setInfo(data);
            if (topic === "obd/UNKNOWN-CAR/dtcs") setDtcs(data);
            if (topic === "obd/UNKNOWN-CAR/live") setLiveData(data);
        });

        return () => {
            client.end();
        };
    }, []);

    return (
        <MQTTContext.Provider value={{ status, info, dtcs, liveData }}>
            {children}
        </MQTTContext.Provider>
    );
};

export const useMQTT = () => useContext(MQTTContext);
 */