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
import { useRouter } from "expo-router";
import { useCars, UserCar } from "../../providers/CarsProvider";
import { useAppSettings } from "../../providers/AppSettingsProvider";
import { useNotifications } from "../../providers/NotificationsProvider";
import { useAccountSettings } from "../../providers/AccountSettingsProvider";


import {
    EditNameModal,
    EditEmailModal,
    DeleteAccountModal,
    LogoutLoadingModal,
} from "../../components/settings/AccountModals";
import { EditCarNameModal } from "../../components/settings/CarModals";
import {
    ConfirmModal,
    MessageModal,
} from "../../components/settings/CommonModals";
import { HelpModal } from "../../components/settings/HelpModal";





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


function AppSwitch({
    value,
    onValueChange,
    trackOnColor = COLORS.primary,
    trackOffColor = "#E5E5E5",
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
            duration: 180,
            useNativeDriver: true,
        }).start();
    }, [value, anim]);

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [3, 27],
    });

    return (
        <Pressable
            onPress={() => onValueChange(!value)}
            style={({ pressed }) => [
                styles.switchTrack,
                {
                    backgroundColor: value ? trackOnColor : trackOffColor,
                    opacity: pressed ? 0.85 : 1,
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


    const {
        obdConnected,
        scannerRunning,
        mqttConnected,
        lastConnectionTime,
        selectedCarId,
        connectedCarId,
        userCars,
        selectDefaultCar,
        renameCar,
        deleteCar,
        stopScanner,
        disconnectObd,
    } = useCars();


    const {
        settingsLoading,
        savingSettings,
        selectedLanguage,
        darkModeEnabled,
        notificationsEnabled,
        handleLanguageChange,
        handleDarkModeChange,
    } = useAppSettings();

    const { handleNotificationsChange } = useNotifications();


    const {
        updateName,
        updateEmail,
        deleteAccount,
        logout,
    } = useAccountSettings();

    const [loggingOut, setLoggingOut] = useState(false);

    const [displayName, setDisplayName] = useState("");

    const [editCarVisible, setEditCarVisible] = useState(false);
    const [selectedCarForEdit, setSelectedCarForEdit] = useState<UserCar | null>(null);
    const [carNameInput, setCarNameInput] = useState("");
    const [savingCarName, setSavingCarName] = useState(false);

    const [switchingCarId, setSwitchingCarId] = useState<string | null>(null);
    const [optimisticSelectedCarId, setOptimisticSelectedCarId] = useState<string | null>(null);

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

    const [confirmDeleteCarVisible, setConfirmDeleteCarVisible] = useState(false);
    const [carToDelete, setCarToDelete] = useState<UserCar | null>(null);


    const t = translations[selectedLanguage];
    const isRTL = selectedLanguage === "AR";
    const theme = darkModeEnabled ? darkTheme : lightTheme;

    const activeSelectedCarId = optimisticSelectedCarId || selectedCarId;

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




    const handleSelectDefaultCar = async (carId: string) => {
        if (switchingCarId) return;
        if (carId === activeSelectedCarId) return;

        const previousCarId = activeSelectedCarId;

        setSwitchingCarId(carId);
        setOptimisticSelectedCarId(carId);

        try {
            await selectDefaultCar(carId);

            setOptimisticSelectedCarId(null);
        } catch (error) {
            console.log("Select car error:", error);

            setOptimisticSelectedCarId(previousCarId);

            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "تعذر اختيار السيارة. رجعنا للاختيار السابق."
                        : "Could not select car. Restored previous selection.",
                icon: "alert-circle",
            });
        } finally {
            setSwitchingCarId(null);
        }
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
            await renameCar(selectedCarForEdit.id, carNameInput);

            setEditCarVisible(false);
            setSelectedCarForEdit(null);
            setCarNameInput("");

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
            await deleteCar(car);

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

    const openSupportEmail = () => {
        const subject = encodeURIComponent("Tnabbah Support Request");
        const body = encodeURIComponent(
            `User ID: ${userId}\nEmail: ${userEmail}\nCurrent Car: ${selectedCarId || "—"}\n\nاكتبي مشكلتك هنا:\n`
        );

        Linking.openURL(`mailto:tanbbahteem@gmail.com?subject=${subject}&body=${body}`);
    };

    const openWhatsAppSupport = () => {
        const message = encodeURIComponent(
            `مرحبا، أحتاج مساعدة في تطبيق تنبّه.\nUser ID: ${userId}\nCurrent Car: ${selectedCarId || "—"}`
        );

        Linking.openURL(`https://wa.me/966560602239?text=${message}`);
    };

    const sendIssueReport = () => {
        const subject = encodeURIComponent("Tnabbah Issue Report");
        const body = encodeURIComponent(
            `Issue Report\n\nUser ID: ${userId}\nEmail: ${userEmail}\nCurrent Car: ${connectedCarId || "—"}\nOBD Connected: ${obdConnected}\nScanner Running: ${scannerRunning}\nMQTT Connected: ${mqttConnected}\nLast Connection: ${lastConnectionTime || "—"}\n\nDescribe the issue:\n`
        );

        Linking.openURL(`mailto:tanbbahteem@gmail.com?subject=${subject}&body=${body}`);
    };

    const handleStopScanner = async () => {
        try {
            await stopScanner();

            showMessage({
                title: t.done,
                body: t.monitoringPaused,
                icon: "pause-circle",
            });
        } catch (error) {
            console.log("Stop scanner error:", error);

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
            await disconnectObd();

            showMessage({
                title: t.done,
                body: t.disconnectedDone,
                icon: "check-circle",
            });
        } catch (error) {
            console.log("Disconnect OBD error:", error);

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
            await updateName(cleanName);

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
            await updateEmail(cleanEmail);

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
            await deleteAccount(deletePassword);

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
        if (loggingOut) return;

        setConfirmLogoutVisible(false);
        setLoggingOut(true);

        try {
            await logout(disconnectObd);

            router.replace("/start" as any);
        } catch (error) {
            console.log("Logout error:", error);
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
                                    {userCars.find((car) => car.car_id === activeSelectedCarId)?.display_name ||
                                        activeSelectedCarId ||
                                        t.noCar}
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
                                {userCars.length}
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


                    <Text
                        style={{
                            color: connectedCarId ? COLORS.success : theme.textSecondary,
                            textAlign,
                            marginTop: 10,
                            fontSize: 12,
                            fontWeight: "700",
                        }}
                    >
                        {connectedCarId
                            ? selectedLanguage === "AR"
                                ? `السيارة المتصلة الآن: ${userCars.find((car) => car.car_id === connectedCarId)?.display_name ||
                                connectedCarId
                                }`
                                : `Connected now: ${userCars.find((car) => car.car_id === connectedCarId)?.display_name ||
                                connectedCarId
                                }`
                            : selectedLanguage === "AR"
                                ? "لا توجد سيارة متصلة الآن"
                                : "No car is connected now"}
                    </Text>

                    <View
                        style={[
                            styles.panelDivider,
                            { backgroundColor: theme.headerDivider, marginTop: 16 },
                        ]}
                    />


                    {userCars.length === 0 ? (
                        <Text
                            style={{
                                color: theme.textSecondary,
                                textAlign,
                                marginTop: 16,
                                fontSize: 13,
                            }}
                        >
                            {connectedCarId
                                ? selectedLanguage === "AR"
                                    ? "تم العثور على آخر سيارة متصلة، وسيتم حفظها عند وصول أول تحديث اتصال."
                                    : "Last connected car found. It will be saved when the next connection update arrives."
                                : selectedLanguage === "AR"
                                    ? "لا توجد سيارات محفوظة بعد. اربطي قطعة السيارة لإضافة أول سيارة."
                                    : "No saved cars yet. Connect a device to add your first car."}
                        </Text>
                    ) : (
                        <View style={{ marginTop: 12, gap: 12 }}>
                            {userCars.map((car) => {
                                const isCurrent = activeSelectedCarId === car.car_id;
                                const isSwitchingThisCar = switchingCarId === car.car_id;
                                const isConnectedNow = connectedCarId === car.car_id;

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

                                                    {isConnectedNow && (
                                                        <View
                                                            style={{
                                                                alignSelf: isRTL ? "flex-end" : "flex-start",
                                                                backgroundColor: theme.successBg,
                                                                borderRadius: 999,
                                                                paddingHorizontal: 10,
                                                                paddingVertical: 4,
                                                                marginTop: 6,
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    color: COLORS.success,
                                                                    fontSize: 11,
                                                                    fontWeight: "800",
                                                                }}
                                                            >
                                                                {selectedLanguage === "AR" ? "متصلة الآن" : "Connected now"}
                                                            </Text>
                                                        </View>
                                                    )}

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
                                                    onPress={() => handleSelectDefaultCar(car.car_id)}
                                                    disabled={!!switchingCarId}
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 10,
                                                        borderRadius: 12,
                                                        opacity: switchingCarId ? 0.65 : 1,
                                                    }}
                                                >
                                                    {isSwitchingThisCar ? (
                                                        <ActivityIndicator size="small" color="#FFF" />
                                                    ) : (
                                                        <Text
                                                            style={{
                                                                color: "#FFF",
                                                                fontSize: 12,
                                                                fontWeight: "700",
                                                            }}
                                                        >
                                                            {selectedLanguage === "AR" ? "تعيين" : "Set"}
                                                        </Text>
                                                    )}
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
                                                onPress={() => {
                                                    setCarToDelete(car);
                                                    setConfirmDeleteCarVisible(true);
                                                }}
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

                        <View
                            style={[
                                styles.miniStatusCard,
                                {
                                    backgroundColor: mqttConnected ? theme.successBg : theme.dangerBg,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Feather
                                name="wifi"
                                size={17}
                                color={mqttConnected ? COLORS.success : COLORS.danger}
                            />

                            <Text style={[styles.miniStatusTitle, { color: theme.textSecondary }]}>
                                MQTT
                            </Text>

                            <Text
                                style={[
                                    styles.miniStatusText,
                                    { color: mqttConnected ? COLORS.success : COLORS.danger },
                                ]}
                            >
                                {mqttConnected ? t.connected : t.disconnected}
                            </Text>
                        </View>

                    </View>

                    {lastConnectionTime && (
                        <Text
                            style={{
                                color: theme.textSecondary,
                                textAlign,
                                fontSize: 12,
                                fontWeight: "700",
                                paddingHorizontal: 16,
                                paddingBottom: 12,
                            }}
                        >
                            {selectedLanguage === "AR" ? "آخر اتصال:" : "Last connection:"}{" "}
                            {new Date(lastConnectionTime).toLocaleString()}
                        </Text>
                    )}

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
                            pressed && scannerRunning && {
                                backgroundColor: theme.cardPressed,
                            },
                            !scannerRunning && { opacity: 0.45 },
                        ]}
                        onPress={handleStopScanner}
                        disabled={!scannerRunning}
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
                            pressed && obdConnected && {
                                backgroundColor: theme.cardPressed,
                            },
                            !obdConnected && { opacity: 0.45 },
                        ]}
                        onPress={() => {
                            if (!obdConnected) return;
                            setConfirmDisconnectVisible(true);
                        }}
                        disabled={!obdConnected}
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

            {switchingCarId && (
                <View style={styles.fullScreenBlockingOverlay}>
                    <View
                        style={[
                            styles.blockingOverlayCard,
                            { backgroundColor: theme.surface },
                        ]}
                    >
                        <ActivityIndicator size="small" color={COLORS.primary} />

                        <Text
                            style={[
                                styles.blockingOverlayText,
                                { color: theme.textPrimary },
                            ]}
                        >
                            {selectedLanguage === "AR"
                                ? "جاري تبديل السيارة..."
                                : "Switching vehicle..."}
                        </Text>
                    </View>
                </View>
            )}

            <HelpModal
                visible={helpVisible}
                onClose={() => setHelpVisible(false)}
                t={t}
                theme={theme}
                isRTL={isRTL}
                onEmail={openSupportEmail}
                onWhatsApp={openWhatsAppSupport}
                onIssue={sendIssueReport}
                styles={styles}
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
                styles={styles}
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
                styles={styles}
                onCancel={() => setConfirmDisconnectVisible(false)}
                onConfirm={handleDisconnectObd}
            />

            <ConfirmModal
                visible={confirmDeleteCarVisible}
                title={selectedLanguage === "AR" ? "حذف السيارة" : "Delete Car"}
                message={
                    selectedLanguage === "AR"
                        ? "هل أنتِ متأكدة؟ سيتم حذف السيارة من قائمتك، وإذا كانت متصلة سيتم فصل الاتصال وإيقاف المتابعة."
                        : "Are you sure? This car will be removed from your list. If it is connected, the connection will be ended."
                }
                confirmText={selectedLanguage === "AR" ? "حذف" : "Delete"}
                cancelText={t.cancel}
                icon="trash-2"
                theme={theme}
                isRTL={isRTL}
                danger
                styles={styles}
                onCancel={() => {
                    setConfirmDeleteCarVisible(false);
                    setCarToDelete(null);
                }}
                onConfirm={async () => {
                    if (!carToDelete) return;
                    setConfirmDeleteCarVisible(false);
                    await handleDeleteCar(carToDelete);
                    setCarToDelete(null);
                }}
            />

            <MessageModal
                visible={messageVisible}
                title={messageTitle}
                message={messageBody}
                icon={messageIcon}
                buttonText={t.ok}
                theme={theme}
                isRTL={isRTL}
                styles={styles}
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
                styles={styles}
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
                styles={styles}
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
                styles={styles}
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
                styles={styles}
            />



            <LogoutLoadingModal
                visible={loggingOut}
                text={t.loggingOut}
                theme={theme}
                styles={styles}
            />
        </SafeAreaView>
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
        width: 56,
        height: 32,
        borderRadius: 18,
        padding: 3,
        justifyContent: "center",
    },

    switchThumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 3,
    },

    modalOverlay: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
    },

    /* helpModal: {
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
    }, */

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

    helpModal: {
        width: "90%",
        maxHeight: "82%",
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
    },

    helpCard: {
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },

    helpTitle: {
        fontSize: 18,
        fontWeight: "900",
    },

    helpQuestion: {
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 6,
    },

    helpAnswer: {
        fontSize: 13,
        lineHeight: 22,
        fontWeight: "600",
    },

    supportButton: {
        height: 52,
        borderRadius: 16,
        marginTop: 10,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },

    supportButtonText: {
        color: "#FFFFFF",
        fontWeight: "800",
        fontSize: 14,
    },

    supportIssueText: {
        fontWeight: "800",
        fontSize: 14,
    },

    closeHelpButton: {
        marginTop: 18,
        height: 50,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },

    fullScreenBlockingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.22)",
        zIndex: 9999,
        elevation: 9999,
        alignItems: "center",
        justifyContent: "center",
    },

    blockingOverlayCard: {
        minWidth: 210,
        borderRadius: 24,
        paddingVertical: 22,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",

        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 8,
    },

    blockingOverlayText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: "900",
        textAlign: "center",
    },
});