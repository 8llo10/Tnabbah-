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
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../providers/AuthProvider";

import { useCars, UserCar } from "../../providers/CarsProvider";
import { useAppSettings } from "../../providers/AppSettingsProvider";
import { useNotifications } from "../../providers/NotificationsProvider";
import { useAccountSettings } from "../../providers/AccountSettingsProvider";
import { useLanguage } from "../../providers/LanguageProvider";

import {
    EditNameModal,
    EditEmailModal,
    DeleteAccountModal,
    LogoutLoadingModal,
} from "../../components/settings/AccountModals";
import { EditCarNameModal } from "../../components/settings/CarModals";
import { ConfirmModal } from "../../components/settings/CommonModals";

const COLORS = {
    primary: "#871B17",
    primary2: "#9A211C",
    primaryPressed: "#6F1512",
    primaryDark: "#761713",

    // خليته غامق بدل الأحمر الفاتح
    danger: "#871B17",

    success: "#2E7D32",
    white: "#FFFFFF",
};

const MAX_NAME_LENGTH = 20;

const lightTheme = {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    border: "#D8D8D8",
    cardBorder: "#DCDCDC",
    textPrimary: "#1D1D1F",
    textSecondary: "#707070",
    iconBg: "#F0F1F3",
    iconColor: "#871B17",
    subtle: "#F6F6F6",
    headerDivider: "#E4E4E4",
    cardPressed: "#FAFAFA",
    dangerBg: "#FFF1F1",
    successBg: "#EFFAF3",
    modalOverlay: "rgba(0,0,0,0.32)",
};

const darkTheme = {
    background: "#151515",
    surface: "#202020",
    border: "#3A3A3A",
    cardBorder: "#383838",
    textPrimary: "#FFFFFF",
    textSecondary: "#C7C7C7",

    // Dark mode icons use the same warm red family as the account card
    iconBg: "rgba(255,255,255,0.08)",
    iconColor: "#D04740",

    subtle: "#292929",
    headerDivider: "#343434",
    cardPressed: "#2E2E2E",
    dangerBg: "rgba(135,27,23,0.18)",
    successBg: "rgba(46,125,50,0.18)",
    modalOverlay: "rgba(0,0,0,0.62)",
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
        help: "تواصل مع الدعم",
        helpDesc: "للاستفسارات أو الإبلاغ عن مشكلة في التطبيق",
        supportEmailButton: "إرسال بريد للدعم",
        supportWhatsAppButton: "التواصل عبر واتساب",
        reportIssueButton: "الإبلاغ عن مشكلة",
        helpIntro:
            "إذا واجهت مشكلة أو عندك استفسار، أرسلي لنا التفاصيل وسنساعدك في أقرب وقت.",
        faqTitle: "الأسئلة الشائعة",
        faqConnectionQuestion: "كيف أوصل قطعة السيارة؟",
        faqConnectionAnswer:
            "من صفحة الاتصال اختاري البلوتوث ثم اختاري قطعة السيارة وابدئي الفحص.",
        faqNotificationsQuestion: "لماذا لا تظهر السيارة؟",
        faqNotificationsAnswer:
            "تأكدي أن القطعة تعمل وأن البلوتوث والصلاحيات مفعلة.",
        faqReportQuestion: "هل التطبيق يحفظ بيانات السيارة؟",
        faqReportAnswer:
            "يتم حفظ البيانات الضرورية فقط لتحسين تجربتك وعرض التقارير.",

        vehicleConnection: "اتصال السيارة",
        bluetoothSettings: "ربط قطعة السيارة",
        bluetoothSettingsDesc: "ربط أو تغيير قطعة السيارة",
        deviceStatus: "اتصال القطعة",
        scanStatus: "قراءة بيانات السيارة",
        dataConnection: "اتصال البيانات",
        connected: "متصل",
        disconnected: "غير متصل",
        scannerOn: "تعمل الآن",
        scannerOff: "متوقفة",

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
        nameLimitError: "الاسم يجب ألا يتجاوز 20 حرفًا.",
        emailSameError: "اكتبي بريدًا إلكترونيًا مختلفًا عن البريد الحالي.",
        emailChangeSentTitle: "تم إرسال رابط التأكيد",
        emailChangeSentBody:
            "افتحي البريد الإلكتروني الجديد واضغطي على رابط تأكيد تغيير البريد لإكمال العملية.",
        emailChangeError:
            "تعذر إرسال رابط تغيير البريد. تأكدي من البريد أو حاولي مرة أخرى.",

        totalCars: "عدد السيارات",
        carConnection: "اتصال السيارة الحالية",

        notificationsDeniedTitle: "الإشعارات غير مفعّلة",
        notificationsDeniedBody:
            "فعّلي الإشعارات من إعدادات الجهاز حتى تصلك التنبيهات.",
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
        help: "Contact Support",
        helpDesc: "For questions or reporting an app issue",
        supportEmailButton: "Email Support",
        supportWhatsAppButton: "Contact via WhatsApp",
        reportIssueButton: "Report an Issue",
        helpIntro:
            "If you have a question or an issue, send us the details and we will help you as soon as possible.",
        faqTitle: "FAQs",
        faqConnectionQuestion: "How do I connect the car device?",
        faqConnectionAnswer:
            "Open the connection page, choose Bluetooth, select the car device, then start the scan.",
        faqNotificationsQuestion: "Why does my car not appear?",
        faqNotificationsAnswer:
            "Make sure the device is powered on and Bluetooth permissions are enabled.",
        faqReportQuestion: "Does the app save car data?",
        faqReportAnswer:
            "Only the necessary data is saved to improve your experience and show reports.",

        vehicleConnection: "Car Connection",
        bluetoothSettings: "Connect Car Device",
        bluetoothSettingsDesc: "Connect or change the car device",
        deviceStatus: "Device Connection",
        scanStatus: "Car Data Reading",
        dataConnection: "Data Connection",
        connected: "Connected",
        disconnected: "Disconnected",
        scannerOn: "Running",
        scannerOff: "Stopped",

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
        nameLimitError: "Name must be 20 characters or less.",
        emailSameError: "Enter an email address different from your current email.",
        emailChangeSentTitle: "Confirmation link sent",
        emailChangeSentBody:
            "Open your new email and tap the confirmation link to complete the change.",
        emailChangeError:
            "Could not send the email change link. Check the email or try again.",

        totalCars: "Total Cars",
        carConnection: "Current Car Connection",

        notificationsDeniedTitle: "Notifications disabled",
        notificationsDeniedBody:
            "Enable notifications from device settings to receive alerts.",
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

function AppMessageModal({
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
    message?: string;
    icon: keyof typeof Feather.glyphMap;
    buttonText: string;
    theme: typeof lightTheme;
    isRTL: boolean;
    onClose: () => void;
}) {
    const isSuccess = icon === "check-circle";
    const isError = icon === "alert-circle";
    const lottieRef = useRef<LottieView>(null);
    const iconColor = isError ? COLORS.danger : COLORS.primary;
    const iconBackground = isError ? "rgba(135,27,23,0.12)" : theme.iconBg;

    const successScale = useRef(new Animated.Value(0.35)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;
    const pulseOneScale = useRef(new Animated.Value(0.65)).current;
    const pulseOneOpacity = useRef(new Animated.Value(0)).current;
    const pulseTwoScale = useRef(new Animated.Value(0.65)).current;
    const pulseTwoOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible || !isSuccess) return;

        lottieRef.current?.reset();

        const playTimer = setTimeout(() => {
            lottieRef.current?.play(0);
        }, 80);

        successScale.setValue(0.35);
        successOpacity.setValue(0);
        pulseOneScale.setValue(0.65);
        pulseOneOpacity.setValue(0.45);
        pulseTwoScale.setValue(0.65);
        pulseTwoOpacity.setValue(0.32);

        Animated.parallel([
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(successOpacity, {
                        toValue: 1,
                        duration: 120,
                        useNativeDriver: true,
                    }),
                    Animated.spring(successScale, {
                        toValue: 1.14,
                        friction: 5,
                        tension: 90,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.spring(successScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 70,
                    useNativeDriver: true,
                }),
            ]),
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(pulseOneScale, {
                        toValue: 1.75,
                        duration: 760,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseOneOpacity, {
                        toValue: 0,
                        duration: 760,
                        useNativeDriver: true,
                    }),
                ]),
            ]),
            Animated.sequence([
                Animated.delay(150),
                Animated.parallel([
                    Animated.timing(pulseTwoScale, {
                        toValue: 1.95,
                        duration: 780,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseTwoOpacity, {
                        toValue: 0,
                        duration: 780,
                        useNativeDriver: true,
                    }),
                ]),
            ]),
        ]).start();

        const timer = setTimeout(() => {
            onClose();
        }, 2300);

        return () => {
            clearTimeout(playTimer);
            clearTimeout(timer);
        };
    }, [
        visible,
        isSuccess,
        onClose,
        successScale,
        successOpacity,
        pulseOneScale,
        pulseOneOpacity,
        pulseTwoScale,
        pulseTwoOpacity,
    ]);

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
                    {isSuccess ? (
                        <View style={styles.successAnimationWrapper}>
                            <LottieView
                                ref={lottieRef}
                                source={require("../../assets/animations/success-check.json")}
                                loop={false}
                                speed={0.55}
                                style={styles.successLottie}
                            />
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.appMessageIconCircle,
                                { backgroundColor: iconBackground },
                            ]}
                        >
                            <Feather name={icon} size={28} color={iconColor} />
                        </View>
                    )}

                    <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                        {title}
                    </Text>

                    {!!message?.trim() && (
                        <Text
                            style={[
                                styles.confirmMessage,
                                {
                                    color: theme.textSecondary,
                                    textAlign: isRTL ? "right" : "left",
                                },
                            ]}
                        >
                            {message}
                        </Text>
                    )}

                    {!isSuccess && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.singleModalButton,
                                {
                                    backgroundColor: COLORS.primary,
                                    opacity: pressed ? 0.9 : 1,
                                    marginTop: message?.trim() ? 0 : 10,
                                },
                            ]}
                            onPress={onClose}
                        >
                            <Text style={styles.confirmPrimaryText}>{buttonText}</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </Modal>
    );
}

export default function Settings() {
    const { profile, session } = useAuth();
    const router = useRouter();
    const { language, changeLanguage } = useLanguage();

    const {
        obdConnected,
        scannerRunning,
        mqttConnected,
        detectingCar,
        lastConnectionTime,
        activeCarId,
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
        darkModeEnabled,
        notificationsEnabled,
        handleLanguageChange: saveAppLanguageChange,
        handleDarkModeChange,
    } = useAppSettings();

    const { handleNotificationsChange } = useNotifications();

    const { updateName, deleteAccount, logout } = useAccountSettings();

    const [loggingOut, setLoggingOut] = useState(false);

    const [displayName, setDisplayName] = useState("");

    const [editCarVisible, setEditCarVisible] = useState(false);
    const [selectedCarForEdit, setSelectedCarForEdit] = useState<UserCar | null>(
        null,
    );
    const [carNameInput, setCarNameInput] = useState("");
    const [savingCarName, setSavingCarName] = useState(false);

    const [switchingCarId, setSwitchingCarId] = useState<string | null>(null);
    const [optimisticSelectedCarId, setOptimisticSelectedCarId] = useState<
        string | null
    >(null);

    const [helpVisible, setHelpVisible] = useState(false);
    const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);
    const [confirmDisconnectVisible, setConfirmDisconnectVisible] =
        useState(false);

    const [editNameVisible, setEditNameVisible] = useState(false);
    const [fullNameInput, setFullNameInput] = useState("");
    const [savingName, setSavingName] = useState(false);

    const [messageVisible, setMessageVisible] = useState(false);
    const [messageTitle, setMessageTitle] = useState("");
    const [messageBody, setMessageBody] = useState("");
    const [messageIcon, setMessageIcon] =
        useState<keyof typeof Feather.glyphMap>("check-circle");

    const [editEmailVisible, setEditEmailVisible] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [savingEmail, setSavingEmail] = useState(false);

    const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);

    const [confirmDeleteCarVisible, setConfirmDeleteCarVisible] = useState(false);
    const [carToDelete, setCarToDelete] = useState<UserCar | null>(null);

    const [deleteCarPassword, setDeleteCarPassword] = useState("");
    const [deletingCar, setDeletingCar] = useState(false);

    const selectedLanguage = language;
    const t = translations[selectedLanguage];
    const isRTL = selectedLanguage === "AR";
    const theme = darkModeEnabled ? darkTheme : lightTheme;

    const handleSettingsLanguageChange = async (lang: "AR" | "EN") => {
        await changeLanguage(lang);

        try {
            await saveAppLanguageChange(lang);
        } catch (error) {
            console.log("Save language settings error:", error);
        }
    };

    const activeSelectedCarId =
        connectedCarId ||
        optimisticSelectedCarId ||
        selectedCarId ||
        activeCarId;

    const userName =
        profile?.full_name || session?.user?.user_metadata?.full_name || "مستخدم";

    useEffect(() => {
        setDisplayName(userName);
    }, [userName]);

    const userEmail =
        session?.user?.email || profile?.email || profile?.username || "—";

    const userId = session?.user?.id || "—";

    const handleSelectDefaultCar = async (carId: string) => {
        if (switchingCarId) return;
        if (carId === activeSelectedCarId) return;

        setSwitchingCarId(carId);
        setOptimisticSelectedCarId(carId);

        try {
            await selectDefaultCar(carId);
            setOptimisticSelectedCarId(null);
        } catch (error) {
            console.log("Select car error:", error);

            setOptimisticSelectedCarId(null);

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
                title:
                    selectedLanguage === "AR"
                        ? "تم تحديث اسم السيارة"
                        : "Car name updated",
                body: "",
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
        if (!deleteCarPassword.trim()) {
            showMessage({
                title: t.errorTitle,
                body: selectedLanguage === "AR" ? "اكتبي كلمة مرور الحساب." : "Enter your account password.",
                icon: "alert-circle",
            });
            return;
        }

        setDeletingCar(true);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: userEmail,
                password: deleteCarPassword,
            });

            if (signInError) throw signInError;

            await deleteCar(car);

            setConfirmDeleteCarVisible(false);
            setCarToDelete(null);
            setDeleteCarPassword("");

            showMessage({
                title: selectedLanguage === "AR" ? "تم حذف السيارة بالكامل" : "Car deleted completely",
                body: "",
                icon: "check-circle",
            });
        } catch (error) {
            console.log("Delete car error:", error);

            showMessage({
                title: t.errorTitle,
                body: selectedLanguage === "AR" ? "كلمة المرور غير صحيحة أو تعذر حذف السيارة." : "Wrong password or could not delete car.",
                icon: "alert-circle",
            });
        } finally {
            setDeletingCar(false);
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
            selectedLanguage === "AR"
                ? `مرحبًا فريق تنبّه،\n\nأحتاج مساعدة بخصوص التطبيق.\n\nبيانات الحساب:\nUser ID: ${userId}\nEmail: ${userEmail}\nCurrent Car: ${selectedCarId || "—"}\nConnected Car: ${connectedCarId || "—"}\nCar Connection: ${obdConnected ? "Connected" : "Disconnected"}\nData Reading: ${scannerRunning ? "Running" : "Stopped"}\nLast Connection: ${lastConnectionTime || "—"}\n\nاكتبي تفاصيل الاستفسار أو المشكلة هنا:\n`
                : `Hello Tnabbah Support,\n\nI need help with the app.\n\nAccount details:\nUser ID: ${userId}\nEmail: ${userEmail}\nCurrent Car: ${selectedCarId || "—"}\nConnected Car: ${connectedCarId || "—"}\nCar Connection: ${obdConnected ? "Connected" : "Disconnected"}\nData Reading: ${scannerRunning ? "Running" : "Stopped"}\nLast Connection: ${lastConnectionTime || "—"}\n\nDescribe your question or issue here:\n`,
        );

        Linking.openURL(
            `mailto:tanbbahteem@gmail.com?subject=${subject}&body=${body}`,
        );
    };

    const openWhatsAppSupport = () => {
        const message = encodeURIComponent(
            selectedLanguage === "AR"
                ? `مرحبًا، أحتاج مساعدة في تطبيق تنبّه.
User ID: ${userId}
Email: ${userEmail}
Current Car: ${selectedCarId || "—"}`
                : `Hello, I need help with Tnabbah app.
User ID: ${userId}
Email: ${userEmail}
Current Car: ${selectedCarId || "—"}`,
        );

        Linking.openURL(`https://wa.me/966560602239?text=${message}`);
    };

    const sendIssueReport = () => {
        const subject = encodeURIComponent("Tnabbah Issue Report");
        const body = encodeURIComponent(
            `Issue Report

User ID: ${userId}
Email: ${userEmail}
Current Car: ${selectedCarId || "—"}
Connected Car: ${connectedCarId || "—"}
OBD Connected: ${obdConnected}
Scanner Running: ${scannerRunning}
Data Connection: ${mqttConnected}
Last Connection: ${lastConnectionTime || "—"}

Describe the issue:
`,
        );

        Linking.openURL(
            `mailto:tanbbahteem@gmail.com?subject=${subject}&body=${body}`,
        );
    };

    const handleStopScanner = async () => {
        try {
            await stopScanner();

            showMessage({
                title: t.monitoringPaused,
                body: "",
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
                title: t.disconnectedDone,
                body: "",
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

        if (cleanName.length > MAX_NAME_LENGTH) {
            showMessage({
                title: t.errorTitle,
                body: t.nameLimitError,
                icon: "alert-circle",
            });
            return;
        }

        setSavingName(true);

        try {
            /**
             * نحدث الاسم في كل مكان بدون نقل المستخدم للهوم:
             * 1) Provider الخاص بالحساب
             * 2) جدول profiles في Supabase
             * 3) user_metadata في Supabase Auth
             * 4) نعمل refresh للجلسة عشان الواجهات الثانية مثل Home تقرأ الاسم الجديد أسرع
             */
            await updateName(cleanName);

            const { error: profileUpdateError } = await supabase
                .from("profiles")
                .update({
                    full_name: cleanName,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", realUserId);

            if (profileUpdateError) {
                throw profileUpdateError;
            }

            const { error: authUpdateError } = await supabase.auth.updateUser({
                data: { full_name: cleanName },
            });

            if (authUpdateError) {
                throw authUpdateError;
            }

            /**
             * هذا يساعد AuthProvider والهوم يستقبلون بيانات الجلسة الجديدة أسرع.
             * لو فشل refresh ما نوقف العملية لأن الاسم تم حفظه في profiles و metadata.
             */
            const { error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
                console.log(
                    "Refresh session after name update error:",
                    refreshError.message,
                );
            }

            await supabase.auth.getUser();

            setEditNameVisible(false);
            setDisplayName(cleanName);

            showMessage({
                title: selectedLanguage === "AR" ? "تم تحديث الاسم" : "Name updated",
                body: "",
                icon: "check-circle",
            });

            /**
             * لا يوجد router.replace هنا.
             * المستخدم يبقى في الإعدادات، ولما يروح للهوم يلقى الاسم الجديد.
             */
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
        const currentEmail = userEmail !== "—" ? userEmail.trim().toLowerCase() : "";

        if (!cleanEmail || !cleanEmail.includes("@")) {
            showMessage({
                title: t.errorTitle,
                body:
                    selectedLanguage === "AR"
                        ? "اكتبي بريد إلكتروني صحيح."
                        : "Enter a valid email.",
                icon: "alert-circle",
            });
            return;
        }

        if (cleanEmail === currentEmail) {
            showMessage({
                title: t.errorTitle,
                body: t.emailSameError,
                icon: "alert-circle",
            });
            return;
        }

        setSavingEmail(true);

        try {


            const redirectTo = "tnabbah://auth/callback";



            const { error } = await supabase.auth.updateUser(
                { email: cleanEmail },
                { emailRedirectTo: "tnabbah://auth/callback" }
            );

            if (error) {
                throw error;
            }

            setEditEmailVisible(false);
            setEmailInput("");

            showMessage({
                title: t.emailChangeSentTitle,
                body: t.emailChangeSentBody,
                icon: "check-circle",
            });
        } catch (error: any) {
            console.log("Update email error:", error?.message ?? error);

            showMessage({
                title: t.errorTitle,
                body: error?.message || t.emailChangeError,
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
                        ? "تم حذف الحساب نهائيًا"
                        : "Account deleted permanently",
                body: "",
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
                style={[styles.headerDivider, { backgroundColor: theme.headerDivider }]}
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
                        setFullNameInput(
                            (displayName === "مستخدم" ? "" : displayName).slice(
                                0,
                                MAX_NAME_LENGTH,
                            ),
                        );
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
                                <View
                                    style={[
                                        styles.accountNameRow,
                                        {
                                            flexDirection: rowDirection,
                                            alignSelf: isRTL ? "flex-end" : "flex-start",
                                        },
                                    ]}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[styles.userName, { color: "#FFFFFF", textAlign }]}
                                    >
                                        {displayName || userName}
                                    </Text>
                                </View>

                                <Text
                                    numberOfLines={1}
                                    style={[styles.userEmail, { color: "#FFFFFF", textAlign }]}
                                >
                                    {userEmail}
                                </Text>
                            </View>
                        </View>

                        <Feather
                            name={isRTL ? "chevron-left" : "chevron-right"}
                            size={18}
                            color="rgba(255,255,255,0.78)"
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
                    onPress={() =>
                        router.push({
                            pathname: "/forgot-password",
                            params: {
                                email: userEmail !== "—" ? userEmail : "",
                                from: "settings",
                            },
                        } as any)
                    }
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
                                <Feather name="lock" size={20} color={theme.iconColor} />
                            </View>

                            <View style={[styles.labelBlock, { alignItems }]}>
                                <Text
                                    style={[
                                        styles.settingLabel,
                                        { color: theme.textPrimary, textAlign },
                                    ]}
                                >
                                    {selectedLanguage === "AR"
                                        ? "تغيير كلمة المرور"
                                        : "Change Password"}
                                </Text>

                                <Text
                                    style={[
                                        styles.settingHint,
                                        { color: theme.textSecondary, textAlign },
                                    ]}
                                >
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
                                <Feather name="mail" size={20} color={theme.iconColor} />
                            </View>

                            <View style={[styles.labelBlock, { alignItems }]}>
                                <Text
                                    style={[
                                        styles.settingLabel,
                                        { color: theme.textPrimary, textAlign },
                                    ]}
                                >
                                    {selectedLanguage === "AR" ? "تعديل الإيميل" : "Edit Email"}
                                </Text>

                                <Text
                                    style={[
                                        styles.settingHint,
                                        { color: theme.textSecondary, textAlign },
                                    ]}
                                >
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
                                onPress={() => handleSettingsLanguageChange("AR")}
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
                                onPress={() => handleSettingsLanguageChange("EN")}
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
                                <Ionicons name="car-sport-outline" size={20} color={theme.iconColor} />
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
                                    {userCars.find((car) => car.car_id === activeSelectedCarId)
                                        ?.display_name ||
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
                                    backgroundColor: darkModeEnabled ? "#2A2A2A" : theme.subtle,
                                    borderColor: darkModeEnabled ? "#3D3D3D" : theme.cardBorder,
                                },
                            ]}
                        >
                            <Text
                                style={[styles.carInfoLabel, { color: theme.textSecondary }]}
                            >
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
                                    backgroundColor: obdConnected
                                        ? theme.successBg
                                        : theme.dangerBg,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Text
                                style={[styles.carInfoLabel, { color: theme.textSecondary }]}
                            >
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
                                ? `السيارة المتصلة الآن: ${userCars.find((car) => car.car_id === connectedCarId)
                                    ?.display_name || connectedCarId
                                }`
                                : `Connected now: ${userCars.find((car) => car.car_id === connectedCarId)
                                    ?.display_name || connectedCarId
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

                                const isLockedByConnectedCar =
                                    (!!connectedCarId || (detectingCar && !obdConnected)) &&
                                    !isConnectedNow;

                                const canSelectThisCar =
                                    !isCurrent && !isLockedByConnectedCar && !switchingCarId;

                                return (
                                    <Pressable
                                        key={car.id}
                                        onPress={() => {
                                            if (canSelectThisCar) {
                                                handleSelectDefaultCar(car.car_id);
                                            }
                                        }}
                                        disabled={!canSelectThisCar}
                                        style={({ pressed }) => [
                                            styles.carCard,
                                            {
                                                backgroundColor: isCurrent
                                                    ? "rgba(135,27,23,0.08)"
                                                    : theme.subtle,

                                                borderColor: isCurrent
                                                    ? "#5F201D"
                                                    : theme.cardBorder,

                                                transform: [{ scale: isCurrent ? 1.01 : 1 }],
                                                shadowOpacity: isCurrent ? 0.12 : 0.03,
                                                shadowRadius: isCurrent ? 10 : 6,
                                                elevation: isCurrent ? 4 : 1,

                                                opacity: isLockedByConnectedCar ? 0.45 : 1,
                                            },
                                            pressed && canSelectThisCar && {
                                                backgroundColor: "rgba(135,27,23,0.12)",
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
                                                    <Ionicons
                                                        name="car-sport-outline"
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
                                                            `${selectedLanguage === "AR" ? "سيارة" : "Car"
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
                                                                {selectedLanguage === "AR"
                                                                    ? "متصلة الآن"
                                                                    : "Connected now"}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {isCurrent && !isConnectedNow && (
                                                        <View
                                                            style={{
                                                                alignSelf: isRTL ? "flex-end" : "flex-start",
                                                                backgroundColor: "rgba(135,27,23,0.10)",
                                                                borderRadius: 999,
                                                                paddingHorizontal: 10,
                                                                paddingVertical: 4,
                                                                marginTop: 6,
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    color: COLORS.primary,
                                                                    fontSize: 11,
                                                                    fontWeight: "900",
                                                                }}
                                                            >
                                                                {selectedLanguage === "AR" ? "مختارة حاليًا" : "Selected now"}
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
                                                            ? new Date(car.last_connected_at).toLocaleString()
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
                                                    {selectedLanguage === "AR" ? "تعديل" : "Rename"}
                                                </Text>
                                            </Pressable>

                                            <Pressable
                                                onPress={() => {
                                                    setCarToDelete(car);
                                                    setConfirmDeleteCarVisible(true);
                                                }}
                                                style={{
                                                    backgroundColor: theme.iconBg,
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
                                                    {selectedLanguage === "AR" ? "حذف" : "Delete"}
                                                </Text>
                                            </Pressable>
                                        </View>
                                    </Pressable>
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
                                style={[styles.miniStatusTitle, { color: theme.textSecondary }]}
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
                                style={[styles.miniStatusTitle, { color: theme.textSecondary }]}
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
                                    backgroundColor: mqttConnected
                                        ? theme.successBg
                                        : theme.dangerBg,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                        >
                            <Feather
                                name="wifi"
                                size={17}
                                color={mqttConnected ? COLORS.success : COLORS.danger}
                            />

                            <Text
                                style={[styles.miniStatusTitle, { color: theme.textSecondary }]}
                            >
                                {t.dataConnection}
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
                                    <Feather name="bluetooth" size={20} color={theme.iconColor} /></View>

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
                            pressed &&
                            scannerRunning && {
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
                                        { backgroundColor: theme.iconBg },
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
                            pressed &&
                            obdConnected && {
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
                                        { backgroundColor: theme.iconBg },
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
                                <Feather name="help-circle" size={20} color={theme.iconColor} />
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
                                    { backgroundColor: theme.iconBg },
                                ]}
                            >
                                <Feather name="trash-2" size={20} color={COLORS.danger} />
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
                                    {selectedLanguage === "AR" ? "حذف الحساب" : "Delete Account"}
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
                            colors={[COLORS.primary, COLORS.primaryPressed]}
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
                            style={[styles.blockingOverlayText, { color: theme.textPrimary }]}
                        >
                            {selectedLanguage === "AR"
                                ? "جاري تبديل السيارة..."
                                : "Switching vehicle..."}
                        </Text>
                    </View>
                </View>
            )}

            {detectingCar && (
                <View style={styles.fullScreenBlockingOverlay}>
                    <View
                        style={[
                            styles.blockingOverlayCard,
                            { backgroundColor: theme.surface },
                        ]}
                    >
                        <ActivityIndicator size="small" color={COLORS.primary} />

                        <Text
                            style={[styles.blockingOverlayText, { color: theme.textPrimary }]}
                        >
                            {selectedLanguage === "AR"
                                ? "جاري التعرف على السيارة..."
                                : "Detecting vehicle..."}
                        </Text>
                    </View>
                </View>
            )}

            <Modal
                visible={helpVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setHelpVisible(false)}
            >
                <View
                    style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
                >
                    <View
                        style={[
                            styles.helpModal,
                            {
                                backgroundColor: darkModeEnabled ? "#202020" : "#FFFFFF",
                                borderColor: darkModeEnabled ? "#343434" : "#DCDCDC",
                            },
                        ]}
                    >
                        <Pressable
                            onPress={() => setHelpVisible(false)}
                            hitSlop={12}
                            style={({ pressed }) => [
                                styles.helpCloseButton,
                                { opacity: pressed ? 0.5 : 1 },
                            ]}
                        >
                            <Feather
                                name="x"
                                size={23}
                                color={darkModeEnabled ? "#FFFFFF" : "#1D1D1F"}
                            />
                        </Pressable>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.helpScrollContent}
                        >
                            <View
                                style={[styles.helpHeader, { flexDirection: rowDirection }]}
                            >
                                <View
                                    style={[
                                        styles.helpHeaderIconBox,
                                        {
                                            backgroundColor: darkModeEnabled ? "#2C2C2C" : "#F3F4F6",
                                            borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                                        },
                                    ]}
                                >
                                    <Feather
                                        name="help-circle"
                                        size={34}
                                        color={COLORS.primary}
                                    />
                                </View>

                                <View style={[styles.helpHeaderTextBlock, { alignItems }]}>
                                    <Text
                                        style={[
                                            styles.helpTitle,
                                            { color: theme.textPrimary, textAlign },
                                        ]}
                                    >
                                        {t.helpSupport}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.helpIntroText,
                                            { color: theme.textSecondary, textAlign },
                                        ]}
                                    >
                                        {t.helpIntro}
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={[
                                    styles.faqCard,
                                    {
                                        backgroundColor: darkModeEnabled ? "#2A2A2A" : "#F7F7F7",
                                        borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.helpQuestion,
                                        { color: theme.textPrimary, textAlign },
                                    ]}
                                >
                                    {t.faqConnectionQuestion}
                                </Text>
                                <Text
                                    style={[
                                        styles.helpAnswer,
                                        { color: theme.textSecondary, textAlign },
                                    ]}
                                >
                                    {t.faqConnectionAnswer}
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.faqCard,
                                    {
                                        backgroundColor: darkModeEnabled ? "#2A2A2A" : "#F7F7F7",
                                        borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.helpQuestion,
                                        { color: theme.textPrimary, textAlign },
                                    ]}
                                >
                                    {t.faqNotificationsQuestion}
                                </Text>
                                <Text
                                    style={[
                                        styles.helpAnswer,
                                        { color: theme.textSecondary, textAlign },
                                    ]}
                                >
                                    {t.faqNotificationsAnswer}
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.faqCard,
                                    {
                                        backgroundColor: darkModeEnabled ? "#2A2A2A" : "#F7F7F7",
                                        borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.helpQuestion,
                                        { color: theme.textPrimary, textAlign },
                                    ]}
                                >
                                    {t.faqReportQuestion}
                                </Text>
                                <Text
                                    style={[
                                        styles.helpAnswer,
                                        { color: theme.textSecondary, textAlign },
                                    ]}
                                >
                                    {t.faqReportAnswer}
                                </Text>
                            </View>

                            <Pressable
                                onPress={openWhatsAppSupport}
                                style={({ pressed }) => [
                                    styles.supportMainButton,
                                    styles.supportWhatsAppMainButton,
                                    { opacity: pressed ? 0.88 : 1 },
                                ]}
                            >
                                <Feather name="message-circle" size={24} color="#FFFFFF" />
                                <Text style={styles.supportMainButtonText}>
                                    {t.supportWhatsAppButton}
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={openSupportEmail}
                                style={({ pressed }) => [
                                    styles.supportMainButton,
                                    styles.supportEmailMainButton,
                                    { opacity: pressed ? 0.88 : 1 },
                                ]}
                            >
                                <Feather name="mail" size={25} color="#FFFFFF" />
                                <Text style={styles.supportMainButtonText}>
                                    {t.supportEmailButton}
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={sendIssueReport}
                                style={({ pressed }) => [
                                    styles.supportIssueFullButton,
                                    {
                                        backgroundColor: darkModeEnabled ? "#2A2A2A" : "#F3F4F6",
                                        borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                                        opacity: pressed ? 0.82 : 1,
                                    },
                                ]}
                            >
                                <Feather
                                    name="alert-circle"
                                    size={24}
                                    color={darkModeEnabled ? "#FFFFFF" : "#1D1D1F"}
                                />
                                <Text
                                    style={[
                                        styles.supportIssueFullButtonText,
                                        { color: darkModeEnabled ? "#FFFFFF" : "#1D1D1F" },
                                    ]}
                                >
                                    {t.reportIssueButton}
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => setHelpVisible(false)}
                                style={({ pressed }) => [
                                    styles.closeHelpButton,
                                    {
                                        backgroundColor: darkModeEnabled ? "#252525" : "#FFFFFF",
                                        borderColor: darkModeEnabled ? "#3A3A3A" : "#DCDCDC",
                                        opacity: pressed ? 0.85 : 1,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.closeHelpButtonText,
                                        { color: theme.textPrimary },
                                    ]}
                                >
                                    {t.done}
                                </Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

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

            <DeleteAccountModal
                visible={confirmDeleteCarVisible}
                password={deleteCarPassword}
                onChangePassword={setDeleteCarPassword}
                onCancel={() => {
                    setConfirmDeleteCarVisible(false);
                    setCarToDelete(null);
                    setDeleteCarPassword("");
                }}
                onConfirm={async () => {
                    if (!carToDelete || deletingCar) return;
                    await handleDeleteCar(carToDelete);
                }}
                loading={deletingCar}
                theme={theme}
                isRTL={isRTL}
                styles={styles}
            />

            <AppMessageModal
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
                onChangeText={(text: string) =>
                    setFullNameInput(text.slice(0, MAX_NAME_LENGTH))
                }
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
        flexShrink: 1,
    },

    accountNameRow: {
        alignItems: "center",
        gap: 8,
        maxWidth: "100%",
    },

    accountEditPill: {
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    accountEditText: {
        color: "#FFFFFF",
        fontSize: 10.5,
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
        height: 56,
        borderRadius: 28,
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
        borderRadius: 28,
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
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
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
        fontSize: 18,
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

    successAnimationWrapper: {
        width: 90,
        height: 90,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },

    successLottie: {
        width: 145,
        height: 145,
    },

    successPulseRing: {
        position: "absolute",
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: "rgba(46,125,50,0.28)",
        backgroundColor: "rgba(46,125,50,0.08)",
    },

    successPulseRingSecond: {
        borderColor: "rgba(46,125,50,0.18)",
        backgroundColor: "rgba(46,125,50,0.05)",
    },

    successCheckCircle: {
        width: 66,
        height: 66,
        borderRadius: 33,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.success,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: Platform.OS === "android" ? 0.16 : 0.26,
        shadowRadius: 14,
        elevation: 6,
    },

    appMessageIconCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },

    appMessageSuccessIconCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        backgroundColor: "transparent",
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
        width: "93%",
        maxWidth: 430,
        maxHeight: "88%",
        borderRadius: 34,
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 0,
        borderWidth: 1,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: Platform.OS === "android" ? 0.22 : 0.28,
        shadowRadius: 24,
        elevation: 10,
    },

    helpScrollContent: {
        paddingHorizontal: 22,
        paddingTop: 58,
        paddingBottom: 22,
    },

    helpCloseButton: {
        position: "absolute",
        top: 16,
        left: 18,
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
    },

    helpHeader: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        gap: 14,
    },

    helpHeaderIconBox: {
        width: 72,
        height: 72,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },

    helpHeaderTextBlock: {
        flex: 1,
        minWidth: 0,
    },

    helpTitle: {
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 32,
    },

    helpIntroText: {
        fontSize: 15,
        lineHeight: 23,
        fontWeight: "700",
        marginTop: 6,
    },

    faqCard: {
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginBottom: 14,
        borderWidth: 1,
    },

    helpQuestion: {
        fontSize: 18,
        fontWeight: "900",
        marginBottom: 8,
        lineHeight: 27,
    },

    helpAnswer: {
        fontSize: 15.5,
        lineHeight: 27,
        fontWeight: "700",
    },

    supportMainButton: {
        minHeight: 58,
        borderRadius: 20,
        marginTop: 10,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: Platform.OS === "android" ? 0.12 : 0.18,
        shadowRadius: 12,
        elevation: 4,
    },

    supportWhatsAppMainButton: {
        backgroundColor: "#25C96A",
    },

    supportEmailMainButton: {
        backgroundColor: COLORS.primary,
    },

    supportMainButtonText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 16,
        textAlign: "center",
    },

    supportIssueFullButton: {
        minHeight: 56,
        borderRadius: 20,
        marginTop: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 10,
    },

    supportIssueFullButtonText: {
        fontWeight: "900",
        fontSize: 16,
        textAlign: "center",
    },

    closeHelpButton: {
        marginTop: 18,
        minHeight: 54,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },

    closeHelpButtonText: {
        fontSize: 16,
        fontWeight: "900",
        textAlign: "center",
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

    carCard: {
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
    },

});
