import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAppSettings } from "../../providers/AppSettingsProvider";
import { useCars } from "../../providers/CarsProvider";
import { useLanguage } from "../../providers/LanguageProvider";
import { useVehicleRealtime } from "../../providers/VehicleRealtimeProvider";

const FONT_REGULAR = "Alexandria-Regular";
const FONT_SEMIBOLD = "Alexandria-SemiBold";
const FONT_BOLD = "Alexandria-Bold";
const FONT_EXTRABOLD = "Alexandria-Bold";

const API_URL =
  process.env.EXPO_PUBLIC_DIAGNOSTICS_API || "http://207.180.244.27:8001";

const CORTEX_URL =
  process.env.EXPO_PUBLIC_CORTEX_API || "http://207.180.244.27:3101";

const FLOATING_ASSISTANT_POSITION_KEY = "home_ai_assistant_position";
const FLOATING_ASSISTANT_WIDTH = 78;
const FLOATING_ASSISTANT_HEIGHT = 78;
const FLOATING_ASSISTANT_MARGIN = 18;
const CHATBOT_ASSISTANT_ICON = require("../../assets/images/chatbot-ai-white.png");
const LOGO_ARABIC_LIGHT = require("../../assets/images/logo-arabic-light.png");
const LOGO_ENGLISH_LIGHT = require("../../assets/images/logo-english-light.png");
const LOGO_ARABIC_DARK = require("../../assets/images/logo-arabic-dark.png");
const LOGO_ENGLISH_DARK = require("../../assets/images/logo-english-dark.png");
const SCAN_CAR_IMAGE = require("../../assets/images/scan-car-top.png");

const { width: SCAN_SCREEN_WIDTH, height: SCAN_SCREEN_HEIGHT } =
  Dimensions.get("window");
const SCAN_PROGRESS_CAP_BEFORE_RESPONSE = 92;
const SCAN_PROGRESS_TICK_MS = 260;
const SCAN_PROGRESS_ESTIMATED_SECONDS = 38;

const LIGHT_COLORS = {
  primary: "#871B17",
  primaryLight: "#9A211C",
  primaryDark: "#761713",
  buttonGradientStart: "#9A211C",
  buttonGradientEnd: "#761713",
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
  modalOverlay: "rgba(0, 0, 0, 0.40)",
  notificationUnreadBg: "#FFF8F8",
  floatingBg: "#871B17",
  floatingIcon: "#FFFFFF",
  floatingBorder: "rgba(255,255,255,0.82)",
  floatingTitle: "#FFFFFF",
  floatingSubtitle: "rgba(255,255,255,0.86)",
  floatingIconBg: "rgba(255,255,255,0.18)",
  floatingGlow: "rgba(135,27,23,0.24)",
  floatingGlowBorder: "rgba(135,27,23,0.32)",
  floatingMarkBg: "rgba(255,255,255,0.18)",
  floatingTypingBg: "#FFFFFF",
  floatingTypingBorder: "rgba(135,27,23,0.24)",
  floatingTypingDot: "#871B17",
  connectedBg: "#EFFAF3",
  connectedBorder: "#D6F0DF",
  disconnectedBg: "#FFF1F1",
  disconnectedBorder: "#FFD9D9",
  rawText: "#555555",
  accentBorder: "rgba(135,27,23,0.20)",
};

const DARK_COLORS = {
  primary: "#B63A34",
  primaryLight: "#B63A34",
  primaryDark: "#871B17",
  buttonGradientStart: "#B63A34",
  buttonGradientEnd: "#871B17",
  bg: "#151515",
  surface: "#202020",
  soft: "#292929",
  softRed: "rgba(182,58,52,0.16)",
  border: "#383838",
  text: "#FFFFFF",
  muted: "#C7C7C7",
  danger: "#B63A34",
  warning: "#F0B45B",
  success: "#66BB6A",
  modalOverlay: "rgba(0, 0, 0, 0.62)",
  notificationUnreadBg: "rgba(182,58,52,0.14)",
  floatingBg: "#B63A34",
  floatingIcon: "#FFFFFF",
  floatingBorder: "rgba(255,255,255,0.30)",
  floatingTitle: "#FFFFFF",
  floatingSubtitle: "rgba(255,255,255,0.90)",
  floatingIconBg: "rgba(255,255,255,0.20)",
  floatingGlow: "rgba(182,58,52,0.30)",
  floatingGlowBorder: "rgba(182,58,52,0.34)",
  floatingMarkBg: "rgba(255,255,255,0.18)",
  floatingTypingBg: "#2A2A2A",
  floatingTypingBorder: "rgba(182,58,52,0.40)",
  floatingTypingDot: "#B63A34",
  connectedBg: "rgba(46,125,50,0.18)",
  connectedBorder: "rgba(102,187,106,0.22)",
  disconnectedBg: "rgba(182,58,52,0.12)",
  disconnectedBorder: "rgba(182,58,52,0.32)",
  rawText: "#D7D7D7",
  accentBorder: "rgba(182,58,52,0.28)",
};

/* type MetricState = {
    rpm: number | string | null;
    speed: number | string | null;
    voltage: number | string | null;
    coolant: number | string | null;
};
 */
type HomeAiState = {
  status: "safe" | "watch" | "urgent";
  title: string;
  message: string;
  score: number;
  action: string;
  alertsCount: number;
} | null;

type InAppNotificationState = {
  id: string;
  title: string;
  body: string;
} | null;

function safeValue(value: any) {
  if (value === null || value === undefined || value === "") return "--";
  return String(value);
}

function formatLastScan(value: string | null, isArabic: boolean) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  const locale = isArabic ? "ar-SA" : "en-US";

  const datePart = date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  });

  const timePart = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart}\n${timePart}`;
}

/* function prettyJson(value: unknown) {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
} */

/* function getPayloadData(message: Buffer) {
    try {
        const parsed = JSON.parse(message.toString());
        return parsed?.data ?? parsed;
    } catch {
        return null;
    }
} */

function getUserDisplayName(user: any) {
  const metadata = user?.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.name ||
    metadata.username ||
    user?.email?.split("@")?.[0] ||
    "";

  return String(name).trim();
}

type JsonXhrResult = {
  status: number;
  ok: boolean;
  raw: string;
  data: any;
};

function requestJsonWithXhr({
  url,
  method = "GET",
  headers = {},
  body,
  timeoutMs = 45000,
}: {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}): Promise<JsonXhrResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.timeout = timeoutMs;

    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim()) {
        xhr.setRequestHeader(key, value);
      }
    });

    xhr.onload = () => {
      const raw = xhr.responseText || "";
      let data: any = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = raw;
      }

      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        raw,
        data,
      });
    };

    xhr.onerror = () => {
      reject(new Error(`Network request failed. Could not reach ${url}`));
    };

    xhr.ontimeout = () => {
      reject(
        new Error(
          `Request timed out after ${Math.round(timeoutMs / 1000)} seconds`,
        ),
      );
    };

    xhr.send(body ?? null);
  });
}

export default function HomeScreen() {
  const { activeCarId, selectedCarId, connectedCarId, userCars, obdConnected } =
    useCars() as any;
  const { darkModeEnabled } = useAppSettings();
  const { t, isArabic } = useLanguage();

  const COLORS = darkModeEnabled ? DARK_COLORS : LIGHT_COLORS;

  const activeHomeCarId =
    connectedCarId || selectedCarId || activeCarId || null;
  const currentCar = Array.isArray(userCars)
    ? userCars.find(
        (car: any) =>
          car?.id === activeHomeCarId ||
          car?.car_id === activeHomeCarId ||
          car?.vehicle_id === activeHomeCarId,
      )
    : null;

  const currentCarName =
    currentCar?.display_name ||
    currentCar?.name ||
    currentCar?.car_name ||
    activeHomeCarId ||
    (isArabic ? "لا توجد سيارة" : "No car selected");

  const isCarConnected = !!connectedCarId || !!obdConnected;

  const styles = useMemo(
    () => createStyles(COLORS, isArabic),
    [COLORS, isArabic],
  );

  const vehicleRealtime = useVehicleRealtime() as any;

  const metrics = vehicleRealtime?.metrics ?? {};
  const vin = vehicleRealtime?.vin ?? null;
  const dtcCount = vehicleRealtime?.dtcCount ?? 0;
  const supportedCount = vehicleRealtime?.supportedCount ?? 0;
  const lastRaw = vehicleRealtime?.lastRaw ?? "";
  const statusText = vehicleRealtime?.statusText ?? "";
  const isConnected = vehicleRealtime?.isConnected ?? false;
  const isAutoRunning = vehicleRealtime?.isAutoRunning ?? false;

  const { width, height } = useWindowDimensions();

  const clampFloatingPosition = (x: number, y: number) => {
    const minX = FLOATING_ASSISTANT_MARGIN;
    const maxX = Math.max(
      FLOATING_ASSISTANT_MARGIN,
      width - FLOATING_ASSISTANT_WIDTH - FLOATING_ASSISTANT_MARGIN,
    );

    const minY = Platform.OS === "ios" ? 82 : 72;
    const bottomSafe = Platform.OS === "ios" ? 106 : 78;
    const maxY = Math.max(
      minY,
      height - FLOATING_ASSISTANT_HEIGHT - bottomSafe,
    );

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

  const defaultFloatingPosition = clampFloatingPosition(
    width - FLOATING_ASSISTANT_WIDTH - FLOATING_ASSISTANT_MARGIN,
    height - FLOATING_ASSISTANT_HEIGHT - (Platform.OS === "ios" ? 116 : 86),
  );

  const floatingPosition = useRef(
    new Animated.ValueXY(defaultFloatingPosition),
  ).current;

  const floatingLastPositionRef = useRef(defaultFloatingPosition);
  const floatingMovedRef = useRef(false);

  const typingDotOne = useRef(new Animated.Value(0.35)).current;
  const typingDotTwo = useRef(new Animated.Value(0.35)).current;
  const typingDotThree = useRef(new Animated.Value(0.35)).current;

  const isLandscape = width > height;
  const isWide = width >= 760 || isLandscape;
  const columns = isWide ? 4 : 2;

  const [userName, setUserName] = useState("");
  const [homeAi, setHomeAi] = useState<HomeAiState>(null);
  const homeStatusSignatureRef = useRef<string | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [carId, setCarId] = useState<string | null>(null);

  const [lastScanAt, setLastScanAt] = useState<string | null>(null);

  const [debugText, setDebugText] = useState("");
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<
    {
      id: string;
      title: string;
      body: string;
      title_ar?: string | null;
      body_ar?: string | null;
      title_en?: string | null;
      body_en?: string | null;
      is_read: boolean;
      created_at: string;
    }[]
  >([]);
  const [pendingNotificationActionIds, setPendingNotificationActionIds] =
    useState<Set<string>>(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [inAppNotification, setInAppNotification] =
    useState<InAppNotificationState>(null);

  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const firstNotificationsLoadRef = useRef(true);

  const activeCarIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeCarIdRef.current = activeCarId || null;
  }, [activeCarId]);

  const metricWidth = useMemo(() => {
    const pagePadding = isWide ? 52 : 36;
    const totalGap = 10 * (columns - 1);
    return (width - pagePadding - totalGap) / columns;
  }, [width, columns, isWide]);

  useEffect(() => {
    const createDotAnimation = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.delay(420),
        ]),
      );

    const dotOneAnimation = createDotAnimation(typingDotOne, 0);
    const dotTwoAnimation = createDotAnimation(typingDotTwo, 120);
    const dotThreeAnimation = createDotAnimation(typingDotThree, 240);

    dotOneAnimation.start();
    dotTwoAnimation.start();
    dotThreeAnimation.start();

    return () => {
      dotOneAnimation.stop();
      dotTwoAnimation.stop();
      dotThreeAnimation.stop();
    };
  }, [typingDotOne, typingDotTwo, typingDotThree]);

  useEffect(() => {
    let mounted = true;

    const loadFloatingAssistantPosition = async () => {
      try {
        const savedPosition = await AsyncStorage.getItem(
          FLOATING_ASSISTANT_POSITION_KEY,
        );

        if (!mounted || !savedPosition) return;

        const parsed = JSON.parse(savedPosition);
        const nextPosition = clampFloatingPosition(
          Number(parsed?.x) || defaultFloatingPosition.x,
          Number(parsed?.y) || defaultFloatingPosition.y,
        );

        floatingLastPositionRef.current = nextPosition;
        floatingPosition.setValue(nextPosition);
      } catch (error) {
        console.log("Load assistant position error:", error);
        floatingLastPositionRef.current = defaultFloatingPosition;
        floatingPosition.setValue(defaultFloatingPosition);
      }
    };

    loadFloatingAssistantPosition();

    return () => {
      mounted = false;
    };
  }, [width, height]);

  useEffect(() => {
    floatingPosition.stopAnimation((currentPosition: any) => {
      const nextPosition = clampFloatingPosition(
        currentPosition?.x ?? defaultFloatingPosition.x,
        currentPosition?.y ?? defaultFloatingPosition.y,
      );

      floatingLastPositionRef.current = nextPosition;
      floatingPosition.setValue(nextPosition);
    });
  }, [width, height]);

  const assistantPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        floatingMovedRef.current = false;

        floatingPosition.stopAnimation((currentPosition: any) => {
          floatingLastPositionRef.current = {
            x: currentPosition?.x ?? defaultFloatingPosition.x,
            y: currentPosition?.y ?? defaultFloatingPosition.y,
          };
        });
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3) {
          floatingMovedRef.current = true;
        }

        const nextPosition = clampFloatingPosition(
          floatingLastPositionRef.current.x + gestureState.dx,
          floatingLastPositionRef.current.y + gestureState.dy,
        );

        floatingPosition.setValue(nextPosition);
      },
      onPanResponderRelease: async (_, gestureState) => {
        const wasTap =
          Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6;

        if (wasTap) {
          floatingMovedRef.current = false;
          router.push({
            pathname: "/chatbot",
          });
          return;
        }

        const nextPosition = clampFloatingPosition(
          floatingLastPositionRef.current.x + gestureState.dx,
          floatingLastPositionRef.current.y + gestureState.dy,
        );

        floatingLastPositionRef.current = nextPosition;

        Animated.spring(floatingPosition, {
          toValue: nextPosition,
          useNativeDriver: false,
          friction: 8,
          tension: 80,
        }).start();

        try {
          await AsyncStorage.setItem(
            FLOATING_ASSISTANT_POSITION_KEY,
            JSON.stringify(nextPosition),
          );
        } catch (error) {
          console.log("Save assistant position error:", error);
        }

        setTimeout(() => {
          floatingMovedRef.current = false;
        }, 80);
      },
      onPanResponderTerminate: () => {
        Animated.spring(floatingPosition, {
          toValue: floatingLastPositionRef.current,
          useNativeDriver: false,
          friction: 8,
          tension: 80,
        }).start();

        setTimeout(() => {
          floatingMovedRef.current = false;
        }, 80);
      },
    }),
  ).current;

  const blockHorizontalSwipeResponder = useRef(
    PanResponder.create({
      // نترك السحب الأفقي للمساعد العائم بدون اعتراض.
      // تعطيل gesture في Stack يكفي لمنع الرجوع بالغلط.
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onShouldBlockNativeResponder: () => false,
      onPanResponderTerminationRequest: () => true,
      onPanResponderMove: () => {},
      onPanResponderRelease: () => {},
      onPanResponderTerminate: () => {},
    }),
  ).current;

  useEffect(() => {
    const loadUserName = async () => {
      const { data } = await supabase.auth.getUser();
      const displayName = getUserDisplayName(data.user);
      setUserName(displayName);
    };

    loadUserName();
  }, []);

  useEffect(() => {
    setCarId(activeCarId || null);

    /* 
                setMetrics({
                    rpm: null,
                    speed: null,
                    voltage: null,
                    coolant: null,
                });
        
                setVin(null);
                setSupportedCount(0);
                setDtcCount(0);
                setLastRaw("");
                setHomeAi(null); */
  }, [activeCarId]);

  useEffect(() => {
    const source = Image.resolveAssetSource(SCAN_CAR_IMAGE);

    if (source?.uri) {
      Image.prefetch(source.uri).catch(() => {
        // الصورة محلية، ولو فشل التحميل المسبق لا نعطل الهوم.
      });
    }
  }, []);

  useEffect(() => {
    if (!isChecking) {
      setScanProgress(0);
      return;
    }

    setScanProgress(7);
    const startedAt = Date.now();

    const progressInterval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const normalized = Math.min(
        elapsedSeconds / SCAN_PROGRESS_ESTIMATED_SECONDS,
        1,
      );
      const eased =
        Math.pow(normalized, 0.72) * SCAN_PROGRESS_CAP_BEFORE_RESPONSE;

      setScanProgress((current) => {
        if (current >= SCAN_PROGRESS_CAP_BEFORE_RESPONSE) return current;
        return Math.max(
          current,
          Math.min(eased, SCAN_PROGRESS_CAP_BEFORE_RESPONSE),
        );
      });
    }, SCAN_PROGRESS_TICK_MS);

    return () => clearInterval(progressInterval);
  }, [isChecking]);

  useEffect(() => {
    const loadLastScan = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (!userId) return;

      const { data } = await supabase
        .from("reports")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLastScanAt(data?.created_at || null);
    };

    loadLastScan();
  }, [activeCarId]);

  /* useEffect(() => {
        const update = async () => {
            const connected = await elmBluetoothService
                .isActuallyConnected?.()
                .catch(() => false);

            setIsConnected(!!connected);
            setIsAutoRunning(vehicleScannerService.isAutoScanRunning());

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
    }, []); */

  /* useEffect(() => {
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

                    setDebugText(`MQTT وصل: ${topic}`);


                    if (!incomingCarId) return;

                    const currentActiveCarId = activeCarIdRef.current;

                    if (
                        currentActiveCarId &&
                        incomingCarId &&
                        incomingCarId !== currentActiveCarId
                    ) {
                        return;
                    }

                    if (section === "status") {
                        setStatusText(
                            data.status === "disconnected"
                                ? "القطعة غير متصلة"
                                : data.status || "تم تحديث الحالة",
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
 */
  useEffect(() => {
    let mounted = true;

    const loadHomeAi = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;

        if (!userId || !carId) return;

        const res = await fetch(`${CORTEX_URL}/cortex/${userId}/${carId}/home`);
        if (!res.ok) {
          setDebugText(`Cortex HTTP ${res.status}`);
          return;
        }

        const json = await res.json();

        if (mounted) {
          const nextSignature = [
            json.status,
            json.level,
            json.mainIssue?.type || "",
            json.mainIssue?.code || "",
          ].join("|");

          setHomeAi((prev) => {
            if (prev && homeStatusSignatureRef.current === nextSignature) {
              return {
                ...json,
                title: prev.title,
                message: prev.message,
                action: prev.action,
              };
            }

            homeStatusSignatureRef.current = nextSignature;
            return json;
          });
        }
      } catch (e: any) {
        setDebugText(e?.message || "فشل الاتصال مع Cortex");
      }
    };

    loadHomeAi();

    const interval = setInterval(loadHomeAi, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [carId]);

  const getNotificationTitle = (item: {
    title?: string | null;
    title_ar?: string | null;
    title_en?: string | null;
  }) => {
    if (isArabic) {
      return item.title_ar || item.title || item.title_en || "";
    }

    return item.title_en || item.title || item.title_ar || "";
  };

  const getNotificationBody = (item: {
    body?: string | null;
    body_ar?: string | null;
    body_en?: string | null;
  }) => {
    if (isArabic) {
      return item.body_ar || item.body || item.body_en || "";
    }

    return item.body_en || item.body || item.body_ar || "";
  };

  const showAppleInAppNotification = (notification: {
    id: string;
    title: string;
    body: string;
  }) => {
    setInAppNotification(notification);

    setTimeout(() => {
      setInAppNotification((current) =>
        current?.id === notification.id ? null : current,
      );
    }, 4500);
  };

  const showDeviceNotificationForAndroid = async (notification: {
    title: string;
    body: string;
  }) => {
    try {
      if (Platform.OS !== "android") return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.log("Android local notification error:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;

        if (!userId) return;

        let { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        // احتياط: لو الأعمدة الجديدة ما انضافت في Supabase لسه، لا يتعطل الهوم.
        if (error) {
          const fallback = await supabase
            .from("notifications")
            .select("id, title, body, is_read, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20);

          data = fallback.data;
          error = fallback.error;
        }

        if (error) throw error;

        if (!mounted) return;

        const mapped = (data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          title_ar: item.title_ar ?? null,
          body_ar: item.body_ar ?? null,
          title_en: item.title_en ?? null,
          body_en: item.body_en ?? null,
          is_read: item.is_read,
          created_at: item.created_at,
        }));

        const unreadNotifications = mapped.filter((item) => !item.is_read);
        const newestUnread = unreadNotifications.find(
          (item) => !seenNotificationIdsRef.current.has(item.id),
        );

        setNotificationsList(mapped);
        setNotificationsCount(unreadNotifications.length);

        mapped.forEach((item) => {
          seenNotificationIdsRef.current.add(item.id);
        });

        if (firstNotificationsLoadRef.current) {
          firstNotificationsLoadRef.current = false;
          return;
        }

        if (newestUnread) {
          showAppleInAppNotification({
            id: newestUnread.id,
            title: getNotificationTitle(newestUnread),
            body: getNotificationBody(newestUnread),
          });

          showDeviceNotificationForAndroid({
            title: getNotificationTitle(newestUnread),
            body: getNotificationBody(newestUnread),
          });
        }
      } catch (error) {
        console.log("Load notifications error:", error);
      }
    };

    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const performDirectScan = async () => {
    setIsChecking(true);
    setDebugText("");

    try {
      const { data: authData, error: userError } =
        await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (userError || !userId) {
        Alert.alert(t.errorTitle, t.homeLoginRequiredScan);
        return;
      }

      let token: string | null = null;

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      token = sessionData?.session?.access_token ?? null;

      if (sessionError || !token) {
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.log(
            "🔴 Supabase refreshSession error:",
            refreshError.message,
          );
        }

        token = refreshData?.session?.access_token ?? token;
      }

      if (!token) {
        const message = isArabic
          ? "انتهت جلسة تسجيل الدخول. سجّلي الدخول مرة أخرى ثم أعيدي الفحص."
          : "Your login session expired. Please log in again, then retry the scan.";

        setDebugText(message);
        Alert.alert(t.errorTitle, message);
        return;
      }

      const scannedCarId = activeCarId || carId;

      if (!scannedCarId) {
        Alert.alert(t.homeAlertTitle, t.homeSelectCarFirst);
        return;
      }

      const requestUrl = `${API_URL}/api/scan-from-mqtt`;
      const requestBody = {
        user_id: userId,
        car_id: scannedCarId,
        freshness_seconds: 120,
        wait_ms: 0,
        vehicle_info: null,
      };

      console.log("🔵 Sending scan request to:", requestUrl);
      console.log("📤 Request body:", requestBody);
      console.log(
        "🔐 Authorization token:",
        `Present (${token.substring(0, 20)}...)`,
      );
      console.log("📏 Token length:", token.length);

      const result = await requestJsonWithXhr({
        url: requestUrl,
        method: "POST",
        timeoutMs: 45000,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Scan response:", {
        status: result.status,
        ok: result.ok,
        raw: typeof result.raw === "string" ? result.raw.slice(0, 300) : "",
      });

      if (!result.ok) {
        const errBody = result.data;

        const detail =
          typeof errBody?.detail === "string"
            ? errBody.detail
            : typeof errBody?.error === "string"
              ? errBody.error
              : typeof errBody?.message === "string"
                ? errBody.message
                : typeof errBody === "string" && errBody.trim()
                  ? errBody
                  : `HTTP ${result.status}`;

        throw new Error(detail);
      }

      const report = result.data;

      if (!report || typeof report !== "object") {
        throw new Error(
          isArabic
            ? "وصل رد غير واضح من خادم الفحص."
            : "The scan server returned an invalid response.",
        );
      }

      setLastScanAt(new Date().toISOString());
      console.log("✅ Scan report received:", report);

      router.push({
        pathname: "/report",
        params: { report: JSON.stringify(report) },
      });
    } catch (e: any) {
      const errorMsg =
        typeof e?.message === "string"
          ? e.message
          : JSON.stringify(e?.message || e || "خطأ غير متوقع");

      console.log("🔴 Scan error:", errorMsg);
      setDebugText(errorMsg);
      Alert.alert(t.errorTitle, errorMsg);
    } finally {
      setIsChecking(false);
    }
  };

  const setNotificationActionPending = (id: string, pending: boolean) => {
    setPendingNotificationActionIds((prev) => {
      const next = new Set(prev);

      if (pending) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  };

  const markNotificationAsRead = async (id: string) => {
    const currentItem = notificationsList.find((item) => item.id === id);

    if (
      !currentItem ||
      currentItem.is_read ||
      pendingNotificationActionIds.has(id)
    ) {
      return;
    }

    // تحديث فوري للواجهة قبل انتظار Supabase عشان ما يحس المستخدم بتأخير.
    setNotificationActionPending(id, true);
    setNotificationsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
    );
    setNotificationsCount((prev) => Math.max(prev - 1, 0));

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.log("Mark notification read error:", error);

      // لو فشل الحفظ في قاعدة البيانات نرجع الحالة مثل قبل.
      setNotificationsList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: false } : item,
        ),
      );
      setNotificationsCount((prev) => prev + 1);
    } finally {
      setNotificationActionPending(id, false);
    }
  };

  const deleteNotification = async (id: string) => {
    const currentItem = notificationsList.find((item) => item.id === id);

    if (!currentItem || pendingNotificationActionIds.has(id)) {
      return;
    }

    // حذف فوري من الواجهة قبل انتظار Supabase.
    setNotificationActionPending(id, true);
    setNotificationsList((prev) => prev.filter((item) => item.id !== id));

    if (!currentItem.is_read) {
      setNotificationsCount((prev) => Math.max(prev - 1, 0));
    }

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.log("Delete notification error:", error);

      // لو فشل الحذف نرجع الإشعار مكانه.
      setNotificationsList((prev) => {
        const exists = prev.some((item) => item.id === id);
        if (exists) return prev;

        return [currentItem, ...prev].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      });

      if (!currentItem.is_read) {
        setNotificationsCount((prev) => prev + 1);
      }
    } finally {
      setNotificationActionPending(id, false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
      {...blockHorizontalSwipeResponder.panHandlers}
    >
      {/* <LinearGradient
                colors={["#FFFFFF", "#F7F4F4", "#EFE7E7"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            /> */}

      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: COLORS.bg }]}
      />
      <Stack.Screen
        options={{
          gestureEnabled: false,
          fullScreenGestureEnabled: false,
          animation: "none",
        }}
      />
      <StatusBar
        barStyle={darkModeEnabled ? "light-content" : "dark-content"}
        backgroundColor={COLORS.bg}
      />

      {inAppNotification && (
        <Pressable
          style={styles.inAppNotificationCard}
          onPress={() => {
            setShowNotifications(true);
            setInAppNotification(null);
            markNotificationAsRead(inAppNotification.id);
          }}
        >
          <View style={styles.inAppNotificationIcon}>
            <Feather name="bell" size={18} color="#FFFFFF" />
          </View>

          <View style={styles.inAppNotificationTextBox}>
            <Text style={styles.inAppNotificationTitle} numberOfLines={1}>
              {inAppNotification.title}
            </Text>
            <Text style={styles.inAppNotificationBody} numberOfLines={2}>
              {inAppNotification.body}
            </Text>
          </View>

          <Pressable
            style={styles.inAppNotificationClose}
            onPress={() => setInAppNotification(null)}
          >
            <Feather name="x" size={17} color={COLORS.muted} />
          </Pressable>
        </Pressable>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isWide && styles.scrollContentWide,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"
        {...blockHorizontalSwipeResponder.panHandlers}
      >
        <View style={[styles.header, isWide && styles.headerWide]}>
          <Pressable
            onPress={() => setShowNotifications(true)}
            style={styles.notificationButton}
          >
            <Feather name="bell" size={22} color={COLORS.text} />

            {notificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationsCount > 9 ? "9+" : notificationsCount}
                </Text>
              </View>
            )}
          </Pressable>

          <View style={styles.headerMainGroup}>
            <View style={styles.headerLogoMark}>
              <Image
                source={darkModeEnabled ? LOGO_ARABIC_DARK : LOGO_ARABIC_LIGHT}
                style={styles.headerLogoArabic}
                resizeMode="contain"
              />

              <View style={styles.headerLogoLine} />

              <Image
                source={
                  darkModeEnabled ? LOGO_ENGLISH_DARK : LOGO_ENGLISH_LIGHT
                }
                style={styles.headerLogoEnglish}
                resizeMode="contain"
              />
            </View>

            <View style={styles.headerTextBox}>
              <Text style={styles.helloText} numberOfLines={1}>
                {userName
                  ? `${t.homeGreeting}${isArabic ? " " : ", "}${userName}`
                  : t.homeGreeting}
              </Text>

              <Text style={styles.headerTitle} numberOfLines={1}>
                {t.homeSubtitle}
              </Text>
            </View>
          </View>
        </View>

        <Modal
          visible={showNotifications}
          transparent={true}
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.notificationsTitle}>
                  {t.homeNotificationsTitle}
                </Text>

                <Pressable
                  style={styles.closeButton}
                  hitSlop={10}
                  onPress={() => setShowNotifications(false)}
                >
                  <Feather name="x" size={20} color={COLORS.text} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={true}
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="always"
                scrollEventThrottle={16}
                decelerationRate="fast"
                bounces={false}
                overScrollMode="never"
                directionalLockEnabled
              >
                {notificationsList.length === 0 ? (
                  <Text style={styles.emptyNotificationText}>
                    {t.homeNoNotifications}
                  </Text>
                ) : (
                  notificationsList.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.notificationItem,
                        !item.is_read && styles.notificationItemUnread,
                      ]}
                    >
                      <View style={styles.notificationTopRow}>
                        {!item.is_read && <View style={styles.unreadDot} />}

                        <Text
                          style={styles.notificationTitleText}
                          numberOfLines={2}
                        >
                          {getNotificationTitle(item)}
                        </Text>
                      </View>

                      <Text style={styles.notificationText} numberOfLines={3}>
                        {getNotificationBody(item)}
                      </Text>

                      <View style={styles.notificationActions}>
                        {!item.is_read && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.readButton,
                              (pressed ||
                                pendingNotificationActionIds.has(item.id)) &&
                                styles.notificationActionPressed,
                            ]}
                            hitSlop={12}
                            android_ripple={{ color: COLORS.soft }}
                            disabled={pendingNotificationActionIds.has(item.id)}
                            onPress={() => markNotificationAsRead(item.id)}
                          >
                            <Text style={styles.readButtonText}>
                              {t.homeMarkAsRead}
                            </Text>
                          </Pressable>
                        )}

                        <Pressable
                          style={({ pressed }) => [
                            styles.deleteButton,
                            (pressed ||
                              pendingNotificationActionIds.has(item.id)) &&
                              styles.notificationActionPressed,
                          ]}
                          hitSlop={12}
                          android_ripple={{ color: COLORS.soft }}
                          disabled={pendingNotificationActionIds.has(item.id)}
                          onPress={() => deleteNotification(item.id)}
                        >
                          <Text style={styles.deleteButtonText}>
                            {t.homeDeleteNotification}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={[styles.myCarCard, isWide && styles.myCarCardWide]}>
          <View style={styles.myCarMainRow}>
            <View style={styles.myCarTextBlock}>
              <Text style={styles.myCarLabel}>
                {isArabic ? "سيارتي" : "My Car"}
              </Text>

              <View style={styles.carNameGlassBox}>
                <Text
                  style={styles.carNameText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {currentCarName}
                </Text>
              </View>

              <View style={styles.carConnectionPill}>
                <View
                  style={[
                    styles.carConnectionDot,
                    {
                      backgroundColor: isCarConnected
                        ? COLORS.success
                        : COLORS.danger,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.carConnectionText,
                    { color: isCarConnected ? COLORS.success : COLORS.danger },
                  ]}
                >
                  {isCarConnected ? t.connected : t.disconnected}
                </Text>
              </View>
            </View>

          </View>
        </View>

        <View style={[styles.heroCard, isWide && styles.heroCardWide]}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{t.homeScanTitle}</Text>
            
          </View>

          {homeAi && (
            <View style={styles.aiHomeBox}>
              <Text style={styles.aiHomeMessage}>{homeAi.message}</Text>
            </View>
          )}

          <View style={styles.heroButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.mainButton,
                pressed && { opacity: 0.9 },
                isChecking && { opacity: 0.65 },
              ]}
              onPress={performDirectScan}
              disabled={isChecking}
            >
              <LinearGradient
                colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.mainButtonGradient}
              >
                <View pointerEvents="none" style={styles.mainButtonGlassTop} />

                {isChecking ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="car-search-outline"
                      size={23}
                      color="#FFFFFF"
                    />
                    <Text style={styles.mainButtonText}>
                      {t.homeCreateReport}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <View
          style={[styles.quickSummaryRow, isWide && styles.quickSummaryRowWide]}
        >
          <QuickSummaryCard
            styles={styles}
            COLORS={COLORS}
            iconPack="material"
            icon="car-info"
            title={isArabic ? "صحة السيارة" : "Vehicle Health"}
            value={
              homeAi?.status === "urgent"
                ? isArabic
                  ? "حرجة"
                  : "Urgent"
                : homeAi?.status === "watch"
                  ? isArabic
                    ? "تحتاج متابعة"
                    : "Needs Watch"
                  : obdConnected
                    ? isArabic
                      ? "مطمئنة"
                      : "Healthy"
                    : isArabic
                      ? "بانتظار الاتصال"
                      : "Waiting"
            }
            subtitle={
              obdConnected
                ? statusText ||
                  (isArabic ? "آخر قراءة من السيارة" : "Latest vehicle reading")
                : isArabic
                  ? "وصّلي القطعة لقراءة الحالة"
                  : "Connect the device to read status"
            }
          />

          <QuickSummaryCard
            styles={styles}
            COLORS={COLORS}
            iconPack="material"
            icon="clipboard-clock-outline"
            title={isArabic ? "آخر فحص" : "Last Scan"}
            value={formatLastScan(lastScanAt, isArabic)}
            subtitle={
              lastScanAt
                ? isArabic
                  ? "آخر تقرير"
                  : "Latest report"
                : isArabic
                  ? "لم يتم إنشاء تقرير بعد"
                  : "No report yet"
            }
          />

          <QuickSummaryCard
            styles={styles}
            COLORS={COLORS}
            iconPack="feather"
            icon="alert-triangle"
            title={isArabic ? "الأعطال" : "Faults"}
            value={String(dtcCount ?? 0)}
            subtitle={
              isArabic ? "أكواد الأعطال المكتشفة" : "Detected fault codes"
            }
            danger={(dtcCount ?? 0) > 0}
          />
        </View>
        <View
          style={[styles.quickSummaryRow, isWide && styles.quickSummaryRowWide]}
        >
          <QuickSummaryCard
            styles={styles}
            COLORS={COLORS}
            icon="battery"
            title={isArabic ? "البطارية" : "Battery"}
            value={`${safeValue(metrics.voltage)} V`}
            subtitle={isArabic ? "جهد البطارية" : "Battery voltage"}
          />

          <QuickSummaryCard
            styles={styles}
            COLORS={COLORS}
            icon="activity"
            title={isArabic ? "دوران المحرك" : "RPM"}
            value={safeValue(metrics.rpm)}
            subtitle={isArabic ? "سرعة المحرك" : "Engine speed"}
          />

          <QuickSummaryCard
            styles={styles}
            COLORS={COLORS}
            icon="thermometer"
            title={isArabic ? "حرارة المحرك" : "Coolant"}
            value={`${safeValue(metrics.coolant)} °C`}
            subtitle={isArabic ? "درجة حرارة المحرك" : "Engine temperature"}
          />
        </View>

        {/* <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <View style={styles.statusIconCircle}>
                            <Feather name="info" size={18} color={COLORS.primary} />
                        </View>

                        <Text style={styles.statusTitle}>{t.homeScanStatus}</Text>
                    </View>

                    <Text style={styles.statusDescription}>{statusText}</Text>

                    {!!debugText && <Text style={styles.debugText}>{debugText}</Text>}

                    {!!lastRaw && (
                        <View style={styles.rawBox}>
                            <Text style={styles.rawTitle}>{t.homeScanResponse}</Text>
                            <Text selectable style={styles.rawText}>
                                {lastRaw}
                            </Text>
                        </View>
                    )}
                </View> */}

        {/* <View style={styles.tipCard}>
                    <View style={styles.tipIcon}>
                        <Feather name="wifi" size={18} color={COLORS.primary} />
                    </View>

                    <View style={styles.tipTextBox}>
                        <Text style={styles.tipTitle}>{t.homeLiveUpdate}</Text>
                        <Text style={styles.tipText}>
                            {t.homeLiveUpdateDesc}
                        </Text>
                    </View>
                </View> */}
      </ScrollView>

      <Image
        source={SCAN_CAR_IMAGE}
        style={styles.preloadScanCarImage}
        resizeMode="contain"
      />

      <Animated.View
        style={[
          styles.aiFloatingButtonWrapper,
          {
            transform: [
              { translateX: floatingPosition.x },
              { translateY: floatingPosition.y },
            ],
          },
        ]}
        {...assistantPanResponder.panHandlers}
      >
        <View pointerEvents="none" style={styles.aiFloatingGlow} />

        <Pressable
          style={({ pressed }) => [
            styles.aiFloatingButton,
            pressed && styles.aiFloatingButtonPressed,
          ]}
        >
          <View pointerEvents="none" style={styles.aiTypingBubble}>
            <Animated.View
              style={[
                styles.aiTypingDot,
                {
                  opacity: typingDotOne,
                  transform: [
                    {
                      translateY: typingDotOne.interpolate({
                        inputRange: [0.35, 1],
                        outputRange: [1, -2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.aiTypingDot,
                {
                  opacity: typingDotTwo,
                  transform: [
                    {
                      translateY: typingDotTwo.interpolate({
                        inputRange: [0.35, 1],
                        outputRange: [1, -2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.aiTypingDot,
                {
                  opacity: typingDotThree,
                  transform: [
                    {
                      translateY: typingDotThree.interpolate({
                        inputRange: [0.35, 1],
                        outputRange: [1, -2],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>

          <Image
            source={CHATBOT_ASSISTANT_ICON}
            style={styles.aiFloatingImage}
            resizeMode="contain"
          />

          <Text style={styles.aiFloatingQuestion} numberOfLines={2}>
            {t.homeNeedHelp}
          </Text>
        </Pressable>
      </Animated.View>

      <Modal
        visible={isChecking}
        transparent={false}
        animationType="none"
        statusBarTranslucent
        presentationStyle="fullScreen"
        onRequestClose={() => {}}
      >
        <VehicleScanOverlay
          visible={isChecking}
          progress={scanProgress}
          darkMode={darkModeEnabled}
          isArabic={isArabic}
        />
      </Modal>
    </SafeAreaView>
  );
}

function VehicleScanOverlay({
  visible,
  progress,
  darkMode,
  isArabic,
}: {
  visible: boolean;
  progress: number;
  darkMode: boolean;
  isArabic: boolean;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const progressFill = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const [messageIndex, setMessageIndex] = useState(0);

  const overlayColors = darkMode
    ? {
        bg: "#151515",
        surface: "#202020",
        border: "rgba(255,255,255,0.10)",
        text: "#FFFFFF",
        muted: "#D7D7D7",
        primary: "#B63A34",
        softTrack: "rgba(170,170,170,0.22)",
        ring: "rgba(182,58,52,0.50)",
      }
    : {
        bg: "#FFFFFF",
        surface: "#FFFFFF",
        border: "#EDEDED",
        text: "#1D1D1F",
        muted: "#7A7A7A",
        primary: "#871B17",
        softTrack: "rgba(150,150,150,0.20)",
        ring: "rgba(135,27,23,0.46)",
      };

  const messages = useMemo(
    () =>
      isArabic
        ? [
            "🚗 خلّينا نطمن على سيارتك",
            "🔍 نقرأ بيانات السيارة الآن…",
            "⚙️ نراجع مؤشرات المحرك…",
            "🧠 نحلل القراءات بهدوء…",
            "📝 نجهّز التقرير النهائي…",
          ]
        : [
            "🚗 Let’s check your car",
            "🔍 Reading vehicle data…",
            "⚙️ Reviewing engine signals…",
            "🧠 Analyzing the readings…",
            "📝 Preparing your report…",
          ],
    [isArabic],
  );

  useEffect(() => {
    Animated.timing(fade, {
      toValue: visible ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [visible, fade]);

  useEffect(() => {
    Animated.timing(progressFill, {
      toValue: progress,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressFill]);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [visible, messages.length]);

  useEffect(() => {
    if (!visible) return;

    const makeRingLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1850,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const r1 = makeRingLoop(ring1, 0);
    const r2 = makeRingLoop(ring2, 560);
    const r3 = makeRingLoop(ring3, 1120);

    r1.start();
    r2.start();
    r3.start();

    return () => {
      r1.stop();
      r2.stop();
      r3.stop();
    };
  }, [visible, ring1, ring2, ring3]);

  const fillWidth = progressFill.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const ringAnimatedStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({
      inputRange: [0, 0.16, 0.78, 1],
      outputRange: [0, 0.78, 0.28, 0],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 1.52],
        }),
      },
    ],
  });

  return (
    <Animated.View
      style={[
        scanOverlayStyles.overlay,
        { backgroundColor: overlayColors.bg, opacity: fade },
      ]}
    >
      <View
        style={[
          scanOverlayStyles.messageBox,
          {
            backgroundColor: overlayColors.surface,
            borderColor: overlayColors.border,
          },
        ]}
      >
        <Text
          style={[scanOverlayStyles.messageText, { color: overlayColors.text }]}
        >
          {messages[messageIndex]}
        </Text>
      </View>

      <View style={scanOverlayStyles.carStage}>
        <Animated.View
          style={[
            scanOverlayStyles.ring,
            { borderColor: overlayColors.ring },
            ringAnimatedStyle(ring1),
          ]}
        />
        <Animated.View
          style={[
            scanOverlayStyles.ring,
            { borderColor: overlayColors.ring },
            ringAnimatedStyle(ring2),
          ]}
        />
        <Animated.View
          style={[
            scanOverlayStyles.ring,
            { borderColor: overlayColors.ring },
            ringAnimatedStyle(ring3),
          ]}
        />

        <Image
          source={SCAN_CAR_IMAGE}
          style={scanOverlayStyles.carImage}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>

      <View style={scanOverlayStyles.loadingSection}>
        <Text
          style={[
            scanOverlayStyles.loadingText,
            { color: overlayColors.primary },
          ]}
        >
          {isArabic ? "جارِ الفحص…" : "Scanning…"}
        </Text>

        <View
          style={[
            scanOverlayStyles.loadingTrack,
            { backgroundColor: overlayColors.softTrack },
          ]}
        >
          <Animated.View
            style={[
              scanOverlayStyles.loadingFill,
              { width: fillWidth, backgroundColor: overlayColors.primary },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const scanStageSize = Math.min(SCAN_SCREEN_WIDTH * 0.84, 340);
const scanCarWidth = Math.min(SCAN_SCREEN_WIDTH * 0.68, 270);
const scanCarHeight = Math.min(SCAN_SCREEN_HEIGHT * 0.36, 345);

const scanOverlayStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "android" ? 58 : 72,
    paddingBottom: Platform.OS === "android" ? 38 : 46,
  },

  messageBox: {
    width: "100%",
    maxWidth: 390,
    minHeight: 74,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "900",
    textAlign: "center",
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },

  carStage: {
    width: scanStageSize,
    height: scanStageSize,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    transform: [{ translateY: 0 }],
  },

  ring: {
    position: "absolute",
    width: scanStageSize * 0.88,
    height: scanStageSize * 0.88,
    borderRadius: scanStageSize,
    borderWidth: 1.45,
  },

  carImage: {
    width: scanCarWidth,
    height: scanCarHeight,
    transform: [{ translateY: 0 }],
  },

  loadingSection: {
    width: "100%",
    maxWidth: 390,
    marginTop: 0,
    marginBottom: Platform.OS === "android" ? 4 : 8,
    alignItems: "center",
  },

  loadingText: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "center",
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
    marginBottom: 18,
  },

  loadingTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },

  loadingFill: {
    height: "100%",
    borderRadius: 999,
  },
});

function QuickSummaryCard({
  iconPack = "feather",
  icon,
  title,
  value,
  subtitle,
  styles,
  COLORS,
  danger = false,
}: {
  iconPack?: "feather" | "material";
  icon:
    | keyof typeof Feather.glyphMap
    | React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  value: string;
  subtitle: string;
  styles: ReturnType<typeof createStyles>;
  COLORS: typeof LIGHT_COLORS;
  danger?: boolean;
}) {
  return (
    <View style={styles.quickSummaryCard}>
      <View style={styles.quickSummaryIconCircle}>
        {iconPack === "material" ? (
          <MaterialCommunityIcons
            name={icon as any}
            size={19}
            color={danger ? COLORS.danger : COLORS.primary}
          />
        ) : (
          <Feather
            name={icon as keyof typeof Feather.glyphMap}
            size={18}
            color={danger ? COLORS.danger : COLORS.primary}
          />
        )}
      </View>

      <Text style={styles.quickSummaryTitle} numberOfLines={1}>
        {title}
      </Text>

      <Text
        style={[styles.quickSummaryValue, danger && { color: COLORS.danger }]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {value}
      </Text>

      <Text style={styles.quickSummarySubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
    </View>
  );
}

function MetricCard({
  width,
  icon,
  label,
  value,
  unit,
  styles,
  COLORS,
}: {
  width: number;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  unit: string;
  styles: ReturnType<typeof createStyles>;
  COLORS: typeof LIGHT_COLORS;
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

function createStyles(COLORS: typeof LIGHT_COLORS, isArabic: boolean) {
  const rowDirection = isArabic ? "row-reverse" : "row";
  const textAlign = isArabic ? "right" : "left";
  const alignItems = isArabic ? "flex-end" : "flex-start";
  const alignSelf = isArabic ? "flex-end" : "flex-start";
  const isDarkTheme = COLORS.bg !== "#FFFFFF";

  return StyleSheet.create({
    inAppNotificationCard: {
      position: "absolute",
      top: 58,
      left: 18,
      right: 18,
      zIndex: 100,
      elevation: 12,
      borderRadius: 20,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 12,
      flexDirection: rowDirection,
      alignItems: "center",
      gap: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
    },

    inAppNotificationIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    inAppNotificationTextBox: {
      flex: 1,
      alignItems,
    },

    inAppNotificationTitle: {
      fontSize: 13,
      fontWeight: "900",
      color: COLORS.text,
      textAlign,
      fontFamily: FONT_BOLD,
    },

    inAppNotificationBody: {
      marginTop: 3,
      fontSize: 12,
      fontWeight: "700",
      color: COLORS.muted,
      textAlign,
      lineHeight: 18,
      fontFamily: FONT_SEMIBOLD,
    },

    inAppNotificationClose: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: COLORS.soft,
      alignItems: "center",
      justifyContent: "center",
    },

    safeArea: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },

    scrollView: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },

    scrollContent: {
      paddingHorizontal: Platform.OS === "android" ? 22 : 18,
      paddingTop: Platform.OS === "android" ? 34 : 28,
      paddingBottom: 140,
    },

    scrollContentWide: {
      paddingHorizontal: 26,
      paddingTop: 40,
    },

    header: {
      width: "100%",
      flexDirection: isArabic ? "row" : "row-reverse",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },

    headerWide: {
      alignSelf: "center",
      maxWidth: 980,
    },

    headerTextBox: {
      flex: 1,
      minWidth: 0,
      alignItems: isArabic ? "flex-end" : "flex-start",
      paddingTop: 0,
    },

    headerMainGroup: {
      flex: 1,
      minWidth: 0,
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: isArabic ? "flex-start" : "flex-start",
      gap: 10,
    },

    headerLogoMark: {
      width: 82,
      height: 58,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    headerLogoArabic: {
      width: 64,
      height: 24,
      marginBottom: 1.5,
    },

    headerLogoLine: {
      width: 68,
      height: 2.4,
      borderRadius: 999,
      backgroundColor: COLORS.primary,
      borderWidth: 0.4,
      borderColor: COLORS.accentBorder,
      marginVertical: 1.5,
    },

    headerLogoEnglish: {
      width: 82,
      height: 22,
      marginTop: 1,
    },

    headerRightArea: {
      position: "relative",
    },

    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: COLORS.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: COLORS.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },

    notificationDot: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 13,
      height: 13,
      borderRadius: 6.5,
      backgroundColor: COLORS.danger,
      borderWidth: 2,
      borderColor: COLORS.surface,
      zIndex: 5,
      elevation: 5,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.modalOverlay,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 24,
    },

    modalContainer: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: COLORS.surface,
      borderRadius: 24,
      padding: 20,
      maxHeight: "78%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },

    modalHeader: {
      flexDirection: rowDirection,
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      paddingBottom: 12,
      marginBottom: 10,
    },

    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 0,
    },

    notificationsTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "900",
      color: COLORS.text,
      textAlign,
      fontFamily: FONT_BOLD,
      includeFontPadding: true,
    },

    emptyNotificationText: {
      fontSize: 13,
      color: COLORS.muted,
      textAlign: "center",
      fontWeight: "700",
      paddingVertical: 30,
      fontFamily: FONT_SEMIBOLD,
    },

    notificationItem: {
      paddingVertical: 12,
      paddingHorizontal: 2,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },

    notificationText: {
      fontSize: 13,
      color: COLORS.text,
      textAlign,
      lineHeight: 22,
      fontWeight: "700",
      fontFamily: FONT_SEMIBOLD,
    },

    helloText: {
      fontSize: 14.5,
      color: COLORS.text,
      fontWeight: "900",
      textAlign,
      lineHeight: 22,
      fontFamily: FONT_EXTRABOLD,
      includeFontPadding: true,
    },

    headerTitle: {
      marginTop: 1,
      fontSize: 11.2,
      color: COLORS.muted,
      fontWeight: "700",
      textAlign,
      lineHeight: 17,
      fontFamily: FONT_SEMIBOLD,
      includeFontPadding: true,
    },

    headerActions: {
      flexDirection: rowDirection,
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 8,
      flexShrink: 0,
      paddingTop: 0,
    },

    notificationItemText: {
      flex: 1,
      textAlign,
      fontSize: 13,
      fontWeight: "700",
      color: COLORS.text,
      fontFamily: FONT_SEMIBOLD,
    },

    emptyNotificationsText: {
      textAlign: "center",
      fontSize: 13,
      color: COLORS.muted,
      fontWeight: "700",
      fontFamily: FONT_SEMIBOLD,
    },

    redDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: COLORS.danger,
    },

    notificationBadge: {
      position: "absolute",
      top: -3,
      right: -2,
      minWidth: 19,
      height: 19,
      borderRadius: 9.5,
      backgroundColor: COLORS.danger,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      borderWidth: 1.5,
      borderColor: COLORS.surface,
    },

    notificationBadgeText: {
      color: "#FFFFFF",
      fontSize: 9.5,
      fontWeight: "900",
      fontFamily: FONT_BOLD,
    },

    connectionBadge: {
      height: 38,
      borderRadius: 19,
      paddingHorizontal: 13,
      flexDirection: rowDirection,
      alignItems: "center",
      gap: 7,
      borderWidth: 1,
    },

    connectedBadge: {
      backgroundColor: COLORS.connectedBg,
      borderColor: COLORS.connectedBorder,
    },

    disconnectedBadge: {
      backgroundColor: COLORS.disconnectedBg,
      borderColor: COLORS.disconnectedBorder,
    },

    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    connectionText: {
      fontSize: 12,
      fontWeight: "900",
      fontFamily: FONT_BOLD,
      includeFontPadding: true,
    },
    myCarCard: {
      width: "100%",
      maxWidth: 980,
      alignSelf: "center",
      minHeight: 98,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: isDarkTheme
        ? "rgba(255,255,255,0.12)"
        : "rgba(135,27,23,0.16)",
      backgroundColor: COLORS.primary,
      paddingHorizontal: 16,
      paddingVertical: 13,
      justifyContent: "center",
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: Platform.OS === "android" ? 0.05 : 0.07,
      shadowRadius: 7,
      elevation: 2,
    },

    myCarCardWide: {
      maxWidth: 980,
      alignSelf: "center",
    },

    myCarMainRow: {
      width: "100%",
      flexDirection: rowDirection,
      alignItems: "center",
      justifyContent: "flex-start",
    },

    myCarTextBlock: {
      width: "100%",
      minWidth: 0,
      alignItems,
    },


    myCarLabel: {
      color: "rgba(255,255,255,0.96)",
      fontSize: 17,
      lineHeight: 25,
      fontFamily: FONT_BOLD,
      textAlign,
      includeFontPadding: true,
      marginBottom: 6,
    },

    carNameGlassBox: {
      alignSelf: alignSelf,
      maxWidth: "88%",
      borderRadius: 12,
      paddingHorizontal: 11,
      paddingVertical: 5,
      backgroundColor: isDarkTheme
        ? "rgba(255,255,255,0.13)"
        : "rgba(255,255,255,0.18)",
      borderWidth: 1,
      borderColor: isDarkTheme
        ? "rgba(255,255,255,0.20)"
        : "rgba(255,255,255,0.26)",
      alignItems,
    },

    carNameText: {
      color: "#FFFFFF",
      fontSize: 14.4,
      lineHeight: 21,
      fontWeight: "900",
      fontFamily: FONT_EXTRABOLD,
      textAlign,
      includeFontPadding: true,
    },

    carConnectionPill: {
      alignSelf: alignSelf,
      minHeight: 27,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 3,
      flexDirection: rowDirection,
      alignItems: "center",
      gap: 6,
      backgroundColor: isDarkTheme ? "rgba(255,255,255,0.96)" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDarkTheme
        ? "rgba(255,255,255,0.18)"
        : "rgba(255,255,255,0.55)",
      marginTop: 7,
    },

    carConnectionDot: {
      width: 7.5,
      height: 7.5,
      borderRadius: 4,
    },

    carConnectionText: {
      fontSize: 11.5,
      lineHeight: 17,
      fontWeight: "900",
      fontFamily: FONT_BOLD,
      includeFontPadding: true,
    },

    quickSummaryRow: {
      width: "100%",
      maxWidth: 980,
      alignSelf: "center",
      flexDirection: rowDirection,
      alignItems: "stretch",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 12,
      marginBottom: 4,
    },

    quickSummaryRowWide: {
      maxWidth: 980,
      alignSelf: "center",
    },

    quickSummaryCard: {
      flex: 1,
      minHeight: 136,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
      paddingHorizontal: 8,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "flex-start",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.035,
      shadowRadius: 6,
      elevation: 1,
    },

    quickSummaryIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 14,
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },

    quickSummaryTitle: {
      color: COLORS.text,
      fontSize: 11.2,
      lineHeight: 17,
      fontFamily: FONT_BOLD,
      textAlign: "center",
      includeFontPadding: true,
    },

    quickSummaryValue: {
      marginTop: 4,
      color: COLORS.primary,
      fontSize: 11.6,
      lineHeight: 17,
      fontFamily: FONT_EXTRABOLD,
      textAlign: "center",
      includeFontPadding: true,
    },

    quickSummarySubtitle: {
      marginTop: 3,
      color: COLORS.muted,
      fontSize: 9.2,
      lineHeight: 14,
      fontFamily: FONT_REGULAR,
      textAlign: "center",
      includeFontPadding: true,
    },

    heroCard: {
      width: "100%",
      maxWidth: 980,
      alignSelf: "center",
      borderRadius: 28,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
      paddingHorizontal: 20,
      paddingVertical: 18,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
      elevation: 1,
      marginTop: 0,
      marginBottom: 0,
    },

    heroCardWide: {
      maxWidth: 980,
      alignSelf: "center",
    },

    heroContent: {
      alignItems: "center",
      maxWidth: 470,
      paddingHorizontal: 4,
    },

    heroTitle: {
      fontSize: 20,
      lineHeight: 29,
      fontWeight: "900",
      color: COLORS.text,
      textAlign: "center",
      fontFamily: FONT_EXTRABOLD,
      includeFontPadding: true,
    },

    heroSubtitle: {
      marginTop: 6,
      fontSize: 13.2,
      color: isDarkTheme ? "rgba(255,255,255,0.82)" : "#5F5F5F",
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 22,
      fontFamily: FONT_SEMIBOLD,
      includeFontPadding: true,
    },

    heroButtons: {
      width: "100%",
      alignItems: "center",
      marginTop: 18,
    },

    mainButton: {
      width: "100%",
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
      flexDirection: rowDirection,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingTop: Platform.OS === "android" ? 1 : 0,
      overflow: "hidden",
    },

    mainButtonGlassTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "48%",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: "rgba(255,255,255,0.10)",
      zIndex: 1,
    },

    mainButtonText: {
      color: "#FFFFFF",
      fontSize: Platform.OS === "android" ? 15.5 : 17,
      fontWeight: "900",
      fontFamily: FONT_BOLD,
      includeFontPadding: false,
      textAlignVertical: "center",
      lineHeight: 22,
      zIndex: 2,
    },

    sectionTitle: {
      marginTop: 24,
      marginBottom: 12,
      fontSize: 15,
      fontWeight: "900",
      color: COLORS.text,
      textAlign,
      alignSelf: "stretch",
      fontFamily: FONT_BOLD,
      includeFontPadding: true,
    },

    metricsGrid: {
      width: "100%",
      maxWidth: 980,
      alignSelf: "center",
      flexDirection: rowDirection,
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
    },

    metricCard: {
      minHeight: 126,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
      paddingHorizontal: 10,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "flex-start",

      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.035,
      shadowRadius: 6,
      elevation: 1,
    },

    metricHeader: {
      alignItems: "center",
      justifyContent: "center",
    },

    metricIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 14,
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },

    metricLabel: {
      marginTop: 4,
      color: COLORS.text,
      fontSize: 11.2,
      lineHeight: 17,
      fontFamily: FONT_BOLD,
      textAlign: "center",
    },

    metricValue: {
      marginTop: 4,
      color: COLORS.primary,
      fontSize: 18,
      lineHeight: 24,
      fontFamily: FONT_EXTRABOLD,
      textAlign: "center",
    },

    metricUnit: {
      marginTop: 2,
      color: COLORS.muted,
      fontSize: 9.4,
      lineHeight: 14,
      fontFamily: FONT_REGULAR,
      textAlign: "center",
    },

    statusCard: {
      width: "100%",
      maxWidth: 980,
      alignSelf: "center",
      marginTop: 12,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
      padding: 16,
    },

    statusHeader: {
      flexDirection: rowDirection,
      alignItems: "center",
      gap: 8,
    },

    statusIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 14,
      backgroundColor: COLORS.softRed,
      alignItems: "center",
      justifyContent: "center",
    },

    statusTitle: {
      fontSize: 15,
      fontWeight: "900",
      color: COLORS.text,
      fontFamily: FONT_BOLD,
    },

    statusDescription: {
      marginTop: 10,
      fontSize: 13,
      color: COLORS.muted,
      fontWeight: "700",
      textAlign,
      lineHeight: 22,
      fontFamily: FONT_SEMIBOLD,
    },

    debugText: {
      marginTop: 8,
      fontSize: 12,
      color: COLORS.warning,
      fontWeight: "800",
      textAlign,
      lineHeight: 20,
      fontFamily: FONT_SEMIBOLD,
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
      textAlign,
      marginBottom: 6,
      fontFamily: FONT_BOLD,
    },

    rawText: {
      fontSize: 9.8,
      color: COLORS.rawText,
      fontWeight: "700",
      textAlign: "left",
      lineHeight: 18,
      fontFamily: FONT_REGULAR,
    },

    tipCard: {
      width: "100%",
      maxWidth: 980,
      alignSelf: "center",
      marginTop: 12,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.notificationUnreadBg,
      padding: 14,
      flexDirection: rowDirection,
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

    tipTextBox: {
      flex: 1,
      alignItems,
    },

    tipTitle: {
      fontSize: 14,
      fontWeight: "900",
      color: COLORS.text,
      textAlign,
      fontFamily: FONT_BOLD,
    },

    tipText: {
      marginTop: 5,
      fontSize: 12,
      color: COLORS.muted,
      fontWeight: "600",
      lineHeight: 20,
      textAlign,
      fontFamily: FONT_REGULAR,
    },

    aiHomeBox: {
      width: "100%",
      marginTop: 12,
      borderRadius: 18,
      backgroundColor: COLORS.soft,
      borderWidth: 0,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    aiHomeTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: COLORS.text,
      textAlign,
      fontFamily: FONT_BOLD,
    },

    aiHomeMessage: {
      marginTop: 6,
      fontSize: 16,
      fontWeight: "700",
      color: COLORS.muted,
      textAlign,
      lineHeight: 22,
      fontFamily: FONT_SEMIBOLD,
    },

    aiHomeFooter: {
      marginTop: 10,
      flexDirection: rowDirection,
      justifyContent: "space-between",
      gap: 10,
    },

    aiHomeScore: {
      fontSize: 12,
      fontWeight: "900",
      color: COLORS.primary,
      fontFamily: FONT_BOLD,
    },

    aiHomeAction: {
      flex: 1,
      fontSize: 12,
      fontWeight: "800",
      color: COLORS.success,
      textAlign: "left",
      fontFamily: FONT_SEMIBOLD,
    },

    notificationItemUnread: {
      backgroundColor: COLORS.notificationUnreadBg,
      borderRadius: 16,
      paddingHorizontal: 12,
    },

    notificationTopRow: {
      flexDirection: rowDirection,
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },

    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: COLORS.primary,
    },

    notificationTitleText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "900",
      color: COLORS.text,
      textAlign,
      fontFamily: FONT_BOLD,
      includeFontPadding: true,
    },

    notificationActions: {
      marginTop: 10,
      flexDirection: rowDirection,
      gap: 8,
      alignSelf: isArabic ? "flex-end" : "flex-start",
    },

    readButton: {
      backgroundColor: COLORS.primary,
      minHeight: 38,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },

    readButtonText: {
      color: "#FFFFFF",
      fontSize: 9.8,
      fontWeight: "900",
      fontFamily: FONT_BOLD,
      includeFontPadding: true,
    },

    deleteButton: {
      backgroundColor: COLORS.disconnectedBg,
      minHeight: 38,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },

    deleteButtonText: {
      color: COLORS.danger,
      fontSize: 9.8,
      fontWeight: "900",
      fontFamily: FONT_BOLD,
      includeFontPadding: true,
    },

    notificationActionPressed: {
      opacity: 0.62,
      transform: [{ scale: 0.98 }],
    },

    modalScrollContent: {
      paddingBottom: 18,
      flexGrow: 1,
    },

    modalScroll: {
      maxHeight: 430,
      width: "100%",
      flexGrow: 0,
    },

    preloadScanCarImage: {
      position: "absolute",
      width: 1,
      height: 1,
      opacity: 0,
      left: -10,
      top: -10,
    },

    aiFloatingButtonWrapper: {
      position: "absolute",
      left: 0,
      top: 0,
      width: FLOATING_ASSISTANT_WIDTH,
      height: FLOATING_ASSISTANT_HEIGHT,
      zIndex: 800,
      elevation: 14,
      alignItems: "center",
      justifyContent: "center",
    },

    aiFloatingGlow: {
      position: "absolute",
      width: FLOATING_ASSISTANT_WIDTH + 10,
      height: FLOATING_ASSISTANT_HEIGHT + 10,
      borderRadius: (FLOATING_ASSISTANT_HEIGHT + 10) / 2,
      backgroundColor: COLORS.floatingGlow,
      borderWidth: 1,
      borderColor: COLORS.floatingGlowBorder,
      shadowColor: COLORS.floatingIcon,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 6,
    },

    aiFloatingButton: {
      width: FLOATING_ASSISTANT_WIDTH,
      height: FLOATING_ASSISTANT_HEIGHT,
      borderRadius: FLOATING_ASSISTANT_HEIGHT / 2,
      backgroundColor: COLORS.floatingBg,
      borderWidth: 1.4,
      borderColor: COLORS.floatingBorder,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      paddingTop: Platform.OS === "android" ? 7 : 8,
      paddingBottom: Platform.OS === "android" ? 6 : 7,

      shadowColor: COLORS.floatingIcon,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 14,
    },

    aiFloatingButtonPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.96 }],
    },

    aiFloatingMark: {
      position: "absolute",
      top: 8,
      right: 12,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: COLORS.floatingMarkBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: COLORS.floatingBorder,
    },

    aiTypingBubble: {
      position: "absolute",
      top: -6,
      right: isArabic ? 3 : undefined,
      left: isArabic ? undefined : 3,
      minWidth: 31,
      height: 18,
      borderRadius: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      backgroundColor: COLORS.floatingTypingBg,
      borderWidth: 1,
      borderColor: COLORS.floatingTypingBorder,
      shadowColor: COLORS.floatingBg,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.09,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 4,
    },

    aiFloatingTopRow: {
      flexDirection: rowDirection,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      marginBottom: 2,
    },

    aiFloatingIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
      zIndex: 3,
    },

    aiFloatingImage: {
      width: Platform.OS === "android" ? 34 : 38,
      height: Platform.OS === "android" ? 34 : 38,
      marginTop: Platform.OS === "android" ? 1 : 3,
      marginBottom: Platform.OS === "android" ? 2 : 4,
      zIndex: 3,
    },

    aiFloatingMainIcon: {
      marginTop: Platform.OS === "android" ? 1 : 3,
      marginBottom: Platform.OS === "android" ? 2 : 4,
      zIndex: 3,
      textShadowColor: "rgba(0,0,0,0.28)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      shadowColor: "rgba(0,0,0,0.35)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },

    aiTypingDotsRow: {
      width: 25,
      height: 17,
      borderRadius: 9,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 2.7,
      backgroundColor: COLORS.floatingIconBg,
    },

    aiTypingDot: {
      width: 3.8,
      height: 3.8,
      borderRadius: 1.9,
      backgroundColor: COLORS.floatingTypingDot,
    },

    aiFloatingQuestion: {
      color: COLORS.floatingTitle,
      fontSize: 8.4,
      lineHeight: 10.8,
      fontWeight: "900",
      textAlign: "center",
      includeFontPadding: false,
      zIndex: 3,
      fontFamily: FONT_BOLD,
      marginTop: 0,
      maxWidth: 62,
      alignSelf: "center",
    },

    aiFloatingSubtitle: {
      marginTop: 2,
      color: COLORS.floatingSubtitle,
      fontSize: 7.5,
      lineHeight: 9,
      fontWeight: "900",
      textAlign: "center",
      includeFontPadding: false,
      fontFamily: FONT_BOLD,
    },
  });
}

