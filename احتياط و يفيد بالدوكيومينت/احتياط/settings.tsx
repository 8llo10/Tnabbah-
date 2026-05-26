import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    StatusBar,
    Animated,
    Modal,
    ActivityIndicator,
    Platform,
    Linking,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../providers/AuthProvider";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import { elmBluetoothService } from "../../services/elmBluetoothService";
import { vehicleScannerService } from "../../services/vehicleScannerService";
import { mqttService } from "../../services/mqttService";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

const COLORS = {
    primary: "#871B17",
    primary2: "#9A211C",
    primaryPressed: "#6F1512",
    primaryDark: "#761713",

    // خليته غامق بدل الأحمر الفاتح
    danger: "#871B17",

    success: "#1F8A4C",
    white: "#FFFFFF",
};

const lightTheme = {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    border: "#EDEDED",
    cardBorder: "#EFEFEF",
    textPrimary: "#1D1D1F",
    textSecondary: "#707070",
    iconBg: "#F3F4F6",
    iconColor: "#871B17",
    subtle: "#F8F8F8",
    headerDivider: "#F2F2F2",
    cardPressed: "#FAFAFA",
    dangerBg: "#FFF1F1",
    successBg: "#EFFAF3",
    modalOverlay: "rgba(0,0,0,0.32)",
};

const darkTheme = {
    background: "#151515",
    surface: "#232323",
    border: "#3A3A3A",
    cardBorder: "#343434",
    textPrimary: "#FFFFFF",
    textSecondary: "#B8B8B8",

    iconBg: "rgba(135,27,23,0.20)",
    iconColor: "#D04740",

    subtle: "#2C2C2C",
    headerDivider: "#343434",
    cardPressed: "#2B2B2B",
    dangerBg: "rgba(135,27,23,0.18)",
    successBg: "rgba(31,138,76,0.16)",
    modalOverlay: "rgba(0,0,0,0.58)",
};

const translations = {
    AR: {
        settings: "الإعدادات",

        account: "الحساب",
        userId: "معرّف المستخدم",

        cars: "سياراتي",
        currentCar: "السيارة الحالية",
        noCar: "لا توجد سيارة متصلة الآن",

        appSettings: "إعدادات التطبيق",
        notifications: "السماح بالإشعارات",
        notificationsDesc: "استلام تنبيهات الفحص والتذكيرات",
        language: "اللغة",
        languageDesc: "تغيير لغة التطبيق في أي وقت",
        darkMode: "الوضع الداكن",
        darkModeDesc: "تفعيل المظهر الداكن للتطبيق",

        helpSupport: "المساعدة والدعم",
        help: "المساعدة",
        helpDesc: "الأسئلة الشائعة وطريقة التواصل مع الدعم",

        vehicleConnection: "اتصال السيارة",
        bluetoothSettings: "إعدادات البلوتوث",
        bluetoothSettingsDesc: "ربط أو تغيير جهاز السيارة",
        deviceStatus: "حالة الجهاز",
        scanStatus: "حالة المتابعة",
        connected: "متصل",
        disconnected: "غير متصل",
        scannerOn: "المتابعة تعمل",
        scannerOff: "المتابعة متوقفة",

        pauseMonitoring: "إيقاف المتابعة مؤقتًا",
        pauseMonitoringDesc: "إيقاف قراءة بيانات السيارة مؤقتًا",
        endVehicleConnection: "إنهاء اتصال السيارة",
        endVehicleConnectionDesc: "فصل الجهاز وإيقاف قراءة البيانات",

        logout: "تسجيل الخروج",
        loggingOut: "جاري تسجيل الخروج...",
        logoutTitle: "تسجيل الخروج",
        logoutMessage: "هل تريد تسجيل الخروج من حسابك؟",
        cancel: "إلغاء",
        confirm: "تأكيد",
        logoutError: "تعذر تسجيل الخروج",

        helpTitle: "المساعدة",

        done: "تم",
        ok: "حسنًا",
        monitoringPaused: "تم إيقاف المتابعة مؤقتًا.",
        disconnectTitle: "إنهاء اتصال السيارة",
        disconnectMessage: "هل تريد إنهاء اتصال السيارة الآن؟",
        disconnectedDone: "تم إنهاء اتصال السيارة.",
        errorTitle: "حدث خطأ",


        totalCars: "عدد السيارات",
        carConnection: "اتصال السيارة الحالية",


        notificationsDeniedTitle: "الإشعارات غير مفعّلة",
        notificationsDeniedBody: "فعّلي الإشعارات من إعدادات الجهاز حتى تصلك التنبيهات.",
        openSettings: "فتح الإعدادات",
    },

    EN: {
        settings: "Settings",

        account: "Account",
        userId: "User ID",

        cars: "My Cars",
        currentCar: "Current Car",
        noCar: "No connected car",

        appSettings: "App Settings",
        notifications: "Allow Notifications",
        notificationsDesc: "Receive check alerts and reminders",
        language: "Language",
        languageDesc: "Change app language anytime",
        darkMode: "Dark Mode",
        darkModeDesc: "Enable dark theme for the app",

        helpSupport: "Help & Support",
        help: "Help",
        helpDesc: "FAQs and contact support",

        vehicleConnection: "Vehicle Connection",
        bluetoothSettings: "Bluetooth Settings",
        bluetoothSettingsDesc: "Pair or change the vehicle device",
        deviceStatus: "Device Status",
        scanStatus: "Monitoring Status",
        connected: "Connected",
        disconnected: "Disconnected",
        scannerOn: "Monitoring active",
        scannerOff: "Monitoring stopped",

        pauseMonitoring: "Pause monitoring",
        pauseMonitoringDesc: "Temporarily stop reading vehicle data",
        endVehicleConnection: "End vehicle connection",
        endVehicleConnectionDesc: "Disconnect the device and stop reading data",

        logout: "Logout",
        loggingOut: "Logging out...",
        logoutTitle: "Logout",
        logoutMessage: "Do you want to logout from your account?",
        cancel: "Cancel",
        confirm: "Confirm",
        logoutError: "Could not logout",

        helpTitle: "Help",

        done: "Done",
        ok: "OK",
        monitoringPaused: "Monitoring has been paused.",
        disconnectTitle: "End vehicle connection",
        disconnectMessage: "Do you want to end the vehicle connection now?",
        disconnectedDone: "Vehicle connection has been ended.",
        errorTitle: "Error",


        totalCars: "Total Cars",
        carConnection: "Current Car Connection",


        notificationsDeniedTitle: "Notifications disabled",
        notificationsDeniedBody: "Enable notifications from device settings to receive alerts.",
        openSettings: "Open Settings",
    },
};

type UserCar = {
    id: string;
    user_id: string;
    car_id: string;
    display_name: string | null;
    last_connected_at: string | null;
    is_deleted: boolean;
};

function AppSwitch({
    value,
    onValueChange,
    trackOnColor = COLORS.primary,
    trackOffColor = "#EDEDED",
    thumbColor = "#FFFFFF",
}: {
    value: boolean;
    onValueChange: (v: boolean) => void;
    trackOnColor?: string;
    trackOffColor?: string;
    thumbColor?: string;
}) {
    const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: value ? 1 : 0,
            duration: 160,
            useNativeDriver: true,
        }).start();
    }, [value, anim]);

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 24],
    });

    return (
        <Pressable
            onPress={() => onValueChange(!value)}
            style={({ pressed }) => [
                styles.switchTrack,
                {
                    backgroundColor: value ? trackOnColor : trackOffColor,
                    opacity: pressed ? 0.9 : 1,
                },
            ]}
        >
            <Animated.View
                style={[
                    styles.switchThumb,
                    {
                        backgroundColor: thumbColor,
                        transform: [{ translateX }],
                    },
                ]}
            />
        </Pressable>
    );
}

export default function Settings() {
    const { profile, session } = useAuth();
    const router = useRouter();

    const [loggingOut, setLoggingOut] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<"AR" | "EN">("AR");
    const [displayName, setDisplayName] = useState("");

    const [obdConnected, setObdConnected] = useState(false);
    const [scannerRunning, setScannerRunning] = useState(false);
    const [currentCarId, setCurrentCarId] = useState<string | null>(null);
    const [knownCarIds, setKnownCarIds] = useState<string[]>([]);

    const [userCars, setUserCars] = useState<UserCar[]>([]);
    const [carsLoading, setCarsLoading] = useState(false);
    const [editCarVisible, setEditCarVisible] = useState(false);
    const [selectedCarForEdit, setSelectedCarForEdit] = useState<UserCar | null>(null);
    const [carNameInput, setCarNameInput] = useState("");
    const [savingCarName, setSavingCarName] = useState(false);

    const [helpVisible, setHelpVisible] = useState(false);
    const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);
    const [confirmDisconnectVisible, setConfirmDisconnectVisible] = useState(false);

    const [editNameVisible, setEditNameVisible] = useState(false);
    const [fullNameInput, setFullNameInput] = useState("");
    const [savingName, setSavingName] = useState(false);

    const [messageVisible, setMessageVisible] = useState(false);
    const [messageTitle, setMessageTitle] = useState("");
    const [messageBody, setMessageBody] = useState("");
    const [messageIcon, setMessageIcon] = useState<keyof typeof Feather.glyphMap>("check-circle");

    const [editEmailVisible, setEditEmailVisible] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [savingEmail, setSavingEmail] = useState(false);

    const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);


    const t = translations[selectedLanguage];
    const isRTL = selectedLanguage === "AR";
    const theme = darkModeEnabled ? darkTheme : lightTheme;

    const userName =
        profile?.full_name ||
        session?.user?.user_metadata?.full_name ||
        "مستخدم";

    useEffect(() => {
        setDisplayName(userName);
    }, [userName]);

    const userEmail =
        session?.user?.email ||
        profile?.email ||
        profile?.username ||
        "—";

    const userId = session?.user?.id || "—";

    const loadUserSettings = async () => {
        const realUserId = session?.user?.id;

        if (!realUserId) {
            setSettingsLoading(false);
            return;
        }

        setSettingsLoading(true);

        try {
            const { data, error } = await supabase
                .from("user_settings")
                .select("language, dark_mode_enabled, notifications_enabled, last_car_id")
                .eq("user_id", realUserId)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                const { error: insertError } = await supabase
                    .from("user_settings")
                    .insert({
                        user_id: realUserId,
                        language: "AR",
                        dark_mode_enabled: false,
                        notifications_enabled: true,
                        last_car_id: null,
                    });

                if (insertError) throw insertError;
                return;
            }

            setSelectedLanguage(data.language === "EN" ? "EN" : "AR");
            setDarkModeEnabled(!!data.dark_mode_enabled);
            setNotificationsEnabled(!!data.notifications_enabled);

            if (data.last_car_id) {
                setCurrentCarId(data.last_car_id);
            }
        } catch (error) {
            console.log("Load user settings error:", error);
        } finally {
            setSettingsLoading(false);
        }
    };

    const saveUserSettings = async (updates: {
        language?: "AR" | "EN";
        dark_mode_enabled?: boolean;
        notifications_enabled?: boolean;
        last_car_id?: string | null;
    }) => {
        const realUserId = session?.user?.id;
        if (!realUserId) return;

        setSavingSettings(true);

        try {
            const { error } = await supabase
                .from("user_settings")
                .upsert(
                    {
                        user_id: realUserId,
                        ...updates,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                );

            if (error) throw error;
        } catch (error) {
            console.log("Save user settings error:", error);

            showMessage({
                title: selectedLanguage === "AR" ? "حدث خطأ" : "Error",
                body:
                    selectedLanguage === "AR"
                        ? "تعذر حفظ الإعدادات."
                        : "Could not save settings.",
                icon: "alert-circle",
            });
        } finally {
            setSavingSettings(false);
        }
    };


    const saveExpoPushToken = async (token: string | null) => {
        const realUserId = session?.user?.id;
        if (!realUserId) return;

        const { error } = await supabase
            .from("profiles")
            .update({
                expo_push_token: token,
                updated_at: new Date().toISOString(),
            })
            .eq("id", realUserId);

        if (error) {
            console.log("Save expo push token error:", error);
        }
    };

    const getProjectId = () => {
        return (
            Constants.easConfig?.projectId ||
            Constants.expoConfig?.extra?.eas?.projectId
        );
    };

    const registerForPushNotifications = async () => {
        if (!Device.isDevice) {
            showMessage({
                title: selectedLanguage === "AR" ? "تنبيه" : "Notice",
                body:
                    selectedLanguage === "AR"
                        ? "الإشعارات تحتاج جهاز حقيقي للتجربة."
                        : "Push notifications require a real device.",
                icon: "alert-circle",
            });

            return null;
        }

        const currentPermission = await Notifications.getPermissionsAsync();
        let finalStatus = currentPermission.status;

        if (finalStatus !== "granted") {
            const requestedPermission = await Notifications.requestPermissionsAsync();
            finalStatus = requestedPermission.status;
        }

        if (finalStatus !== "granted") {
            await saveUserSettings({ notifications_enabled: false });
            await saveExpoPushToken(null);
            setNotificationsEnabled(false);

            showMessage({
                title: t.notificationsDeniedTitle,
                body: t.notificationsDeniedBody,
                icon: "alert-circle",
            });

            setTimeout(() => {
                Linking.openSettings();
            }, 900);

            return null;
        }

        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
            });
        }

        const projectId = getProjectId();

        if (!projectId) {
            console.log("No Expo projectId found");
            return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        return tokenData.data;
    };

    const handleNotificationsChange = async (value: boolean) => {
        if (value) {
            const token = await registerForPushNotifications();

            if (!token) {
                return;
            }

            setNotificationsEnabled(true);
            await saveUserSettings({ notifications_enabled: true });
            await saveExpoPushToken(token);

            return;
        }

        setNotificationsEnabled(false);
        await saveUserSettings({ notifications_enabled: false });
        await saveExpoPushToken(null);
    };

    const handleDarkModeChange = async (value: boolean) => {
        setDarkModeEnabled(value);
        await saveUserSettings({ dark_mode_enabled: value });
    };

    const handleLanguageChange = async (value: "AR" | "EN") => {
        setSelectedLanguage(value);
        await saveUserSettings({ language: value });
    };

    const saveLastCarId = async (carId: string | null) => {
        setCurrentCarId(carId);
        await saveUserSettings({ last_car_id: carId });
    };

    const loadUserCars = async () => {
        const realUserId = session?.user?.id;
        if (!realUserId) return;

        setCarsLoading(true);

        try {
            const { data, error } = await supabase
                .from("user_cars")
                .select("id, user_id, car_id, display_name, last_connected_at, is_deleted")
                .eq("user_id", realUserId)
                .eq("is_deleted", false)
                .order("last_connected_at", { ascending: false, nullsFirst: false });

            if (error) throw error;

            setUserCars(data || []);
        } catch (error) {
            console.log("Load user cars error:", error);
        } finally {
            setCarsLoading(false);
        }
    };

    const handleSelectDefaultCar = async (carId: string) => {
        await saveLastCarId(carId);

        showMessage({
            title: t.done,
            body:
                selectedLanguage === "AR"
                    ? "تم تعيين السيارة كافتراضية."
                    : "Default car has been updated.",
            icon: "check-circle",
        });
    };

    const openEditCarName = (car: UserCar) => {
        setSelectedCarForEdit(car);
        setCarNameInput(car.display_name || "");
        setEditCarVisible(true);
    };

    const handleSaveCarName = async () => {
        if (!selectedCarForEdit) return;

        setSavingCarName(true);

        try {
            const cleanName = carNameInput.trim();

            const { error } = await supabase
                .from("user_cars")
                .update({
                    display_name: cleanName || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", selectedCarForEdit.id);

            if (error) throw error;

            setEditCarVisible(false);
            setSelectedCarForEdit(null);
            setCarNameInput("");

            await loadUserCars();

            showMessage({
                title: t.done,
                body:
                    selectedLanguage === "AR"
                        ? "تم تحديث اسم السيارة."
                        : "Car name updated.",
                icon: "check-circle",
            });
        } catch (error) {
            console.log("Save car name error:", error);
            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "تعذر تحديث اسم السيارة."
                        : "Could not update car name.",
                icon: "alert-circle",
            });
        } finally {
            setSavingCarName(false);
        }
    };

    const handleDeleteCar = async (car: UserCar) => {
        try {
            const { error } = await supabase
                .from("user_cars")
                .update({
                    is_deleted: true,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", car.id);

            if (error) throw error;

            if (currentCarId === car.car_id) {
                await saveLastCarId(null);
            }

            await loadUserCars();

            showMessage({
                title: t.done,
                body:
                    selectedLanguage === "AR"
                        ? "تم حذف السيارة من القائمة."
                        : "Car removed from list.",
                icon: "check-circle",
            });
        } catch (error) {
            console.log("Delete car error:", error);
            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "تعذر حذف السيارة."
                        : "Could not delete car.",
                icon: "alert-circle",
            });
        }
    };

    const refreshObdState = async () => {
        const connected = await elmBluetoothService
            .isActuallyConnected?.()
            .catch(() => false);

        setObdConnected(!!connected);
        setScannerRunning(vehicleScannerService.isAutoScanRunning());
        const cachedCarId = vehicleScannerService.getCachedCarId();

        if (cachedCarId) {
            setCurrentCarId(cachedCarId);
        }
    };

    useEffect(() => {
        refreshObdState();

        const interval = setInterval(refreshObdState, 1500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadUserSettings();
    }, [session?.user?.id]);

    useEffect(() => {
        loadUserCars();
    }, [session?.user?.id]);

    useEffect(() => {
        let mounted = true;
        let client: any = null;

        const setupCarsListener = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                const userId = data.user?.id;

                if (!userId) return;

                client = await mqttService.connectAsync();

                const topics = [
                    `Tnabbah/${userId}/+/identity`,
                    `Tnabbah/${userId}/+/status`,
                ];

                client.subscribe(topics);

                const onMessage = (topic: string, message: Buffer) => {
                    if (!mounted) return;

                    const parts = topic.split("/");
                    const incomingCarId = parts[2];

                    if (incomingCarId) {
                        setKnownCarIds((prev) =>
                            prev.includes(incomingCarId) ? prev : [...prev, incomingCarId]
                        );
                    }

                    try {
                        const parsed = JSON.parse(message.toString());
                        const data = parsed?.data ?? parsed;

                        if (data?.obdConnected && incomingCarId) {
                            saveLastCarId(incomingCarId);

                            const realUserId = session?.user?.id;

                            if (realUserId) {
                                supabase
                                    .from("user_cars")
                                    .upsert(
                                        {
                                            user_id: realUserId,
                                            car_id: incomingCarId,
                                            display_name: null,
                                            last_connected_at: new Date().toISOString(),
                                            is_deleted: false,
                                            updated_at: new Date().toISOString(),
                                        },
                                        { onConflict: "user_id,car_id" }
                                    )
                                    .then(() => loadUserCars());
                            }
                        }
                    } catch { }
                };

                client.on("message", onMessage);

                return () => {
                    try {
                        client.off?.("message", onMessage);
                        client.unsubscribe?.(topics);
                    } catch { }
                };
            } catch (error) {
                console.log("Settings cars listener error:", error);
            }
        };

        let cleanup: any;

        setupCarsListener().then((fn) => {
            cleanup = fn;
        });

        return () => {
            mounted = false;
            if (cleanup) cleanup();
        };
    }, []);

    const showMessage = ({
        title,
        body,
        icon = "check-circle",
    }: {
        title: string;
        body: string;
        icon?: keyof typeof Feather.glyphMap;
    }) => {
        setMessageTitle(title);
        setMessageBody(body);
        setMessageIcon(icon);
        setMessageVisible(true);
    };

    const goToBluetoothSettings = () => {
        router.push({
            pathname: "/connection-intro",
            params: { from: "settings" },
        } as any);
    };

    const handleStopScanner = async () => {
        try {
            await vehicleScannerService.stopAutoScan();
            await refreshObdState();

            showMessage({
                title: t.done,
                body: t.monitoringPaused,
                icon: "pause-circle",
            });
        } catch {
            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "تعذر إيقاف المتابعة."
                        : "Could not pause monitoring.",
                icon: "alert-circle",
            });
        }
    };

    const handleDisconnectObd = async () => {
        setConfirmDisconnectVisible(false);

        try {
            await vehicleScannerService.stopAutoScan();
            await elmBluetoothService.disconnect();
            await refreshObdState();
            await saveLastCarId(null);

            showMessage({
                title: t.done,
                body: t.disconnectedDone,
                icon: "check-circle",
            });
        } catch {
            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "تعذر إنهاء اتصال السيارة."
                        : "Could not end vehicle connection.",
                icon: "alert-circle",
            });
        }
    };

    const handleUpdateName = async () => {
        const realUserId = session?.user?.id;
        const cleanName = fullNameInput.trim();

        if (!realUserId || !cleanName) return;

        setSavingName(true);

        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: cleanName,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", realUserId);

            if (error) throw error;

            setEditNameVisible(false);
            setDisplayName(cleanName);

            showMessage({
                title: t.done,
                body: selectedLanguage === "AR" ? "تم تحديث الاسم." : "Name updated.",
                icon: "check-circle",
            });
        } catch (error) {
            console.log("Update name error:", error);

            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "تعذر تحديث الاسم."
                        : "Could not update name.",
                icon: "alert-circle",
            });
        } finally {
            setSavingName(false);
        }
    };



    const handleUpdateEmail = async () => {
        const cleanEmail = emailInput.trim().toLowerCase();

        if (!cleanEmail || !cleanEmail.includes("@")) {
            showMessage({
                title: t.errorTitle,
                body: selectedLanguage === "AR" ? "اكتبي بريد إلكتروني صحيح." : "Enter a valid email.",
                icon: "alert-circle",
            });
            return;
        }

        setSavingEmail(true);

        try {
            const { error } = await supabase.auth.updateUser({
                email: cleanEmail,
            });

            if (error) throw error;

            setEditEmailVisible(false);

            showMessage({
                title: t.done,
                body:
                    selectedLanguage === "AR"
                        ? "تم إرسال رابط تأكيد إلى الإيميل الجديد."
                        : "A confirmation link was sent to the new email.",
                icon: "check-circle",
            });
        } catch (error) {
            console.log("Update email error:", error);

            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "تعذر تحديث الإيميل."
                        : "Could not update email.",
                icon: "alert-circle",
            });
        } finally {
            setSavingEmail(false);
        }
    };



    const handleDeleteAccountVerification = async () => {
        if (!userEmail || userEmail === "—") return;

        if (!deletePassword.trim()) {
            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "اكتبي كلمة المرور الحالية."
                        : "Enter your current password.",
                icon: "alert-circle",
            });

            return;
        }

        setDeletingAccount(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: userEmail,
                password: deletePassword,
            });



            if (error) {
                showMessage({
                    title: t.errorTitle,
                    body:
                        selectedLanguage === "AR"
                            ? "كلمة المرور غير صحيحة."
                            : "Incorrect password.",
                    icon: "alert-circle",
                });

                setDeletingAccount(false);
                return;
            }

            const {
                data: { session: freshSession },
            } = await supabase.auth.getSession();

            const accessToken = freshSession?.access_token;

            if (!accessToken) {
                throw new Error("No access token");
            }

            const response = await fetch(
                "https://qzhnghwmgujgthbkivdi.supabase.co/functions/v1/delete-account",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error || "Delete failed");
            }

            setDeleteAccountVisible(false);
            setDeletePassword("");

            showMessage({
                title:
                    selectedLanguage === "AR"
                        ? "تم حذف الحساب"
                        : "Account deleted",
                body:
                    selectedLanguage === "AR"
                        ? "تم حذف الحساب نهائيًا."
                        : "Your account has been permanently deleted.",
                icon: "check-circle",
            });

            setTimeout(async () => {
                await supabase.auth.signOut();
                router.replace("/start" as any);
            }, 1200);


        } catch (error) {
            console.log("Delete account verify error:", error);

            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "حدث خطأ أثناء التحقق."
                        : "Verification failed.",
                icon: "alert-circle",
            });
        } finally {
            setDeletingAccount(false);
        }
    };


    const handleLogout = async () => {
        setConfirmLogoutVisible(false);
        setLoggingOut(true);

        try {
            await vehicleScannerService.stopAutoScan();
            await elmBluetoothService.disconnect();
            mqttService.disconnect();
            vehicleScannerService.resetCache();

            const { error } = await supabase.auth.signOut();

            if (error) {
                setLoggingOut(false);

                showMessage({
                    title: t.errorTitle,
                    body: t.logoutError,
                    icon: "alert-circle",
                });

                return;
            }

            router.replace("/start" as any);
        } catch {
            setLoggingOut(false);

            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "تعذر تسجيل الخروج. حاولي مرة ثانية."
                        : "Could not logout. Please try again.",
                icon: "alert-circle",
            });
        }
    };

    const rowDirection = isRTL ? "row-reverse" : "row";
    const textAlign = isRTL ? "right" : "left";
    const alignItems = isRTL ? "flex-end" : "flex-start";
    const iconMargin = isRTL ? { marginLeft: 12 } : { marginRight: 12 };

    if (settingsLoading) {
        return (
            <SafeAreaView
                style={[styles.container, { backgroundColor: theme.background }]}
                edges={["top"]}
            >
                <View style={styles.loadingSettingsContainer}>
                    <ActivityIndicator size="small" color={theme.iconColor} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.background }]}
            edges={["top"]}
        >
            <StatusBar
                barStyle={darkModeEnabled ? "light-content" : "dark-content"}
                backgroundColor={theme.background}
            />

            <View
                style={[
                    styles.header,
                    {
                        flexDirection: rowDirection,
                        backgroundColor: theme.background,
                    },
                ]}
            >
                <View style={styles.headerSide} />

                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                    {t.settings}
                </Text>

                <View style={styles.headerSide} />
            </View>

            <View
                style={[
                    styles.headerDivider,
                    { backgroundColor: theme.headerDivider },
                ]}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text
                    style={[
                        styles.sectionTitle,
                        { color: theme.textSecondary, textAlign },
                    ]}
                >
                    {t.account}
                </Text>

                <Pressable
                    style={styles.accountCard}
                    onPress={() => {
                        setFullNameInput(displayName === "مستخدم" ? "" : displayName);
                        setEditNameVisible(true);
                    }}
                >
                    <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                        <View
                            style={[
                                styles.settingLabelContainer,
                                { flexDirection: rowDirection },
                            ]}
                        >
                            <View style={[styles.accountAvatar, iconMargin]}>
                                <Feather name="user" size={22} color="#FFFFFF" />
                            </View>

                            <View style={[styles.userInfo, { alignItems }]}>
                                <Text
                                    numberOfLines={1}
                                    style={[styles.userName, { color: "#FFFFFF", textAlign }]}
                                >
                                    {displayName || userName}
                                </Text>

                                <Text
                                    numberOfLines={1}
                                    style={[styles.userEmail, { color: "#FFFFFF", textAlign }]}
                                >
                                    {userEmail}
                                </Text>

                                <Text
                                    numberOfLines={1}
                                    style={[styles.userIdText, { color: "#FFFFFF", textAlign }]}
                                >
                                    {t.userId}: {userId}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.card,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                        pressed && { backgroundColor: theme.cardPressed },
                    ]}
                    onPress={() =>
                        router.push({
                            pathname: "/forgot-password",
                            params: { email: userEmail !== "—" ? userEmail : "" },
                        } as any)
                    }
                >
                    <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                        <View style={[styles.settingLabelContainer, { flexDirection: rowDirection }]}>
                            <View
                                style={[
                                    styles.iconWrapper,
                                    iconMargin,
                                    { backgroundColor: theme.iconBg },
                                ]}
                            >
                                <Feather name="lock" size={20} color={theme.iconColor} />
                            </View>

                            <View style={[styles.labelBlock, { alignItems }]}>
                                <Text style={[styles.settingLabel, { color: theme.textPrimary, textAlign }]}>
                                    {selectedLanguage === "AR" ? "تغيير كلمة المرور" : "Change Password"}
                                </Text>

                                <Text style={[styles.settingHint, { color: theme.textSecondary, textAlign }]}>
                                    {selectedLanguage === "AR"
                                        ? "إرسال رمز تحقق لتغيير كلمة المرور"
                                        : "Send a verification code to change password"}
                                </Text>
                            </View>
                        </View>

                        <Feather
                            name={isRTL ? "chevron-left" : "chevron-right"}
                            size={18}
                            color={theme.textSecondary}
                        />
                    </View>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.card,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                        pressed && { backgroundColor: theme.cardPressed },
                    ]}
                    onPress={() => {
                        setEmailInput(userEmail !== "—" ? userEmail : "");
                        setEditEmailVisible(true);
                    }}
                >
                    <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                        <View style={[styles.settingLabelContainer, { flexDirection: rowDirection }]}>
                            <View style={[styles.iconWrapper, iconMargin, { backgroundColor: theme.iconBg }]}>
                                <Feather name="mail" size={20} color={theme.iconColor} />
                            </View>

                            <View style={[styles.labelBlock, { alignItems }]}>
                                <Text style={[styles.settingLabel, { color: theme.textPrimary, textAlign }]}>
                                    {selectedLanguage === "AR" ? "تعديل الإيميل" : "Edit Email"}
                                </Text>

                                <Text style={[styles.settingHint, { color: theme.textSecondary, textAlign }]}>
                                    {selectedLanguage === "AR"
                                        ? "سيتم إرسال تأكيد للإيميل الجديد"
                                        : "A confirmation will be sent to the new email"}
                                </Text>
                            </View>
                        </View>

                        <Feather
                            name={isRTL ? "chevron-left" : "chevron-right"}
                            size={18}
                            color={theme.textSecondary}
                        />
                    </View>
                </Pressable>

                <Text
                    style={[
                        styles.sectionTitle,
                        { color: theme.textSecondary, textAlign },
                    ]}
                >
                    {t.cars}
                </Text>

                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                        <View
                            style={[
                                styles.settingLabelContainer,
                                { flexDirection: rowDirection },
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconWrapper,
                                    iconMargin,
                                    { backgroundColor: theme.iconBg },
                                ]}
                            >
                                <Feather name="truck" size={20} color={theme.iconColor} />
                            </View>

                            <View style={[styles.labelBlock, { alignItems }]}>
                                <Text
                                    style={[
                                        styles.settingLabel,
                                        { color: theme.textPrimary, textAlign },
                                    ]}
                                >
                                    {t.currentCar}
                                </Text>

                                <Text
                                    numberOfLines={2}
                                    style={[
                                        styles.settingHint,
                                        { color: theme.textSecondary, textAlign },
                                    ]}
                                >
                                    {currentCarId || t.noCar}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.carInfoGrid, { flexDirection: rowDirection }]}>
                        <View
                            style={[
                                styles.carInfoPill,
                                {
                                    backgroundColor: theme.subtle,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Text style={[styles.carInfoLabel, { color: theme.textSecondary }]}>
                                {t.totalCars}
                            </Text>

                            <Text style={[styles.carInfoValue, { color: theme.textPrimary }]}>
                                {knownCarIds.length || (currentCarId ? 1 : 0)}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.carInfoPill,
                                {
                                    backgroundColor: obdConnected ? theme.successBg : theme.dangerBg,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Text style={[styles.carInfoLabel, { color: theme.textSecondary }]}>
                                {t.carConnection}
                            </Text>

                            <Text
                                style={[
                                    styles.carInfoValue,
                                    { color: obdConnected ? COLORS.success : COLORS.danger },
                                ]}
                            >
                                {obdConnected ? t.connected : t.disconnected}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.panelDivider,
                            { backgroundColor: theme.headerDivider, marginTop: 16 },
                        ]}
                    />

                    {carsLoading ? (
                        <View style={{ paddingVertical: 18 }}>
                            <ActivityIndicator size="small" color={theme.iconColor} />
                        </View>
                    ) : userCars.length === 0 ? (
                        <Text
                            style={{
                                color: theme.textSecondary,
                                textAlign,
                                marginTop: 16,
                                fontSize: 13,
                            }}
                        >
                            {selectedLanguage === "AR"
                                ? "لا توجد سيارات محفوظة بعد."
                                : "No saved cars yet."}
                        </Text>
                    ) : (
                        <View style={{ marginTop: 12, gap: 12 }}>
                            {userCars.map((car) => {
                                const isCurrent = currentCarId === car.car_id;

                                return (
                                    <View
                                        key={car.id}
                                        style={[
                                            styles.card,
                                            {
                                                backgroundColor: theme.subtle,
                                                borderColor: isCurrent
                                                    ? COLORS.primary
                                                    : theme.cardBorder,
                                                borderWidth: isCurrent ? 1.4 : 1,
                                                marginBottom: 0,
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.settingRow,
                                                {
                                                    flexDirection: rowDirection,
                                                    alignItems: "flex-start",
                                                },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.settingLabelContainer,
                                                    {
                                                        flexDirection: rowDirection,
                                                        flex: 1,
                                                    },
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        styles.iconWrapper,
                                                        iconMargin,
                                                        {
                                                            backgroundColor: theme.iconBg,
                                                        },
                                                    ]}
                                                >
                                                    <Feather
                                                        name="truck"
                                                        size={18}
                                                        color={theme.iconColor}
                                                    />
                                                </View>

                                                <View
                                                    style={[
                                                        styles.labelBlock,
                                                        {
                                                            alignItems,
                                                            flex: 1,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        numberOfLines={1}
                                                        style={[
                                                            styles.settingLabel,
                                                            {
                                                                color: theme.textPrimary,
                                                                textAlign,
                                                            },
                                                        ]}
                                                    >
                                                        {car.display_name ||
                                                            `${selectedLanguage === "AR"
                                                                ? "سيارة"
                                                                : "Car"
                                                            } ${car.car_id}`}
                                                    </Text>

                                                    <Text
                                                        numberOfLines={1}
                                                        style={[
                                                            styles.settingHint,
                                                            {
                                                                color: theme.textSecondary,
                                                                textAlign,
                                                                marginTop: 4,
                                                            },
                                                        ]}
                                                    >
                                                        ID: {car.car_id}
                                                    </Text>

                                                    <Text
                                                        numberOfLines={1}
                                                        style={[
                                                            styles.settingHint,
                                                            {
                                                                color: theme.textSecondary,
                                                                textAlign,
                                                                marginTop: 2,
                                                            },
                                                        ]}
                                                    >
                                                        {selectedLanguage === "AR"
                                                            ? "آخر اتصال:"
                                                            : "Last connection:"}{" "}
                                                        {car.last_connected_at
                                                            ? new Date(
                                                                car.last_connected_at
                                                            ).toLocaleString()
                                                            : "—"}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View
                                            style={{
                                                flexDirection: rowDirection,
                                                gap: 8,
                                                marginTop: 14,
                                            }}
                                        >
                                            {!isCurrent && (
                                                <Pressable
                                                    onPress={() =>
                                                        handleSelectDefaultCar(car.car_id)
                                                    }
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 10,
                                                        borderRadius: 12,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: "#FFF",
                                                            fontSize: 12,
                                                            fontWeight: "700",
                                                        }}
                                                    >
                                                        {selectedLanguage === "AR"
                                                            ? "تعيين"
                                                            : "Set"}
                                                    </Text>
                                                </Pressable>
                                            )}

                                            <Pressable
                                                onPress={() => openEditCarName(car)}
                                                style={{
                                                    backgroundColor: theme.iconBg,
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    borderRadius: 12,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: theme.textPrimary,
                                                        fontSize: 12,
                                                        fontWeight: "700",
                                                    }}
                                                >
                                                    {selectedLanguage === "AR"
                                                        ? "تعديل"
                                                        : "Rename"}
                                                </Text>
                                            </Pressable>

                                            <Pressable
                                                onPress={() => handleDeleteCar(car)}
                                                style={{
                                                    backgroundColor: "rgba(135,27,23,0.12)",
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    borderRadius: 12,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: COLORS.danger,
                                                        fontSize: 12,
                                                        fontWeight: "700",
                                                    }}
                                                >
                                                    {selectedLanguage === "AR"
                                                        ? "حذف"
                                                        : "Delete"}
                                                </Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                </View>

                <Text
                    style={[
                        styles.sectionTitle,
                        { color: theme.textSecondary, textAlign },
                    ]}
                >
                    {t.appSettings}
                </Text>

                <Pressable
                    style={({ pressed }) => [
                        styles.card,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                        pressed && { backgroundColor: theme.cardPressed },
                    ]}
                    onPress={() => handleNotificationsChange(!notificationsEnabled)}
                >
                    <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                        <View
                            style={[
                                styles.settingLabelContainer,
                                { flexDirection: rowDirection },
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconWrapper,
                                    iconMargin,
                                    { backgroundColor: theme.iconBg },
                                ]}
                            >
                                <Feather name="bell" size={20} color={theme.iconColor} />
                            </View>

                            <View style={[styles.labelBlock, { alignItems }]}>
                                <Text
                                    style={[
                                        styles.settingLabel,
                                        { color: theme.textPrimary, textAlign },
                                    ]}
                                >
                                    {t.notifications}
                                </Text>

                                <Text
                                    style={[
                                        styles.settingHint,
                                        { color: theme.textSecondary, textAlign },
                                    ]}
                                >
                                    {t.notificationsDesc}
                                </Text>
                            </View>
                        </View>

                        <AppSwitch
                            value={notificationsEnabled}
                            onValueChange={handleNotificationsChange}
                            trackOffColor={theme.border}
                        />
                    </View>
                </Pressable>

                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                        <View
                            style={[
                                styles.settingLabelContainer,
                                { flexDirection: rowDirection },
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconWrapper,
                                    iconMargin,
                                    { backgroundColor: theme.iconBg },
                                ]}
                            >
                                <Feather name="globe" size={20} color={theme.iconColor} />
                            </View>

                            <View style={[styles.labelBlock, { alignItems }]}>
                                <Text
                                    style={[
                                        styles.settingLabel,
                                        { color: theme.textPrimary, textAlign },
                                    ]}
                                >
                                    {t.language}
                                </Text>

                                <Text
                                    style={[
                                        styles.settingHint,
                                        { color: theme.textSecondary, textAlign },
                                    ]}
                                >
                                    {t.languageDesc}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.segment, { backgroundColor: theme.subtle }]}>
                            <Pressable
                                style={[
                                    styles.segmentItem,
                                    selectedLanguage === "AR" && styles.segmentItemActive,
                                ]}
                                onPress={() => handleLanguageChange("AR")}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: theme.textSecondary },
                                        selectedLanguage === "AR" && styles.segmentTextActive,
                                    ]}
                                >
                                    AR
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.segmentItem,
                                    selectedLanguage === "EN" && styles.segmentItemActive,
                                ]}
                                onPress={() => handleLanguageChange("EN")}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: theme.textSecondary },
                                        selectedLanguage === "EN" && styles.segmentTextActive,
                                    ]}
                                >
                                    EN
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.card,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                        pressed && { backgroundColor: theme.cardPressed },
                    ]}
                    onPress={() => handleDarkModeChange(!darkModeEnabled)}
                >
                    <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                        <View
                            style={[
                                styles.settingLabelContainer,
                                { flexDirection: rowDirection },
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconWrapper,
                                    iconMargin,
                                    { backgroundColor: theme.iconBg },
                                ]}
                            >
                                <Feather name="moon" size={20} color={theme.iconColor} />
                            </View>

                            <View style={[styles.labelBlock, { alignItems }]}>
                                <Text
                                    style={[
                                        styles.settingLabel,
                                        { color: theme.textPrimary, textAlign },
                                    ]}
                                >
                                    {t.darkMode}
                                </Text>

                                <Text
                                    style={[
                                        styles.settingHint,
                                        { color: theme.textSecondary, textAlign },
                                    ]}
                                >
                                    {t.darkModeDesc}
                                </Text>
                            </View>
                        </View>

                        <AppSwitch
                            value={darkModeEnabled}
                            onValueChange={handleDarkModeChange}
                            trackOffColor={theme.border}
                        />
                    </View>
                </Pressable>

                <Text
                    style={[
                        styles.sectionTitle,
                        { color: theme.textSecondary, textAlign },
                    ]}
                >
                    {t.helpSupport}
                </Text>

                <Pressable
                    style={({ pressed }) => [
                        styles.card,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                        pressed && { backgroundColor: theme.cardPressed },
                    ]}
                    onPress={() => setHelpVisible(true)}
                >
                    <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                        <View
                            style={[
                                styles.settingLabelContainer,
                                { flexDirection: rowDirection },
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconWrapper,
                                    iconMargin,
                                    { backgroundColor: theme.iconBg },
                                ]}
                            >
                                <Feather
                                    name="help-circle"
                                    size={20}
                                    color={theme.iconColor}
                                />
                            </View>

                            <View style={[styles.labelBlock, { alignItems }]}>
                                <Text
                                    style={[
                                        styles.settingLabel,
                                        { color: theme.textPrimary, textAlign },
                                    ]}
                                >
                                    {t.help}
                                </Text>

                                <Text
                                    style={[
                                        styles.settingHint,
                                        { color: theme.textSecondary, textAlign },
                                    ]}
                                >
                                    {t.helpDesc}
                                </Text>
                            </View>
                        </View>

                        <Feather
                            name={isRTL ? "chevron-left" : "chevron-right"}
                            size={18}
                            color={theme.textSecondary}
                        />
                    </View>
                </Pressable>

                <Text
                    style={[
                        styles.sectionTitle,
                        { color: theme.textSecondary, textAlign },
                    ]}
                >
                    {t.vehicleConnection}
                </Text>

                <View
                    style={[
                        styles.connectionPanel,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <View style={[styles.statusGrid, { flexDirection: rowDirection }]}>
                        <View
                            style={[
                                styles.miniStatusCard,
                                {
                                    backgroundColor: obdConnected
                                        ? theme.successBg
                                        : theme.dangerBg,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Feather
                                name="radio"
                                size={17}
                                color={obdConnected ? COLORS.success : COLORS.danger}
                            />

                            <Text
                                style={[
                                    styles.miniStatusTitle,
                                    { color: theme.textSecondary },
                                ]}
                            >
                                {t.deviceStatus}
                            </Text>

                            <Text
                                style={[
                                    styles.miniStatusText,
                                    { color: obdConnected ? COLORS.success : COLORS.danger },
                                ]}
                            >
                                {obdConnected ? t.connected : t.disconnected}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.miniStatusCard,
                                {
                                    backgroundColor: scannerRunning
                                        ? theme.successBg
                                        : theme.subtle,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Feather
                                name="activity"
                                size={17}
                                color={scannerRunning ? COLORS.success : theme.textSecondary}
                            />

                            <Text
                                style={[
                                    styles.miniStatusTitle,
                                    { color: theme.textSecondary },
                                ]}
                            >
                                {t.scanStatus}
                            </Text>

                            <Text
                                style={[
                                    styles.miniStatusText,
                                    {
                                        color: scannerRunning
                                            ? COLORS.success
                                            : theme.textSecondary,
                                    },
                                ]}
                            >
                                {scannerRunning ? t.scannerOn : t.scannerOff}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.panelDivider,
                            { backgroundColor: theme.headerDivider },
                        ]}
                    />

                    <Pressable
                        style={({ pressed }) => [
                            styles.connectionRow,
                            pressed && { backgroundColor: theme.cardPressed },
                        ]}
                        onPress={goToBluetoothSettings}
                    >
                        <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                            <View
                                style={[
                                    styles.settingLabelContainer,
                                    { flexDirection: rowDirection },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.iconWrapper,
                                        iconMargin,
                                        { backgroundColor: theme.iconBg },
                                    ]}
                                >
                                    <Feather
                                        name="bluetooth"
                                        size={20}
                                        color={theme.iconColor}
                                    />
                                </View>

                                <View style={[styles.labelBlock, { alignItems }]}>
                                    <Text
                                        style={[
                                            styles.settingLabel,
                                            { color: theme.textPrimary, textAlign },
                                        ]}
                                    >
                                        {t.bluetoothSettings}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.settingHint,
                                            { color: theme.textSecondary, textAlign },
                                        ]}
                                    >
                                        {t.bluetoothSettingsDesc}
                                    </Text>
                                </View>
                            </View>

                            <Feather
                                name={isRTL ? "chevron-left" : "chevron-right"}
                                size={18}
                                color={theme.textSecondary}
                            />
                        </View>
                    </Pressable>

                    <View
                        style={[
                            styles.panelDivider,
                            { backgroundColor: theme.headerDivider },
                        ]}
                    />

                    <Pressable
                        style={({ pressed }) => [
                            styles.actionButton,
                            {
                                backgroundColor: theme.iconBg,
                                borderColor: theme.cardBorder,
                            },
                            pressed && { backgroundColor: theme.cardPressed },
                        ]}
                        onPress={handleStopScanner}
                    >
                        <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                            <View
                                style={[
                                    styles.settingLabelContainer,
                                    { flexDirection: rowDirection },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.smallIconWrapper,
                                        iconMargin,
                                        { backgroundColor: theme.surface },
                                    ]}
                                >
                                    <Feather
                                        name="pause-circle"
                                        size={18}
                                        color={theme.iconColor}
                                    />
                                </View>

                                <View style={[styles.labelBlock, { alignItems }]}>
                                    <Text
                                        style={[
                                            styles.actionLabel,
                                            { color: theme.textPrimary, textAlign },
                                        ]}
                                    >
                                        {t.pauseMonitoring}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.settingHint,
                                            { color: theme.textSecondary, textAlign },
                                        ]}
                                    >
                                        {t.pauseMonitoringDesc}
                                    </Text>
                                </View>
                            </View>

                            <Feather
                                name={isRTL ? "chevron-left" : "chevron-right"}
                                size={17}
                                color={theme.textSecondary}
                            />
                        </View>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.actionButton,
                            {
                                backgroundColor: theme.iconBg,
                                borderColor: theme.cardBorder,
                            },
                            pressed && { backgroundColor: theme.cardPressed },
                        ]}
                        onPress={() => setConfirmDisconnectVisible(true)}
                    >
                        <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                            <View
                                style={[
                                    styles.settingLabelContainer,
                                    { flexDirection: rowDirection },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.smallIconWrapper,
                                        iconMargin,
                                        { backgroundColor: theme.surface },
                                    ]}
                                >
                                    <Feather name="power" size={18} color={theme.iconColor} />
                                </View>

                                <View style={[styles.labelBlock, { alignItems }]}>
                                    <Text
                                        style={[
                                            styles.actionLabel,
                                            { color: theme.textPrimary, textAlign },
                                        ]}
                                    >
                                        {t.endVehicleConnection}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.settingHint,
                                            { color: theme.textSecondary, textAlign },
                                        ]}
                                    >
                                        {t.endVehicleConnectionDesc}
                                    </Text>
                                </View>
                            </View>

                            <Feather
                                name={isRTL ? "chevron-left" : "chevron-right"}
                                size={17}
                                color={theme.textSecondary}
                            />
                        </View>
                    </Pressable>
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.card,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                        pressed && { backgroundColor: theme.cardPressed },
                    ]}
                    onPress={() => setDeleteAccountVisible(true)}
                >
                    <View style={[styles.settingRow, { flexDirection: rowDirection }]}>
                        <View
                            style={[
                                styles.settingLabelContainer,
                                { flexDirection: rowDirection },
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconWrapper,
                                    iconMargin,
                                    {
                                        backgroundColor: "rgba(135,27,23,0.12)",
                                    },
                                ]}
                            >
                                <Feather
                                    name="trash-2"
                                    size={20}
                                    color={COLORS.danger}
                                />
                            </View>

                            <View style={[styles.labelBlock, { alignItems }]}>
                                <Text
                                    style={[
                                        styles.settingLabel,
                                        {
                                            color: COLORS.danger,
                                            textAlign,
                                        },
                                    ]}
                                >
                                    {selectedLanguage === "AR"
                                        ? "حذف الحساب"
                                        : "Delete Account"}
                                </Text>

                                <Text
                                    style={[
                                        styles.settingHint,
                                        {
                                            color: theme.textSecondary,
                                            textAlign,
                                        },
                                    ]}
                                >
                                    {selectedLanguage === "AR"
                                        ? "سيتم طلب كلمة المرور الحالية"
                                        : "Your current password will be required"}
                                </Text>
                            </View>
                        </View>

                        <Feather
                            name={isRTL ? "chevron-left" : "chevron-right"}
                            size={18}
                            color={theme.textSecondary}
                        />
                    </View>
                </Pressable>

                <View style={styles.logoutSection}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.logoutButtonWrapper,
                            loggingOut && styles.logoutButtonDisabled,
                            pressed && !loggingOut && { opacity: 0.92 },
                        ]}
                        onPress={() => setConfirmLogoutVisible(true)}
                        disabled={loggingOut}
                    >
                        <LinearGradient
                            colors={["rgba(154,33,28,0.98)", "rgba(118,23,19,0.98)"]}
                            start={{ x: 0.15, y: 0 }}
                            end={{ x: 0.9, y: 1 }}
                            style={styles.logoutGradient}
                        >
                            <View style={styles.logoutShine} />

                            <View
                                style={[styles.logoutInner, { flexDirection: rowDirection }]}
                            >
                                {loggingOut ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#FFFFFF"
                                        style={styles.logoutSpinner}
                                    />
                                ) : (
                                    <Feather name="log-out" size={18} color="#FFFFFF" />
                                )}

                                <Text style={styles.logoutText}>
                                    {loggingOut ? t.loggingOut : t.logout}
                                </Text>
                            </View>
                        </LinearGradient>
                    </Pressable>
                </View>
            </ScrollView>

            <HelpModal
                visible={helpVisible}
                onClose={() => setHelpVisible(false)}
                t={t}
                theme={theme}
                isRTL={isRTL}
            />

            <ConfirmModal
                visible={confirmLogoutVisible}
                title={t.logoutTitle}
                message={t.logoutMessage}
                confirmText={t.logout}
                cancelText={t.cancel}
                icon="log-out"
                theme={theme}
                isRTL={isRTL}
                danger
                onCancel={() => setConfirmLogoutVisible(false)}
                onConfirm={handleLogout}
            />

            <ConfirmModal
                visible={confirmDisconnectVisible}
                title={t.disconnectTitle}
                message={t.disconnectMessage}
                confirmText={t.confirm}
                cancelText={t.cancel}
                icon="power"
                theme={theme}
                isRTL={isRTL}
                onCancel={() => setConfirmDisconnectVisible(false)}
                onConfirm={handleDisconnectObd}
            />

            <MessageModal
                visible={messageVisible}
                title={messageTitle}
                message={messageBody}
                icon={messageIcon}
                buttonText={t.ok}
                theme={theme}
                isRTL={isRTL}
                onClose={() => setMessageVisible(false)}
            />

            <EditNameModal
                visible={editNameVisible}
                value={fullNameInput}
                onChangeText={setFullNameInput}
                onCancel={() => setEditNameVisible(false)}
                onSave={handleUpdateName}
                saving={savingName}
                theme={theme}
                isRTL={isRTL}
                t={t}
            />

            <EditEmailModal
                visible={editEmailVisible}
                value={emailInput}
                onChangeText={setEmailInput}
                onCancel={() => setEditEmailVisible(false)}
                onSave={handleUpdateEmail}
                saving={savingEmail}
                theme={theme}
                isRTL={isRTL}
                t={t}
            />

            <EditCarNameModal
                visible={editCarVisible}
                value={carNameInput}
                onChangeText={setCarNameInput}
                onCancel={() => {
                    setEditCarVisible(false);
                    setSelectedCarForEdit(null);
                    setCarNameInput("");
                }}
                onSave={handleSaveCarName}
                saving={savingCarName}
                theme={theme}
                isRTL={isRTL}
            />

            <DeleteAccountModal
                visible={deleteAccountVisible}
                password={deletePassword}
                onChangePassword={setDeletePassword}
                onCancel={() => {
                    setDeleteAccountVisible(false);
                    setDeletePassword("");
                }}
                onConfirm={handleDeleteAccountVerification}
                loading={deletingAccount}
                theme={theme}
                isRTL={isRTL}
            />



            <LogoutLoadingModal
                visible={loggingOut}
                text={t.loggingOut}
                theme={theme}
            />
        </SafeAreaView>
    );
}

function EditNameModal({
    visible,
    value,
    onChangeText,
    onCancel,
    onSave,
    saving,
    theme,
    isRTL,
    t,
}: {
    visible: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onCancel: () => void;
    onSave: () => void;
    saving: boolean;
    theme: any;
    isRTL: boolean;
    t: any;
}) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
                <View
                    style={[
                        styles.confirmModal,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {isRTL ? "تعديل الاسم" : "Edit Name"}
                    </Text>

                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={isRTL ? "اكتبي الاسم" : "Enter name"}
                        placeholderTextColor={theme.textSecondary}
                        style={[
                            styles.nameInput,
                            {
                                color: theme.textPrimary,
                                borderColor: theme.cardBorder,
                                backgroundColor: theme.subtle,
                                textAlign,
                            },
                        ]}
                    />

                    <View style={[styles.confirmButtons, { flexDirection: rowDirection }]}>
                        <Pressable
                            style={[
                                styles.confirmSecondaryButton,
                                {
                                    backgroundColor: theme.iconBg,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                            onPress={onCancel}
                            disabled={saving}
                        >
                            <Text style={[styles.confirmSecondaryText, { color: theme.textPrimary }]}>
                                {t.cancel}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.confirmPrimaryButton,
                                { backgroundColor: COLORS.primary },
                                saving && { opacity: 0.7 },
                            ]}
                            onPress={onSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmPrimaryText}>
                                    {t.confirm}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}


function EditEmailModal({
    visible,
    value,
    onChangeText,
    onCancel,
    onSave,
    saving,
    theme,
    isRTL,
    t,
}: {
    visible: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onCancel: () => void;
    onSave: () => void;
    saving: boolean;
    theme: any;
    isRTL: boolean;
    t: any;
}) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
                <View style={[styles.confirmModal, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {isRTL ? "تعديل الإيميل" : "Edit Email"}
                    </Text>

                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={isRTL ? "اكتبي الإيميل الجديد" : "Enter new email"}
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[
                            styles.nameInput,
                            {
                                color: theme.textPrimary,
                                borderColor: theme.cardBorder,
                                backgroundColor: theme.subtle,
                                textAlign,
                            },
                        ]}
                    />

                    <View style={[styles.confirmButtons, { flexDirection: rowDirection }]}>
                        <Pressable
                            style={[styles.confirmSecondaryButton, { backgroundColor: theme.iconBg, borderColor: theme.cardBorder }]}
                            onPress={onCancel}
                            disabled={saving}
                        >
                            <Text style={[styles.confirmSecondaryText, { color: theme.textPrimary }]}>
                                {t.cancel}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.confirmPrimaryButton, { backgroundColor: COLORS.primary }, saving && { opacity: 0.7 }]}
                            onPress={onSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmPrimaryText}>{t.confirm}</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function EditCarNameModal({
    visible,
    value,
    onChangeText,
    onCancel,
    onSave,
    saving,
    theme,
    isRTL,
}: {
    visible: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onCancel: () => void;
    onSave: () => void;
    saving: boolean;
    theme: any;
    isRTL: boolean;
}) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
                <View style={[styles.confirmModal, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {isRTL ? "تسمية السيارة" : "Rename Car"}
                    </Text>

                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={isRTL ? "اسم السيارة" : "Car name"}
                        placeholderTextColor={theme.textSecondary}
                        style={[
                            styles.nameInput,
                            {
                                color: theme.textPrimary,
                                borderColor: theme.cardBorder,
                                backgroundColor: theme.subtle,
                                textAlign,
                            },
                        ]}
                    />

                    <View style={[styles.confirmButtons, { flexDirection: rowDirection }]}>
                        <Pressable
                            style={[
                                styles.confirmSecondaryButton,
                                {
                                    backgroundColor: theme.iconBg,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                            onPress={onCancel}
                            disabled={saving}
                        >
                            <Text style={[styles.confirmSecondaryText, { color: theme.textPrimary }]}>
                                {isRTL ? "إلغاء" : "Cancel"}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.confirmPrimaryButton,
                                { backgroundColor: COLORS.primary },
                                saving && { opacity: 0.7 },
                            ]}
                            onPress={onSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmPrimaryText}>
                                    {isRTL ? "حفظ" : "Save"}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function DeleteAccountModal({
    visible,
    password,
    onChangePassword,
    onCancel,
    onConfirm,
    loading,
    theme,
    isRTL,
}: {
    visible: boolean;
    password: string;
    onChangePassword: (text: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
    loading: boolean;
    theme: any;
    isRTL: boolean;
}) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View
                style={[
                    styles.modalOverlay,
                    { backgroundColor: theme.modalOverlay },
                ]}
            >
                <View
                    style={[
                        styles.confirmModal,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.confirmIconCircle,
                            {
                                backgroundColor: "rgba(135,27,23,0.12)",
                            },
                        ]}
                    >
                        <Feather
                            name="trash-2"
                            size={28}
                            color={COLORS.danger}
                        />
                    </View>

                    <Text
                        style={[
                            styles.confirmTitle,
                            { color: theme.textPrimary },
                        ]}
                    >
                        {isRTL ? "حذف الحساب" : "Delete Account"}
                    </Text>

                    <Text
                        style={[
                            styles.confirmMessage,
                            {
                                color: theme.textSecondary,
                                textAlign,
                            },
                        ]}
                    >
                        {isRTL
                            ? "هذا الإجراء نهائي. اكتبي كلمة المرور الحالية للمتابعة."
                            : "This action is permanent. Enter your current password to continue."}
                    </Text>

                    <TextInput
                        value={password}
                        onChangeText={onChangePassword}
                        secureTextEntry
                        placeholder={
                            isRTL
                                ? "كلمة المرور الحالية"
                                : "Current password"
                        }
                        placeholderTextColor={theme.textSecondary}
                        style={[
                            styles.nameInput,
                            {
                                color: theme.textPrimary,
                                borderColor: theme.cardBorder,
                                backgroundColor: theme.subtle,
                                textAlign,
                            },
                        ]}
                    />

                    <View
                        style={[
                            styles.confirmButtons,
                            { flexDirection: rowDirection },
                        ]}
                    >
                        <Pressable
                            style={[
                                styles.confirmSecondaryButton,
                                {
                                    backgroundColor: theme.iconBg,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                            onPress={onCancel}
                            disabled={loading}
                        >
                            <Text
                                style={[
                                    styles.confirmSecondaryText,
                                    { color: theme.textPrimary },
                                ]}
                            >
                                {isRTL ? "إلغاء" : "Cancel"}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.confirmPrimaryButton,
                                {
                                    backgroundColor: COLORS.danger,
                                },
                                loading && { opacity: 0.7 },
                            ]}
                            onPress={onConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                />
                            ) : (
                                <Text style={styles.confirmPrimaryText}>
                                    {isRTL ? "متابعة" : "Continue"}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}


function HelpModal({
    visible,
    onClose,
    t,
    theme,
    isRTL,
}: {
    visible: boolean;
    onClose: () => void;
    t: any;
    theme: any;
    isRTL: boolean;
}) {
    const textAlign = isRTL ? "right" : "left";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View
                style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
            >
                <View
                    style={[
                        styles.helpModal,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <View style={styles.helpModalHeader}>
                        <Pressable
                            style={[
                                styles.modalCloseButton,
                                {
                                    backgroundColor: theme.iconBg,
                                    borderColor: theme.border,
                                },
                            ]}
                            onPress={onClose}
                        >
                            <Feather name="x" size={21} color={theme.iconColor} />
                        </Pressable>

                        <Text style={[styles.helpModalTitle, { color: theme.textPrimary }]}>
                            {t.helpTitle}
                        </Text>

                        <View style={styles.modalHeaderSpace} />
                    </View>

                    <View
                        style={[
                            styles.modalDivider,
                            { backgroundColor: theme.headerDivider },
                        ]}
                    />

                    <ScrollView
                        style={styles.helpModalScroll}
                        contentContainerStyle={styles.helpModalContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.helpModalBody}>
                            <Text
                                style={[
                                    styles.helpSectionTitle,
                                    { color: theme.textPrimary, textAlign },
                                ]}
                            >
                                مرحبًا بك في تنبّه
                            </Text>

                            <Text
                                style={[
                                    styles.helpParagraph,
                                    { color: theme.textSecondary, textAlign },
                                ]}
                            >
                                تطبيق تنبّه يساعدك على متابعة حالة سيارتك بطريقة سهلة وواضحة. يمكنك من خلاله ربط قطعة السيارة، تشغيل الفحص، معرفة حالة الاتصال، قراءة أهم التنبيهات، وحفظ تقارير الفحص للرجوع لها لاحقًا.
                            </Text>

                            <Text
                                style={[
                                    styles.helpSectionTitle,
                                    { color: theme.textPrimary, textAlign },
                                ]}
                            >
                                ربط قطعة السيارة
                            </Text>

                            <Text
                                style={[
                                    styles.helpParagraph,
                                    { color: theme.textSecondary, textAlign },
                                ]}
                            >
                                عند الدخول للتطبيق يمكنك ربط قطعة السيارة من خلال البلوتوث. اتبعي خطوات الربط، ثم اختاري الجهاز المناسب من قائمة الأجهزة المتاحة. بعد نجاح الاتصال، يستطيع التطبيق قراءة بيانات السيارة وعرض حالتها.
                            </Text>

                            <Text
                                style={[
                                    styles.helpSectionTitle,
                                    { color: theme.textPrimary, textAlign },
                                ]}
                            >
                                الصفحة الرئيسية
                            </Text>

                            <Text
                                style={[
                                    styles.helpParagraph,
                                    { color: theme.textSecondary, textAlign },
                                ]}
                            >
                                الصفحة الرئيسية تعرض أهم معلومات السيارة في مكان واحد، مثل حالة اتصال القطعة، ملخص حالة السيارة، والتنبيهات المهمة. كما يمكنك من خلالها تشغيل الفحص لمعرفة حالة السيارة بشكل أوضح.
                            </Text>

                            <Text
                                style={[
                                    styles.helpSectionTitle,
                                    { color: theme.textPrimary, textAlign },
                                ]}
                            >
                                الفحص
                            </Text>

                            <Text
                                style={[
                                    styles.helpParagraph,
                                    { color: theme.textSecondary, textAlign },
                                ]}
                            >
                                عند تشغيل الفحص، يقوم التطبيق بقراءة بيانات السيارة وتحليلها. بعد انتهاء الفحص يظهر تقرير يوضح الحالة والملاحظات المهمة، ويمكن حفظ التقرير في المحفظة.
                            </Text>

                            <Text
                                style={[
                                    styles.helpSectionTitle,
                                    { color: theme.textPrimary, textAlign },
                                ]}
                            >
                                المساعد الذكي
                            </Text>

                            <Text
                                style={[
                                    styles.helpParagraph,
                                    { color: theme.textSecondary, textAlign },
                                ]}
                            >
                                المساعد الذكي يسمح لك بطرح أسئلة عن السيارة أو الأعطال أو التنبيهات. اكتبي سؤالك، وسيحاول المساعد إعطاء إجابة واضحة تساعدك على فهم المشكلة أو الخطوة المناسبة.
                            </Text>

                            <Text
                                style={[
                                    styles.helpSectionTitle,
                                    { color: theme.textPrimary, textAlign },
                                ]}
                            >
                                المحفظة
                            </Text>

                            <Text
                                style={[
                                    styles.helpParagraph,
                                    { color: theme.textSecondary, textAlign },
                                ]}
                            >
                                المحفظة تحفظ تقارير الفحص الخاصة بسيارتك. كما تساعدك على متابعة الصيانة الدورية، مثل التذكير بالأشياء التي تحتاج متابعة أو صيانة خلال فترة محددة.
                            </Text>

                            <Text
                                style={[
                                    styles.helpSectionTitle,
                                    { color: theme.textPrimary, textAlign },
                                ]}
                            >
                                الإعدادات
                            </Text>

                            <Text
                                style={[
                                    styles.helpParagraph,
                                    { color: theme.textSecondary, textAlign },
                                ]}
                            >
                                من الإعدادات يمكنك التحكم في لغة التطبيق، تفعيل أو إيقاف الإشعارات، تغيير الوضع الداكن، متابعة حالة اتصال السيارة، الدخول إلى إعدادات البلوتوث، إيقاف المتابعة مؤقتًا، أو إنهاء اتصال السيارة.
                            </Text>

                            <Text
                                style={[
                                    styles.helpSectionTitle,
                                    { color: theme.textPrimary, textAlign },
                                ]}
                            >
                                ملاحظة مهمة
                            </Text>

                            <Text
                                style={[
                                    styles.helpParagraph,
                                    { color: theme.textSecondary, textAlign },
                                ]}
                            >
                                إذا كانت قطعة السيارة غير متصلة، قد لا تظهر بعض البيانات أو نتائج الفحص. تأكدي من تشغيل البلوتوث، وتركيب القطعة بشكل صحيح، ثم أعيدي المحاولة.
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function ConfirmModal({
    visible,
    title,
    message,
    confirmText,
    cancelText,
    icon,
    theme,
    isRTL,
    danger = false,
    onCancel,
    onConfirm,
}: {
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    icon: keyof typeof Feather.glyphMap;
    theme: any;
    isRTL: boolean;
    danger?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View
                style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
            >
                <View
                    style={[
                        styles.confirmModal,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.confirmIconCircle,
                            { backgroundColor: theme.iconBg },
                        ]}
                    >
                        <Feather name={icon} size={28} color={theme.iconColor} />
                    </View>

                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {title}
                    </Text>

                    <Text
                        style={[
                            styles.confirmMessage,
                            { color: theme.textSecondary, textAlign },
                        ]}
                    >
                        {message}
                    </Text>

                    <View style={[styles.confirmButtons, { flexDirection: rowDirection }]}>
                        <Pressable
                            style={[
                                styles.confirmSecondaryButton,
                                {
                                    backgroundColor: theme.iconBg,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                            onPress={onCancel}
                        >
                            <Text
                                style={[
                                    styles.confirmSecondaryText,
                                    { color: theme.textPrimary },
                                ]}
                            >
                                {cancelText}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.confirmPrimaryButton,
                                { backgroundColor: danger ? COLORS.primary : COLORS.primary },
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmPrimaryText}>{confirmText}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function MessageModal({
    visible,
    title,
    message,
    icon,
    buttonText,
    theme,
    isRTL,
    onClose,
}: {
    visible: boolean;
    title: string;
    message: string;
    icon: keyof typeof Feather.glyphMap;
    buttonText: string;
    theme: any;
    isRTL: boolean;
    onClose: () => void;
}) {
    const textAlign = isRTL ? "right" : "left";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View
                style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
            >
                <View
                    style={[
                        styles.confirmModal,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.confirmIconCircle,
                            { backgroundColor: theme.iconBg },
                        ]}
                    >
                        <Feather name={icon} size={28} color={theme.iconColor} />
                    </View>

                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {title}
                    </Text>

                    <Text
                        style={[
                            styles.confirmMessage,
                            { color: theme.textSecondary, textAlign },
                        ]}
                    >
                        {message}
                    </Text>

                    <Pressable
                        style={[
                            styles.singleModalButton,
                            { backgroundColor: COLORS.primary },
                        ]}
                        onPress={onClose}
                    >
                        <Text style={styles.confirmPrimaryText}>{buttonText}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

function LogoutLoadingModal({
    visible,
    text,
    theme,
}: {
    visible: boolean;
    text: string;
    theme: any;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View
                style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
            >
                <View
                    style={[
                        styles.logoutLoadingBox,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.logoutLoadingIconCircle,
                            { backgroundColor: theme.iconBg },
                        ]}
                    >
                        <Feather name="log-out" size={28} color={theme.iconColor} />
                    </View>

                    <ActivityIndicator
                        size="small"
                        color={theme.iconColor}
                        style={styles.logoutLoadingSpinner}
                    />

                    <Text style={[styles.logoutLoadingText, { color: theme.textPrimary }]}>
                        {text}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    header: {
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 10,
    },

    headerSide: {
        width: 40,
        height: 40,
    },

    headerDivider: {
        height: 1,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: 0.2,
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        paddingHorizontal: 18,
        paddingBottom: 130,
        paddingTop: 14,
    },

    sectionTitle: {
        fontSize: 12,
        marginTop: 18,
        marginBottom: 10,
        fontWeight: "800",
        letterSpacing: 0.2,
    },

    card: {
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },

    accountCard: {
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "rgba(135,27,23,0.20)",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 15,
        marginBottom: 10,
        shadowColor: "#6E1411",
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: Platform.OS === "android" ? 0.14 : 0.2,
        shadowRadius: 12,
        elevation: 5,
    },

    settingRow: {
        alignItems: "center",
        justifyContent: "space-between",
    },

    settingLabelContainer: {
        alignItems: "center",
        flex: 1,
        minWidth: 0,
    },

    iconWrapper: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },

    smallIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },

    avatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },

    accountAvatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
    },

    labelBlock: {
        flex: 1,
        minWidth: 0,
    },

    settingLabel: {
        fontSize: 14,
        fontWeight: "800",
    },

    actionLabel: {
        fontSize: 13.5,
        fontWeight: "900",
    },

    settingHint: {
        fontSize: 12,
        marginTop: 4,
        lineHeight: 17,
    },

    userInfo: {
        flex: 1,
        minWidth: 0,
    },

    userName: {
        fontSize: 17,
        fontWeight: "900",
    },

    userEmail: {
        fontSize: 12,
        marginTop: 5,
        opacity: 0.86,
    },

    userIdText: {
        fontSize: 10.5,
        marginTop: 5,
        opacity: 0.72,
    },

    connectionPanel: {
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 10,
        overflow: "hidden",
        paddingBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },

    statusGrid: {
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
    },

    miniStatusCard: {
        flex: 1,
        borderRadius: 18,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
    },

    miniStatusTitle: {
        fontSize: 10.5,
        fontWeight: "700",
        textAlign: "center",
    },

    miniStatusText: {
        fontSize: 12,
        fontWeight: "900",
        textAlign: "center",
    },

    panelDivider: {
        height: 1,
        marginHorizontal: 16,
    },

    connectionRow: {
        paddingHorizontal: 16,
        paddingVertical: 14,
    },

    actionButton: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 13,
    },

    segment: {
        flexDirection: "row",
        borderRadius: 10,
        padding: 3,
    },

    segmentItem: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
    },

    segmentItemActive: {
        backgroundColor: COLORS.primary,
    },

    segmentText: {
        fontSize: 13,
        fontWeight: "800",
    },

    segmentTextActive: {
        color: "#FFFFFF",
    },

    logoutSection: {
        marginTop: 18,
    },

    logoutButtonWrapper: {
        width: "100%",
        height: 64,
        borderRadius: 30,
        overflow: "hidden",
        shadowColor: "#6E1411",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
        shadowRadius: 14,
        elevation: 6,
        backgroundColor: COLORS.primary,
    },

    logoutButtonDisabled: {
        opacity: 0.72,
    },

    logoutGradient: {
        flex: 1,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },

    logoutShine: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "48%",
        backgroundColor: "rgba(255,255,255,0.10)",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },

    logoutInner: {
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        zIndex: 5,
    },

    logoutSpinner: {
        marginHorizontal: 2,
    },

    logoutText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 20,
        textAlign: "center",
    },

    switchTrack: {
        width: 52,
        height: 30,
        borderRadius: 15,
        padding: 2,
        justifyContent: "center",
    },

    switchThumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },

    modalOverlay: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
    },

    helpModal: {
        width: "100%",
        height: "86%",
        borderRadius: 30,
        borderWidth: 1,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 8,
    },

    helpModalHeader: {
        minHeight: 72,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
    },

    modalCloseButton: {
        position: "absolute",
        top: 15,
        left: 16,
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
    },

    helpModalTitle: {
        fontSize: 18,
        fontWeight: "900",
        textAlign: "center",
    },

    modalHeaderSpace: {
        width: 42,
        height: 42,
    },

    modalDivider: {
        height: 1,
    },

    helpModalScroll: {
        flex: 1,
    },

    helpModalContent: {
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 34,
    },

    helpModalBody: {
        minHeight: 620,
    },

    helpParagraph: {
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 24,
        marginBottom: 14,
    },

    confirmModal: {
        width: "100%",
        borderRadius: 28,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 8,
    },

    confirmIconCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },

    confirmTitle: {
        fontSize: 18,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 8,
    },

    confirmMessage: {
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 22,
        marginBottom: 20,
    },

    confirmButtons: {
        width: "100%",
        gap: 10,
    },

    confirmSecondaryButton: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    confirmPrimaryButton: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },

    confirmSecondaryText: {
        fontSize: 14,
        fontWeight: "900",
    },

    confirmPrimaryText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },

    singleModalButton: {
        width: "100%",
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },

    logoutLoadingBox: {
        width: "86%",
        borderRadius: 28,
        borderWidth: 1,
        paddingHorizontal: 22,
        paddingTop: 28,
        paddingBottom: 26,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 8,
    },

    logoutLoadingIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },

    logoutLoadingSpinner: {
        marginBottom: 12,
    },

    logoutLoadingText: {
        fontSize: 16,
        fontWeight: "900",
        textAlign: "center",
    },
    helpSectionTitle: {
        fontSize: 15.5,
        fontWeight: "900",
        lineHeight: 24,
        marginTop: 12,
        marginBottom: 8,
    },
    carInfoGrid: {
        gap: 10,
        marginTop: 14,
    },

    carInfoPill: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    carInfoLabel: {
        fontSize: 10.5,
        fontWeight: "800",
        textAlign: "center",
    },

    carInfoValue: {
        marginTop: 4,
        fontSize: 13,
        fontWeight: "900",
        textAlign: "center",
    },

    loadingSettingsContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    nameInput: {
        width: "100%",
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 14,
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 18,
    },

});