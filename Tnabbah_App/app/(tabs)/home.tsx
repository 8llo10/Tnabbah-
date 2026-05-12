import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { elmBluetoothService } from "../../services/elmBluetoothService";
import { vehicleScannerService } from "../../services/vehicleScannerService";
import { mqttService } from "../../services/mqttService";
import { supabase } from "../../lib/supabase";

const COLORS = {
    primary: "#871B17",
    primaryLight: "#9A3A33",
    primaryDark: "#5F130F",
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    soft: "#F8F8F8",
    softRed: "#F2D7DA",
    border: "#EDEDED",
    text: "#1D1D1F",
    muted: "#7A7A7A",
    danger: "#C62828",
    warning: "#B7791F",
    success: "#1F8A4C",
};

type MetricState = {
    rpm: number | string | null;
    speed: number | string | null;
    voltage: number | string | null;
    coolant: number | string | null;
};

function safeValue(value: any) {
    if (value === null || value === undefined || value === "") return "--";
    return String(value);
}

function prettyJson(value: unknown) {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function getPayloadData(message: Buffer) {
    try {
        const parsed = JSON.parse(message.toString());
        return parsed?.data ?? parsed;
    } catch {
        return null;
    }
}

export default function HomeScreen() {
    const { width, height } = useWindowDimensions();

    const isLandscape = width > height;
    const isWide = width >= 760 || isLandscape;
    const columns = isWide ? 4 : 2;

    const [isChecking, setIsChecking] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isAutoRunning, setIsAutoRunning] = useState(false);

    const [metrics, setMetrics] = useState<MetricState>({
        rpm: null,
        speed: null,
        voltage: null,
        coolant: null,
    });

    const [vin, setVin] = useState<string | null>(null);
    const [carId, setCarId] = useState<string | null>(null);
    const [supportedCount, setSupportedCount] = useState<number>(0);
    const [dtcCount, setDtcCount] = useState<number>(0);

    const [lastRaw, setLastRaw] = useState("");
    const [statusText, setStatusText] = useState("جاهز للفحص");
    const [debugText, setDebugText] = useState("");

    const metricWidth = useMemo(() => {
        const pagePadding = isWide ? 52 : 36;
        const totalGap = 10 * (columns - 1);
        return (width - pagePadding - totalGap) / columns;
    }, [width, columns, isWide]);

    useEffect(() => {
        const update = async () => {
            const connected = await elmBluetoothService.isActuallyConnected?.().catch(() => false);

            setIsConnected(!!connected);
            setIsAutoRunning(vehicleScannerService.isAutoScanRunning());

            const cachedCarId = vehicleScannerService.getCachedCarId();
            if (cachedCarId) setCarId(cachedCarId);

            if (!connected) {
                setStatusText("غير متصل بالقطعة");
            } else if (vehicleScannerService.isAutoScanRunning()) {
                setStatusText("الفحص التلقائي والستريمنق شغالين");
            } else {
                setStatusText("متصل بقطعة OBD");
            }
        };

        update();

        const interval = setInterval(update, 1500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let mounted = true;
        let client: any = null;

        const setupMqttListener = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                const userId = data.user?.id;

                if (!userId) return;

                client = await mqttService.connectAsync();

                const root = `Tnabbah/${userId}/+/`;

                const topics = [
                    `${root}status`,
                    `${root}identity`,
                    `${root}mode09/#`,
                    `${root}pids/#`,
                    `${root}dtc/#`,
                    `${root}srs/#`,
                    `${root}discovery/#`,
                ];

                client.subscribe(topics);

                const onMessage = (topic: string, message: Buffer) => {
                    if (!mounted) return;

                    const data = getPayloadData(message);
                    if (!data) return;

                    const parts = topic.split("/");
                    const incomingCarId = parts[2];
                    const section = parts[3];
                    const sub = parts[4];

                    if (incomingCarId) setCarId(incomingCarId);

                    if (section === "status") {
                        setStatusText(
                            data.status === "disconnected"
                                ? "القطعة غير متصلة"
                                : data.status || "تم تحديث الحالة"
                        );

                        setIsAutoRunning(!!data.streaming);
                        setIsConnected(!!data.obdConnected);
                    }

                    if (section === "identity") {
                        setVin(data.vin || data.fingerprints?.vin || null);
                        setLastRaw(prettyJson(data));
                    }

                    if (section === "mode09") {
                        if (sub === "vin" && data.vin) setVin(data.vin);
                        if (sub === "full" && data.vin) setVin(data.vin);
                    }

                    if (section === "pids") {
                        if (sub === "supported") {
                            if (Array.isArray(data.supportedPids)) {
                                setSupportedCount(data.supportedPids.length);
                            }
                        }

                        if (sub === "010C") {
                            setMetrics((prev) => ({ ...prev, rpm: data.value ?? null }));
                        }

                        if (sub === "010D") {
                            setMetrics((prev) => ({ ...prev, speed: data.value ?? null }));
                        }

                        if (sub === "0142") {
                            setMetrics((prev) => ({ ...prev, voltage: data.value ?? null }));
                        }

                        if (sub === "0105") {
                            setMetrics((prev) => ({ ...prev, coolant: data.value ?? null }));
                        }
                    }

                    if (section === "dtc") {
                        if (sub === "full") {
                            const stored = data.stored?.dtcs?.length || 0;
                            const pending = data.pending?.dtcs?.length || 0;
                            const permanent = data.permanent?.dtcs?.length || 0;
                            setDtcCount(stored + pending + permanent);
                        } else if (Array.isArray(data.dtcs)) {
                            setDtcCount((prev) => Math.max(prev, data.dtcs.length));
                        }
                    }

                    if (section === "discovery") {
                        setLastRaw(prettyJson(data));
                    }
                };

                client.on("message", onMessage);

                return () => {
                    try {
                        client.off?.("message", onMessage);
                        client.unsubscribe?.(topics);
                    } catch { }
                };
            } catch (error) {
                console.log("MQTT Home subscribe error:", error);
            }
        };

        let cleanup: any;

        setupMqttListener().then((fn) => {
            cleanup = fn;
        });

        return () => {
            mounted = false;
            if (cleanup) cleanup();
        };
    }, []);

    const goToBluetooth = () => {
        router.push("/bluetooth-setup" as any);
    };

    const runMainVehicleAction = async () => {
        try {
            setIsChecking(true);
            setDebugText("");

            const connected = await elmBluetoothService.isActuallyConnected?.().catch(() => false);

            if (!connected) {
                setStatusText("غير متصل بالقطعة");
                router.push("/bluetooth-setup" as any);
                return;
            }

            setStatusText("جاري تشغيل/تحديث فحص تنبّه...");

            const result = vehicleScannerService.isAutoScanRunning()
                ? await vehicleScannerService.forceFullScanNow()
                : await vehicleScannerService.startAutoScan({ forceFull: true });

            setIsAutoRunning(true);

            const resultAny: any = result;

            const currentCarId =
                resultAny?.identity?.carId ||
                vehicleScannerService.getCachedCarId();

            setCarId(currentCarId || null);
            setVin(result?.identity?.vin || null);

            setLastRaw(prettyJson(result));
            setStatusText("تم تشغيل/تحديث الفحص والستريمنق");
            setDebugText(
                currentCarId
                    ? `البيانات تنعكس من MQTT تحت: Tnabbah/{userId}/${currentCarId}/#`
                    : "تم تشغيل العملية، وسيظهر carId بعد وصول بيانات MQTT."
            );

            // اتركي هذا المكان للفنكشن الثانية اللي بتربطينها لاحقًا
            // await yourSecondFunctionHere();
        } catch (error: any) {
            setStatusText("فشل تشغيل العملية");
            setDebugText(error?.message || "ما قدرنا نشغل العملية.");
            Alert.alert("خطأ", error?.message || "ما قدرنا نشغل العملية.");
        } finally {
            setIsChecking(false);
        }
    };

    const stopAutoScan = async () => {
        await vehicleScannerService.stopAutoScan();
        setIsAutoRunning(false);
        setStatusText("تم إيقاف الستريمنق");
        setDebugText("تم إيقاف الفحص التلقائي والستريمنق.");
    };

    const vehicleHealthLabel = !isConnected
        ? "غير متصلة"
        : dtcCount > 0
            ? "تحتاج فحص"
            : isAutoRunning
                ? "تحت المراقبة"
                : "جاهزة";

    const vehicleHealthColor = !isConnected
        ? COLORS.danger
        : dtcCount > 0
            ? COLORS.warning
            : COLORS.success;

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isWide && styles.scrollContentWide,
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.header, isWide && styles.headerWide]}>
                    <View style={styles.headerTextBox}>
                        <Text style={styles.helloText}>أهلًا في تنبّهـ</Text>
                        <Text style={styles.headerTitle}>سيارتك تتكلم، ونحن نترجمها لك</Text>
                    </View>

                    <View
                        style={[
                            styles.connectionBadge,
                            isConnected ? styles.connectedBadge : styles.disconnectedBadge,
                        ]}
                    >
                        <View
                            style={[
                                styles.connectionDot,
                                {
                                    backgroundColor: isConnected ? COLORS.success : COLORS.danger,
                                },
                            ]}
                        />

                        <Text
                            style={[
                                styles.connectionText,
                                { color: isConnected ? COLORS.success : COLORS.danger },
                            ]}
                        >
                            {isConnected ? "متصل" : "غير متصل"}
                        </Text>
                    </View>
                </View>

                <LinearGradient
                    colors={["#FFFFFF", "#FFF7F7"]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={[styles.heroCard, isWide && styles.heroCardWide]}
                >
                    <View style={styles.heroIconCircle}>
                        <MaterialCommunityIcons
                            name="car-connected"
                            size={46}
                            color={COLORS.primary}
                        />
                    </View>

                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>فحص تنبّه</Text>
                        <Text style={styles.heroSubtitle}>
                            نعرض حالة السيارة من MQTT، والزر يشغل أو يحدث عملية الفحص والستريمنق.
                        </Text>
                    </View>

                    <View style={styles.healthBadge}>
                        <View style={[styles.connectionDot, { backgroundColor: vehicleHealthColor }]} />
                        <Text style={[styles.healthText, { color: vehicleHealthColor }]}>
                            حالة السيارة: {vehicleHealthLabel}
                        </Text>
                    </View>

                    <View style={styles.heroButtons}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.mainButton,
                                pressed && { opacity: 0.9 },
                                isChecking && { opacity: 0.65 },
                            ]}
                            onPress={runMainVehicleAction}
                            disabled={isChecking}
                        >
                            <LinearGradient
                                colors={[COLORS.primaryLight, COLORS.primaryDark]}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                                style={styles.mainButtonGradient}
                            >
                                {isChecking ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Feather
                                            name={isConnected ? "radio" : "bluetooth"}
                                            size={18}
                                            color="#FFFFFF"
                                        />
                                        <Text style={styles.mainButtonText}>
                                            {!isConnected
                                                ? "ربط قطعة OBD"
                                                : isAutoRunning
                                                    ? "تحديث الفحص"
                                                    : "ابدأ الفحص"}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>

                        {isAutoRunning && (
                            <Pressable
                                style={styles.stopButton}
                                onPress={stopAutoScan}
                                disabled={isChecking}
                            >
                                <Feather name="square" size={16} color={COLORS.danger} />
                                <Text style={styles.stopButtonText}>إيقاف الستريمنق</Text>
                            </Pressable>
                        )}

                        <Pressable style={styles.debugButton} onPress={goToBluetooth}>
                            <Feather name="bluetooth" size={16} color={COLORS.primary} />
                            <Text style={styles.debugButtonText}>إعدادات البلوتوث</Text>
                        </Pressable>
                    </View>
                </LinearGradient>

                <Text style={styles.sectionTitle}>قراءات السيارة من MQTT</Text>

                <View style={styles.metricsGrid}>
                    <MetricCard width={metricWidth} icon="activity" label="RPM" value={safeValue(metrics.rpm)} unit="دورة/دقيقة" />
                    <MetricCard width={metricWidth} icon="navigation" label="السرعة" value={safeValue(metrics.speed)} unit="كم/س" />
                    <MetricCard width={metricWidth} icon="battery" label="الفولت" value={safeValue(metrics.voltage)} unit="V" />
                    <MetricCard width={metricWidth} icon="thermometer" label="حرارة المحرك" value={safeValue(metrics.coolant)} unit="°C" />
                </View>

                <Text style={styles.sectionTitle}>ملخص السيارة</Text>

                <View style={styles.metricsGrid}>
                    <MetricCard width={metricWidth} icon="hash" label="Car ID" value={carId ? "موجود" : "--"} unit={carId || "بانتظار MQTT"} />
                    <MetricCard width={metricWidth} icon="file-text" label="VIN" value={vin ? "موجود" : "--"} unit={vin || "Mode 09"} />
                    <MetricCard width={metricWidth} icon="list" label="Supported" value={String(supportedCount)} unit="PID" />
                    <MetricCard width={metricWidth} icon="alert-triangle" label="DTC" value={String(dtcCount)} unit="أعطال" />
                </View>

                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <View style={styles.statusIconCircle}>
                            <Feather name="info" size={18} color={COLORS.primary} />
                        </View>

                        <Text style={styles.statusTitle}>حالة الفحص</Text>
                    </View>

                    <Text style={styles.statusDescription}>{statusText}</Text>

                    {!!debugText && <Text style={styles.debugText}>{debugText}</Text>}

                    {!!lastRaw && (
                        <View style={styles.rawBox}>
                            <Text style={styles.rawTitle}>MQTT / Scanner Response</Text>
                            <Text selectable style={styles.rawText}>
                                {lastRaw}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.tipCard}>
                    <View style={styles.tipIcon}>
                        <Feather name="wifi" size={18} color={COLORS.primary} />
                    </View>

                    <View style={styles.tipTextBox}>
                        <Text style={styles.tipTitle}>MQTT Live View</Text>
                        <Text style={styles.tipText}>
                            القيم المعروضة هنا تنعكس من MQTT. آخر قيمة تبقى ظاهرة حتى لو انقطعت القطعة، والحالة فقط تتحول إلى غير متصل.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function MetricCard({
    width,
    icon,
    label,
    value,
    unit,
}: {
    width: number;
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: string;
    unit: string;
}) {
    return (
        <View style={[styles.metricCard, { width }]}>
            <View style={styles.metricHeader}>
                <View style={styles.metricIconCircle}>
                    <Feather name={icon} size={18} color={COLORS.primary} />
                </View>

                <Text style={styles.metricLabel}>{label}</Text>
            </View>

            <Text style={styles.metricValue} numberOfLines={1}>
                {value}
            </Text>

            <Text style={styles.metricUnit} numberOfLines={2}>
                {unit}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    scrollView: { flex: 1, backgroundColor: COLORS.bg },
    scrollContent: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 130 },
    scrollContentWide: { paddingHorizontal: 26 },
    header: {
        width: "100%",
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 18,
    },
    headerWide: { alignSelf: "center", maxWidth: 980 },
    headerTextBox: { flex: 1, alignItems: "flex-end" },
    helloText: {
        fontSize: 13,
        color: COLORS.muted,
        fontWeight: "700",
        textAlign: "right",
    },
    headerTitle: {
        marginTop: 5,
        fontSize: 22,
        color: COLORS.text,
        fontWeight: "900",
        textAlign: "right",
        lineHeight: 31,
    },
    connectionBadge: {
        height: 38,
        borderRadius: 19,
        paddingHorizontal: 13,
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 7,
        borderWidth: 1,
    },
    connectedBadge: { backgroundColor: "#EFFAF3", borderColor: "#D6F0DF" },
    disconnectedBadge: { backgroundColor: "#FFF1F1", borderColor: "#FFD9D9" },
    connectionDot: { width: 8, height: 8, borderRadius: 4 },
    connectionText: { fontSize: 12, fontWeight: "900" },
    heroCard: {
        width: "100%",
        borderRadius: 28,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 20,
        paddingVertical: 24,
        alignItems: "center",
        shadowColor: "#5F130F",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 3,
    },
    heroCardWide: { maxWidth: 980, alignSelf: "center" },
    heroIconCircle: {
        width: 76,
        height: 76,
        borderRadius: 26,
        backgroundColor: COLORS.softRed,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },
    heroContent: { alignItems: "center", maxWidth: 460 },
    heroTitle: {
        fontSize: 21,
        fontWeight: "900",
        color: COLORS.text,
        textAlign: "center",
    },
    heroSubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.muted,
        fontWeight: "600",
        textAlign: "center",
        lineHeight: 24,
    },
    healthBadge: {
        marginTop: 14,
        borderRadius: 19,
        paddingHorizontal: 13,
        height: 38,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 7,
    },
    healthText: {
        fontSize: 12,
        fontWeight: "900",
    },
    heroButtons: { width: "100%", alignItems: "center", marginTop: 18 },
    mainButton: {
        width: "100%",
        maxWidth: 260,
        height: 56,
        borderRadius: 28,
        overflow: "hidden",
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
        elevation: 4,
    },
    mainButtonGradient: {
        flex: 1,
        borderRadius: 28,
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    mainButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
    debugButton: {
        marginTop: 10,
        height: 42,
        borderRadius: 21,
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#F1E0E0",
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },
    debugButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: "900" },
    stopButton: {
        marginTop: 10,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 18,
        backgroundColor: "#FFF1F1",
        borderWidth: 1,
        borderColor: "#FFD9D9",
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },
    stopButtonText: {
        color: COLORS.danger,
        fontSize: 13,
        fontWeight: "900",
    },
    sectionTitle: {
        marginTop: 24,
        marginBottom: 12,
        fontSize: 15,
        fontWeight: "900",
        color: COLORS.text,
        textAlign: "right",
        alignSelf: "stretch",
    },
    metricsGrid: {
        width: "100%",
        flexDirection: "row-reverse",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
    },
    metricCard: {
        minHeight: 138,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.soft,
        paddingHorizontal: 14,
        paddingVertical: 14,
        justifyContent: "space-between",
    },
    metricHeader: {
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    metricIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    metricLabel: {
        flex: 1,
        fontSize: 13,
        color: COLORS.muted,
        fontWeight: "800",
        textAlign: "right",
    },
    metricValue: {
        marginTop: 10,
        fontSize: 30,
        color: COLORS.text,
        fontWeight: "900",
        textAlign: "right",
    },
    metricUnit: {
        fontSize: 12,
        color: COLORS.muted,
        fontWeight: "700",
        textAlign: "right",
    },
    statusCard: {
        marginTop: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        padding: 16,
    },
    statusHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
    statusIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 14,
        backgroundColor: COLORS.softRed,
        alignItems: "center",
        justifyContent: "center",
    },
    statusTitle: { fontSize: 15, fontWeight: "900", color: COLORS.text },
    statusDescription: {
        marginTop: 10,
        fontSize: 13,
        color: COLORS.muted,
        fontWeight: "700",
        textAlign: "right",
        lineHeight: 22,
    },
    debugText: {
        marginTop: 8,
        fontSize: 12,
        color: COLORS.warning,
        fontWeight: "800",
        textAlign: "right",
        lineHeight: 20,
    },
    rawBox: {
        marginTop: 12,
        borderRadius: 16,
        backgroundColor: COLORS.soft,
        padding: 12,
    },
    rawTitle: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: "900",
        textAlign: "right",
        marginBottom: 6,
    },
    rawText: {
        fontSize: 11,
        color: "#555555",
        fontWeight: "700",
        textAlign: "left",
        lineHeight: 18,
    },
    tipCard: {
        marginTop: 12,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#F1E0E0",
        backgroundColor: "#FFF8F8",
        padding: 14,
        flexDirection: "row-reverse",
        alignItems: "flex-start",
        gap: 10,
    },
    tipIcon: {
        width: 36,
        height: 36,
        borderRadius: 14,
        backgroundColor: "#F2D7DA",
        justifyContent: "center",
        alignItems: "center",
    },
    tipTextBox: { flex: 1, alignItems: "flex-end" },
    tipTitle: {
        fontSize: 14,
        fontWeight: "900",
        color: COLORS.text,
        textAlign: "right",
    },
    tipText: {
        marginTop: 5,
        fontSize: 12,
        color: COLORS.muted,
        fontWeight: "600",
        lineHeight: 20,
        textAlign: "right",
    },
});