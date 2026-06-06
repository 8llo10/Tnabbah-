import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import {
  Alexandria_400Regular,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/alexandria";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import { useWallet } from "../../providers/WalletProvider";
import { useLanguage } from "../../providers/LanguageProvider";
import { useAppSettings } from "../../providers/AppSettingsProvider";
import { useCars } from "../../providers/CarsProvider";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const FONT_REGULAR = "Alexandria_400Regular";
const FONT_SEMIBOLD = "Alexandria_600SemiBold";
const FONT_BOLD = "Alexandria_700Bold";
const FONT_EXTRABOLD = "Alexandria_800ExtraBold";

const APP_DARK_RED = "#B63A34";
const MAINTENANCE_WARNING_DAYS = 7;
const LIGHT_WARNING_ORANGE = "#F59E0B";
const DARK_WARNING_ORANGE = "#FDBA74";

const COLORS = {
  primary: "#871B17",
  primaryLight: "#9A3A33",
  primaryDark: "#5F130F",
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  soft: "#F8F8F8",
  softGray: "#F3F4F6",
  border: "#EFEFEF",
  text: "#1D1D1F",
  muted: "#707070",
  mutedLight: "#A8A8A8",
  danger: "#C62828",
  dangerBg: "#FFF1F1",
  warning: LIGHT_WARNING_ORANGE,
  warningBg: "#FFF7E6",
  success: "#1F8A4C",
  successBg: "#EFFAF3",

  reportSaved: "#1F8A4C",
  reportSavedBg: "#EFFAF3",
  reportPending: LIGHT_WARNING_ORANGE,
  reportPendingBg: "#FFF7E6",
  neutralAction: "#6B7280",
  neutralActionBg: "#F4F4F4",
  neutralActionBorder: "#E6E6E6",
  softPrimaryBg: "#F7F3F2",
  reportDocument: "#7A4D2A",
  reportDocumentBg: "#F7F1EA",
  reportDocumentBorder: "#EAD9C6",
  reportAlert: "#871B17",
  reportAlertBg: "#FFF1F1",
  reportAlertBorder: "#F1D1CF",
};

const LIGHT_WALLET_THEME = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  soft: "#F8F8F8",
  softGray: "#F3F4F6",
  border: "#EFEFEF",
  text: "#1D1D1F",
  muted: "#707070",
  mutedLight: "#A8A8A8",
  primary: "#871B17",
  primaryDark: "#5F130F",
  danger: "#C62828",
  dangerBg: "#FFF1F1",
  warning: LIGHT_WARNING_ORANGE,
  warningBg: "#FFF7E6",
  success: "#1F8A4C",
  successBg: "#EFFAF3",
  reportDocument: "#7A4D2A",
  reportDocumentBg: "#F7F1EA",
  reportDocumentBorder: "#EAD9C6",
  reportAlert: "#871B17",
  reportAlertBg: "#FFF1F1",
  reportAlertBorder: "#F1D1CF",
  neutralAction: "#6B7280",
  neutralActionBg: "#F4F4F4",
  neutralActionBorder: "#E6E6E6",
  modalOverlay: "rgba(0,0,0,0.28)",
};

const DARK_WALLET_THEME = {
  bg: "#151515",
  surface: "#202020",
  soft: "#292929",
  softGray: "#2A2A2A",
  border: "#383838",
  text: "#FFFFFF",
  muted: "#C7C7C7",
  mutedLight: "#9E9E9E",
  primary: APP_DARK_RED,
  primaryDark: APP_DARK_RED,
  danger: APP_DARK_RED,
  dangerBg: "rgba(182,58,52,0.14)",
  warning: DARK_WARNING_ORANGE,
  warningBg: "rgba(253,186,116,0.16)",
  success: "#65C18C",
  successBg: "rgba(31,138,76,0.18)",
  reportDocument: "#D3A47B",
  reportDocumentBg: "rgba(122,77,42,0.20)",
  reportDocumentBorder: "rgba(234,217,198,0.20)",
  reportAlert: APP_DARK_RED,
  reportAlertBg: "rgba(182,58,52,0.14)",
  reportAlertBorder: "rgba(182,58,52,0.44)",
  neutralAction: "#D1D5DB",
  neutralActionBg: "#2A2A2A",
  neutralActionBorder: "#3A3A3A",
  modalOverlay: "rgba(0,0,0,0.62)",
};
interface MaintenanceItem {
  reminderId: number | null;
  maintenanceTypeId: number;
  title: string;
  lastDate: string;
  nextDate: string;
  intervalDays: number;
  remainingDays: number | null;
  status: "upcoming" | "due" | "overdue";
}

function getReportTotalCountFallback(reports: any[]) {
  return reports.filter(
    (r: any) => r.status === "saved" || r.status === "pending",
  ).length;
}

export default function Wallet() {
  const {
    reports,
    setReports,
    reportsLoading,
    maintenance,
    maintenanceLoading,
    fetchMaintenance,
    refreshWallet,
  } = useWallet();

  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    Alexandria_800ExtraBold,
  });

  const [, forceTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      forceTick(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      setReports((prev: any[]) =>
        prev.filter((report) => {
          if (report.status !== "pending") return true;
          if (!report.expiryAt) return true;

          return new Date(report.expiryAt).getTime() > now;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [setReports]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const { session } = useAuth();
  const userId = session?.user?.id;

  const { activeCarId, userCars } = useCars();

  const activeUserCar = userCars.find(
    (car) => car.car_id === activeCarId
  );

  const activeUserCarId = activeUserCar?.id ?? null;

  const { t, isArabic, language } = useLanguage();
  const { darkModeEnabled } = useAppSettings();

  const theme = darkModeEnabled ? DARK_WALLET_THEME : LIGHT_WALLET_THEME;

  const { width, height } = useWindowDimensions();
  const isTabletLike = width >= 768;
  const isSmallScreen = height < 720;
  const horizontalPadding = isTabletLike ? 24 : clamp(width * 0.055, 18, 22);
  const reportCardWidth = isTabletLike
    ? clamp(width * 0.34, 250, 310)
    : clamp(width * 0.58, 210, 238);

  const rowDirection = isArabic ? "row-reverse" : "row";
  const textAlign = isArabic ? "right" : "left";
  const alignItems = isArabic ? "flex-end" : "flex-start";
  const iconSideSelf = isArabic ? "flex-end" : "flex-start";
  const iconSideDirection = isArabic ? "row-reverse" : "row";
  const reportCount = getReportTotalCountFallback(reports);
  const maintenanceCount = maintenance.length;

  const [savingId, setSavingId] = useState<number | null>(null);
  const [reportFilter, setReportFilter] = useState<"all" | "saved" | "pending">(
    "all",
  );
  const [reportViewMode, setReportViewMode] = useState<
    "horizontal" | "vertical"
  >("horizontal");
  const [showAllReports, setShowAllReports] = useState(false);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(new Date());
  const [currentEditingItem, setCurrentEditingItem] =
    useState<MaintenanceItem | null>(null);

  const [maintenanceSuccessVisible, setMaintenanceSuccessVisible] =
    useState(false);
  const [maintenanceSuccessTitle, setMaintenanceSuccessTitle] = useState("");
  const [maintenanceSuccessMessage, setMaintenanceSuccessMessage] = useState("");
  const maintenanceSuccessLottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (!maintenanceSuccessVisible) return;

    maintenanceSuccessLottieRef.current?.reset();

    const playTimer = setTimeout(() => {
      maintenanceSuccessLottieRef.current?.play(0);
    }, 70);

    const closeTimer = setTimeout(() => {
      setMaintenanceSuccessVisible(false);
    }, 1850);

    return () => {
      clearTimeout(playTimer);
      clearTimeout(closeTimer);
    };
  }, [maintenanceSuccessVisible]);

  const translateMaintenanceTitle = (title: string) => {
    const normalizedTitle = title.toLowerCase();

    if (
      normalizedTitle.includes("زيت المحرك") ||
      normalizedTitle.includes("engine oil")
    ) {
      return t.walletEngineOil;
    }

    if (
      normalizedTitle.includes("الكفرات") ||
      normalizedTitle.includes("كفر") ||
      normalizedTitle.includes("tires") ||
      normalizedTitle.includes("tyres")
    ) {
      return t.walletTires;
    }

    if (
      normalizedTitle.includes("الفرامل") ||
      normalizedTitle.includes("فحم") ||
      normalizedTitle.includes("brake")
    ) {
      return t.walletBrakes;
    }

    if (
      normalizedTitle.includes("فلتر الهواء") ||
      normalizedTitle.includes("air filter")
    ) {
      return t.walletAirFilter;
    }

    if (
      normalizedTitle.includes("بطارية") ||
      normalizedTitle.includes("البطارية") ||
      normalizedTitle.includes("battery")
    ) {
      return t.walletBattery;
    }

    return title;
  };

  // دالة مساعدة لاختيار أيقونة الصيانة بناءً على الكلمات المفتاحية بالاسم لمظهر احترافي

  const getMaintenanceIcon = (
    title: string,
  ): React.ComponentProps<typeof MaterialCommunityIcons>["name"] => {
    const t = title.toLowerCase();

    if (t.includes("زيت المحرك") || t.includes("engine oil")) return "oil";
    if (
      t.includes("الكفرات") ||
      t.includes("كفر") ||
      t.includes("tires") ||
      t.includes("tyres")
    )
      return "car-tire-alert";
    if (t.includes("الفرامل") || t.includes("فحم") || t.includes("brake"))
      return "car-brake-alert";
    if (t.includes("فلتر الهواء") || t.includes("air filter"))
      return "air-filter";
    if (t.includes("بطارية") || t.includes("البطارية") || t.includes("battery"))
      return "battery"; // إيقونة البطارية المضافة هنا

    return "car-cog"; // الأيقونة الافتراضية لأي صيانة أخرى ثابتة
  };

  const handleSaveReport = async (id: string) => {
    if (!userId) return;
    const prev = reports;
    setReports((rs: any[]) =>
      rs.map((r) => (r.id === id ? { ...r, status: "saved" } : r)),
    );
    try {
      const now = new Date();
      const expiry = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365 * 10);
      const { error } = await supabase
        .from("reports")
        .update({
          status: "saved",
          is_permanently_saved: true,
          saved_at: now.toISOString(),
          expiry_at: expiry.toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    } catch (err: any) {
      console.error("Save report failed:", err?.message || err);
      setReports(prev);
      Alert.alert(t.walletErrorTitle, t.walletSaveReportError);
    }
  };

  const handleRejectReport = async (id: string) => {
    if (!userId) return;
    const prev = reports;
    setReports((rs: any[]) => rs.filter((r) => r.id !== id));
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: "temp_rejected" })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    } catch (err: any) {
      console.error("Reject report failed:", err?.message || err);
      setReports(prev);
      Alert.alert(t.walletErrorTitle, t.walletRejectReportError);
    }
  };

  const getRemainingTime = (expiryAt?: string) => {
    if (!expiryAt) return null;

    const diff =
      new Date(expiryAt).getTime() - Date.now();

    if (diff <= 0) {
      return "00:00:00";
    }

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const openReport = (id: string) => {
    router.push({ pathname: "/report", params: { id } });
  };

  /* const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (value?: string) => {
    if (!value) return new Date();
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return new Date();
    return new Date(year, month - 1, day);
  }; */

  const formatLocalDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (value?: string) => {
    if (!value) {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      return today;
    }

    const [year, month, day] = value.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(12, 0, 0, 0);
    return d;
  };

  const openMaintenanceDatePicker = (item: MaintenanceItem) => {
    setCurrentEditingItem(item);
    setPendingDate(parseLocalDate(item.lastDate));
    setDatePickerVisible(true);
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
    setCurrentEditingItem(null);
  };

  const handleConfirmDate = async (date: Date) => {
    setDatePickerVisible(false);
    if (!currentEditingItem || !userId || !activeUserCarId) {
      setCurrentEditingItem(null);
      return;
    }


    console.log("RAW DATE", date);
    console.log("LOCAL DATE", formatLocalDate(date));

    const selectedDateStr = formatLocalDate(date);
    if (selectedDateStr === currentEditingItem.lastDate) return;

    setSavingId(currentEditingItem.maintenanceTypeId);

    try {
      const [year, month, day] = selectedDateStr.split("-").map(Number);
      const next = new Date(year, month - 1, day);
      next.setHours(12, 0, 0, 0);
      next.setDate(next.getDate() + currentEditingItem.intervalDays);
      const nextDateStr = formatLocalDate(next);

      const { error } = await supabase.from("maintenance_reminders").upsert(
        {
          user_id: userId,
          user_car_id: activeUserCarId,
          maintenance_type_id: currentEditingItem.maintenanceTypeId,
          last_date: selectedDateStr,
          next_date: nextDateStr,
          notification_stage: 0,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,user_car_id,maintenance_type_id" },
      );

      if (error) throw error;
      await fetchMaintenance();

      try {
        await fetch("http://207.180.244.27:3102/check-now", { method: "POST" });
      } catch (error) {
        console.log("Check notifications now error:", error);
      }

      const translatedTitle = translateMaintenanceTitle(currentEditingItem.title);
      setMaintenanceSuccessTitle(
        isArabic ? "تم تحديث الصيانة" : "Maintenance updated",
      );
      setMaintenanceSuccessMessage(
        isArabic
          ? `تم حفظ تاريخ ${translatedTitle} في المحفظة بنجاح.`
          : `${translatedTitle} date has been saved in your wallet successfully.`,
      );
      setMaintenanceSuccessVisible(true);
    } catch (err: any) {
      console.error("Save maintenance failed:", err);
      Alert.alert(
        t.walletErrorTitle,
        err?.message || t.walletSaveMaintenanceError,
      );
    } finally {
      setSavingId(null);
      setCurrentEditingItem(null);
    }
  };

  const handleResetMaintenance = (item: MaintenanceItem) => {
    if (!userId) return;

    const translatedTitle = translateMaintenanceTitle(item.title);

    Alert.alert(
      isArabic ? "إعادة تعيين الصيانة" : "Reset maintenance",
      isArabic
        ? `هل أنت متأكد من رغبتك في إعادة تعيين صيانة (${translatedTitle})؟ سيتم تصفير التواريخ لتصبح فارغة.`
        : `Are you sure you want to reset (${translatedTitle})? The maintenance dates will be cleared.`,
      [
        {
          text: isArabic ? "إلغاء" : "Cancel",
          style: "cancel",
        },
        {
          text: isArabic ? "إعادة تعيين" : "Reset",
          style: "default",
          onPress: async () => {
            setSavingId(item.maintenanceTypeId);

            try {
              const { error } = await supabase
                .from("maintenance_reminders")
                .update({
                  last_date: null,
                  next_date: null,
                  notification_stage: 0,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", userId)
                .eq("user_car_id", activeUserCarId)
                .eq("maintenance_type_id", item.maintenanceTypeId);

              if (error) throw error;

              await fetchMaintenance();

              setMaintenanceSuccessTitle(
                isArabic ? "تمت إعادة التعيين" : "Maintenance reset",
              );
              setMaintenanceSuccessMessage(
                isArabic
                  ? `تمت إعادة تعيين بيانات ${translatedTitle} بنجاح.`
                  : `${translatedTitle} data has been reset successfully.`,
              );
              setMaintenanceSuccessVisible(true);
            } catch (err: any) {
              console.error("Reset maintenance failed:", err);
              Alert.alert(
                t.walletErrorTitle,
                isArabic
                  ? "تعذر إعادة تعيين بيانات الصيانة"
                  : "Could not reset maintenance data",
              );
            } finally {
              setSavingId(null);
            }
          },
        },
      ],
    );
  };

  const visibleReports = reports.filter((r: any) => {
    if (reportFilter === "all") return true;
    return r.status === reportFilter;
  });

  const REPORT_PREVIEW_LIMIT = 5;
  const hasMoreReports = visibleReports.length > REPORT_PREVIEW_LIMIT;
  const displayedReports = showAllReports
    ? visibleReports
    : visibleReports.slice(0, REPORT_PREVIEW_LIMIT);

  const getFilterCount = (key: "all" | "saved" | "pending") => {
    if (key === "all") {
      return reports.filter(
        (r: any) => r.status === "saved" || r.status === "pending",
      ).length;
    }
    return reports.filter((r: any) => r.status === key).length;
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={darkModeEnabled ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />

      <View
        style={[
          styles.header,
          { flexDirection: rowDirection, backgroundColor: theme.bg },
        ]}
      >
        <View style={styles.headerSide} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t.walletTitle}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <View style={[styles.headerDivider, { backgroundColor: theme.border }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            backgroundColor: theme.bg,
            paddingHorizontal: horizontalPadding,
            paddingTop: isSmallScreen ? 12 : 14,
          },
        ]}
      >
        {/* ─── قسم التقارير ─── */}
        <View
          style={[
            styles.sectionHeaderCard,
            {
              flexDirection: iconSideDirection,
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.sectionIconCirclePrimary,
              { backgroundColor: theme.primary },
            ]}
          >
            <Feather name="file-text" size={18} color="#FFFFFF" />
          </View>

          <View style={[styles.sectionTextBox, { alignItems }]}>
            <Text
              style={[styles.sectionTitle, { textAlign, color: theme.text }]}
            >
              {t.walletReportsTitle}
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                { textAlign, color: theme.muted },
              ]}
            >
              {t.walletReportsSubtitle}
            </Text>
          </View>

          <View style={styles.sectionCountBadge}>
            <Text style={[styles.sectionCountText, { color: theme.primary }]}>
              {reportCount}
            </Text>
          </View>
        </View>

        <View
          style={[styles.reportControlsRow, { flexDirection: rowDirection }]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.filterScrollContent,
              { flexDirection: rowDirection },
            ]}
            style={styles.filterScroll}
          >
            {[
              { key: "all", label: t.walletFilterAll },
              { key: "saved", label: t.walletFilterSaved },
              { key: "pending", label: t.walletFilterPending },
            ].map((f) => {
              const key = f.key as "all" | "saved" | "pending";
              const active = reportFilter === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    setReportFilter(key);
                    setShowAllReports(false);
                  }}
                  activeOpacity={0.85}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? "#FFFFFF" : theme.muted },
                    ]}
                  >
                    {f.label} ({getFilterCount(key)})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View
            style={[
              styles.reportViewToggle,
              {
                flexDirection: rowDirection,
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {[
              {
                key: "horizontal",
                icon: "columns" as const,
                accessibilityLabel: isArabic ? "عرض أفقي" : "Horizontal view",
              },
              {
                key: "vertical",
                icon: "list" as const,
                accessibilityLabel: isArabic ? "عرض رأسي" : "Vertical view",
              },
            ].map((item) => {
              const active = reportViewMode === item.key;

              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={item.accessibilityLabel}
                  onPress={() =>
                    setReportViewMode(item.key as "horizontal" | "vertical")
                  }
                  style={[
                    styles.reportViewToggleButton,
                    active
                      ? { backgroundColor: theme.primary }
                      : { backgroundColor: "transparent" },
                  ]}
                >
                  <Feather
                    name={item.icon}
                    size={16}
                    color={active ? "#FFFFFF" : theme.muted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.reportsList}>
          {reportsLoading && reports.length === 0 && (
            <View
              style={[
                styles.emptyFullCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <ActivityIndicator color={theme.primary} />
              <Text style={[styles.emptyText, { color: theme.muted }]}>
                {t.walletLoadingReports}
              </Text>
            </View>
          )}

          {!reportsLoading && visibleReports.length === 0 && (
            <View
              style={[
                styles.emptyFullCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  {
                    backgroundColor: theme.softGray,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Feather name="folder" size={22} color={theme.primary} />
              </View>
              <Text style={[styles.emptyText, { color: theme.muted }]}>
                {!userId ? t.walletLoginRequired : t.walletNoReports}
              </Text>
            </View>
          )}

          {!reportsLoading && visibleReports.length > 0 ? (
            reportViewMode === "horizontal" ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                contentContainerStyle={[
                  styles.horizontalScroll,
                  {
                    flexDirection: isArabic ? "row-reverse" : "row",
                    paddingRight: isArabic ? 2 : 18,
                    paddingLeft: isArabic ? 18 : 2,
                  },
                ]}
              >
                {displayedReports.map((report: any) => {
                  const isPending = report.status === "pending";
                  const isDtc = report.type === "DTC";
                  const reportTypeLabel = isDtc
                    ? "DTC"
                    : isArabic
                      ? "تقرير"
                      : "Report";

                  return (
                    <TouchableOpacity
                      key={report.id}
                      style={[
                        styles.reportCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          marginLeft: isArabic ? 0 : 12,
                          marginRight: isArabic ? 12 : 0,
                          width: reportCardWidth,
                        },
                      ]}
                      activeOpacity={0.84}
                      onPress={() => {
                        if (!isPending) openReport(report.id);
                      }}
                    >
                      <View
                        style={[
                          styles.cardTopRow,
                          { flexDirection: iconSideDirection },
                        ]}
                      >
                        <View
                          style={[
                            styles.reportBadge,
                            isDtc
                              ? {
                                backgroundColor: theme.reportAlertBg,
                                borderColor: theme.reportAlertBorder,
                              }
                              : {
                                backgroundColor: theme.reportDocumentBg,
                                borderColor: theme.reportDocumentBorder,
                              },
                          ]}
                        >
                          <Text
                            style={[
                              styles.reportBadgeText,
                              isDtc
                                ? { color: theme.reportAlert }
                                : { color: theme.reportDocument },
                            ]}
                          >
                            {reportTypeLabel}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusSmallPill,
                            isPending
                              ? {
                                backgroundColor: theme.warningBg,
                                borderColor: "rgba(245,158,11,0.24)",
                              }
                              : {
                                backgroundColor: theme.successBg,
                                borderColor: "rgba(31,138,76,0.18)",
                              },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              isPending
                                ? { color: theme.warning }
                                : { color: theme.success },
                            ]}
                          >
                            {isPending ? t.walletPending : t.walletSaved}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.reportIconCircle,
                          isDtc
                            ? {
                              backgroundColor: theme.reportAlertBg,
                              borderColor: theme.reportAlertBorder,
                              alignSelf: iconSideSelf,
                            }
                            : {
                              backgroundColor: theme.reportDocumentBg,
                              borderColor: theme.reportDocumentBorder,
                              alignSelf: iconSideSelf,
                            },
                        ]}
                      >
                        <Feather
                          name={isDtc ? "alert-triangle" : "file-text"}
                          size={22}
                          color={
                            isDtc ? theme.reportAlert : theme.reportDocument
                          }
                        />
                      </View>

                      <View
                        style={{
                          flexDirection: isArabic ? "row-reverse" : "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: theme.text, textAlign, flex: 1 },
                          ]}
                          numberOfLines={3}
                        >
                          {report.title}
                        </Text>

                        {isPending && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: theme.danger,
                              fontFamily: FONT_BOLD,
                              marginHorizontal: 8,
                            }}
                          >
                            ⏳ {getRemainingTime(report.expiryAt)}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.cardDate,
                          { color: theme.muted, textAlign },
                        ]}
                        numberOfLines={1}
                      >
                        {report.date}
                      </Text>





                      {isPending ? (
                        <View
                          style={[
                            styles.actionsRow,
                            { flexDirection: rowDirection },
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              styles.saveReportBtn,
                              {
                                backgroundColor: theme.primary,
                                shadowColor: theme.primaryDark,
                              },
                            ]}
                            activeOpacity={0.85}
                            onPress={() => handleSaveReport(report.id)}
                          >
                            <View
                              style={[
                                styles.saveReportContent,
                                { flexDirection: iconSideDirection },
                              ]}
                            >
                              <Feather
                                name="bookmark"
                                size={14}
                                color="#FFFFFF"
                              />
                              <Text style={styles.saveReportText}>
                                {t.walletSaveReport}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.rejectBtn,
                              {
                                backgroundColor: theme.neutralActionBg,
                                borderColor: theme.neutralActionBorder,
                              },
                            ]}
                            activeOpacity={0.85}
                            onPress={() => handleRejectReport(report.id)}
                          >
                            <Text
                              style={[
                                styles.rejectBtnText,
                                { color: theme.neutralAction },
                              ]}
                            >
                              {t.walletIgnore}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.openReportBtn,
                            { backgroundColor: theme.primary },
                          ]}
                          activeOpacity={0.85}
                          onPress={() => openReport(report.id)}
                        >
                          <Text style={styles.openReportText}>
                            {isArabic ? "عرض التقرير" : "Open report"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.verticalReportsList}>
                {displayedReports.map((report: any) => {
                  const isPending = report.status === "pending";
                  const isDtc = report.type === "DTC";
                  const reportTypeLabel = isDtc
                    ? "DTC"
                    : isArabic
                      ? "تقرير"
                      : "Report";

                  return (
                    <TouchableOpacity
                      key={report.id}
                      style={[
                        styles.reportListCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                      activeOpacity={0.82}
                      onPress={() => {
                        if (!isPending) openReport(report.id);
                      }}
                    >
                      <View
                        style={[
                          styles.reportListTop,
                          { flexDirection: iconSideDirection },
                        ]}
                      >
                        <View
                          style={[
                            styles.reportListIconBox,
                            isDtc
                              ? {
                                backgroundColor: theme.reportAlertBg,
                                borderColor: theme.reportAlertBorder,
                              }
                              : {
                                backgroundColor: theme.reportDocumentBg,
                                borderColor: theme.reportDocumentBorder,
                              },
                          ]}
                        >
                          <Feather
                            name={isDtc ? "alert-triangle" : "file-text"}
                            size={18}
                            color={
                              isDtc ? theme.reportAlert : theme.reportDocument
                            }
                          />
                        </View>

                        <View style={[styles.reportListInfo, { alignItems }]}>
                          <Text
                            style={[
                              styles.reportListTitle,
                              { textAlign, color: theme.text },
                            ]}
                            numberOfLines={2}
                          >
                            {report.title}
                          </Text>

                          <View
                            style={[
                              styles.reportListMeta,
                              {
                                flexDirection: iconSideDirection,
                                alignSelf: iconSideSelf,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.reportListDate,
                                { textAlign, color: theme.muted },
                              ]}
                            >
                              {report.date}
                            </Text>

                            <View
                              style={[
                                styles.reportBadge,
                                isDtc
                                  ? {
                                    backgroundColor: theme.reportAlertBg,
                                    borderColor: theme.reportAlertBorder,
                                  }
                                  : {
                                    backgroundColor: theme.reportDocumentBg,
                                    borderColor: theme.reportDocumentBorder,
                                  },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.reportBadgeText,
                                  isDtc
                                    ? { color: theme.reportAlert }
                                    : { color: theme.reportDocument },
                                ]}
                              >
                                {reportTypeLabel}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.reportListActionSide}>
                          <View
                            style={[
                              styles.statusSmallPill,
                              isPending
                                ? {
                                  backgroundColor: theme.warningBg,
                                  borderColor: "rgba(245,158,11,0.24)",
                                }
                                : {
                                  backgroundColor: theme.successBg,
                                  borderColor: "rgba(31,138,76,0.18)",
                                },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                isPending
                                  ? { color: theme.warning }
                                  : { color: theme.success },
                              ]}
                            >
                              {isPending ? t.walletPending : t.walletSaved}
                            </Text>
                          </View>

                          {!isPending ? (
                            <Feather
                              name={isArabic ? "chevron-left" : "chevron-right"}
                              size={20}
                              color={theme.mutedLight}
                            />
                          ) : null}
                        </View>
                      </View>

                      {isPending ? (
                        <View
                          style={[
                            styles.actionsRow,
                            { flexDirection: rowDirection },
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              styles.saveReportBtn,
                              {
                                backgroundColor: theme.primary,
                                shadowColor: theme.primaryDark,
                              },
                            ]}
                            activeOpacity={0.85}
                            onPress={() => handleSaveReport(report.id)}
                          >
                            <View
                              style={[
                                styles.saveReportContent,
                                { flexDirection: iconSideDirection },
                              ]}
                            >
                              <Feather
                                name="bookmark"
                                size={14}
                                color="#FFFFFF"
                              />
                              <Text style={styles.saveReportText}>
                                {t.walletSaveReport}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.rejectBtn,
                              {
                                backgroundColor: theme.neutralActionBg,
                                borderColor: theme.neutralActionBorder,
                              },
                            ]}
                            activeOpacity={0.85}
                            onPress={() => handleRejectReport(report.id)}
                          >
                            <Text
                              style={[
                                styles.rejectBtnText,
                                { color: theme.neutralAction },
                              ]}
                            >
                              {t.walletIgnore}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : null}

          {hasMoreReports ? (
            <TouchableOpacity
              style={[
                styles.viewAllReportsButton,
                {
                  flexDirection: iconSideDirection,
                  backgroundColor: theme.surface,
                  borderColor: theme.neutralActionBorder,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => setShowAllReports((prev) => !prev)}
            >
              <Text
                style={[styles.viewAllReportsText, { color: theme.primary }]}
              >
                {showAllReports
                  ? isArabic
                    ? "عرض أقل"
                    : "Show less"
                  : isArabic
                    ? "عرض الكل"
                    : "View all"}
              </Text>

              <Text
                style={[
                  styles.viewAllReportsCount,
                  { color: theme.neutralAction },
                ]}
              >
                {showAllReports
                  ? `${displayedReports.length}/${visibleReports.length}`
                  : `${REPORT_PREVIEW_LIMIT}/${visibleReports.length}`}
              </Text>

              <Feather
                name={
                  showAllReports
                    ? "chevron-up"
                    : isArabic
                      ? "chevron-left"
                      : "chevron-right"
                }
                size={18}
                color={theme.primary}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ─── قسم الصيانات الدورية ─── */}
        <View
          style={[
            styles.sectionHeaderCard,
            styles.maintenanceHeaderCard,
            {
              flexDirection: iconSideDirection,
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.sectionIconCirclePrimary,
              { backgroundColor: theme.primary },
            ]}
          >
            <MaterialCommunityIcons
              name="wrench-clock"
              size={18}
              color="#FFFFFF"
            />
          </View>

          <View style={[styles.sectionTextBox, { alignItems }]}>
            <Text
              style={[styles.sectionTitle, { textAlign, color: theme.text }]}
            >
              {t.walletMaintenanceTitle}
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                { textAlign, color: theme.muted },
              ]}
            >
              {t.walletMaintenanceSubtitle}
            </Text>
          </View>

          <View style={styles.sectionCountBadge}>
            <Text style={[styles.sectionCountText, { color: theme.primary }]}>
              {maintenanceCount}
            </Text>
          </View>
        </View>

        {maintenanceLoading && maintenance.length === 0 ? (
          <View style={styles.maintenanceLoadingBox}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              {t.walletLoadingMaintenance}
            </Text>
          </View>
        ) : (
          maintenance.map((item: MaintenanceItem) => {
            // حساب الأيام محليًا من nextDate لتجنب اختلاف اليوم بسبب التوقيت.
            let localRemainingDays = item.remainingDays;

            if (item.nextDate) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const [year, month, day] = item.nextDate.split("-").map(Number);
              const nextDate = new Date(year, month - 1, day);
              nextDate.setHours(0, 0, 0, 0);

              localRemainingDays = Math.round(
                (nextDate.getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24),
              );
            }

            const hasData = !!item.lastDate;
            const progress = hasData
              ? Math.min(
                ((item.intervalDays - (localRemainingDays ?? 0)) /
                  item.intervalDays) *
                100,
                100,
              )
              : 0;

            let localStatus = item.status;

            if (hasData && localRemainingDays !== null) {
              if (localRemainingDays < 0) localStatus = "overdue";
              else if (localRemainingDays <= MAINTENANCE_WARNING_DAYS)
                localStatus = "due";
              else localStatus = "upcoming";
            }

            const isOverdue = hasData && localStatus === "overdue";
            const isWarningSoon = hasData && localStatus === "due";
            const isUpcoming = hasData && localStatus === "upcoming";
            const remainingDays = localRemainingDays ?? 0;
            const isCurrentlySaving = savingId === item.maintenanceTypeId;

            let statusColor = theme.success;
            let statusBg = theme.successBg;
            if (isWarningSoon) {
              statusColor = theme.warning;
              statusBg = theme.warningBg;
            }
            if (isOverdue) {
              statusColor = theme.danger;
              statusBg = theme.dangerBg;
            }
            if (!hasData) {
              statusColor = theme.muted;
              statusBg = theme.softGray;
            }

            // تحديد نص الشارة بناءً على الشروط الجديدة المطلوبة
            let badgeText = "";
            if (!hasData) {
              badgeText = t.walletNotRegistered;
            } else if (isOverdue) {
              const absDays = Math.abs(localRemainingDays ?? 0);
              badgeText = `${absDays} ${t.walletDaysLate}`;
            } else if (isWarningSoon) {
              badgeText = `${t.walletRemaining} ${remainingDays} ${t.walletDay}`;
            } else {
              badgeText = `${t.walletRemaining} ${remainingDays} ${t.walletDay}`;
            }

            // تلوين نص التاريخ بناءً على الحالة (أخضر للمستقبل البعيد)
            let valueDateColor = theme.text;
            if (isOverdue) valueDateColor = theme.danger;
            else if (isWarningSoon) valueDateColor = theme.warning;
            else if (isUpcoming) valueDateColor = theme.success;

            return (
              <TouchableOpacity
                key={item.maintenanceTypeId}
                style={[
                  styles.uxMaintenanceCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isCurrentlySaving && { opacity: 0.55 },
                ]}
                activeOpacity={0.75}
                disabled={isCurrentlySaving}
                onPress={() => openMaintenanceDatePicker(item)}
              >
                {/* الجزء العلوي: الأيقونة في اليمين للعربي وتنعكس لليسار في الإنجليزي */}
                <View
                  style={[
                    styles.uxCardTopElement,
                    { flexDirection: iconSideDirection },
                  ]}
                >
                  <View
                    style={[
                      styles.uxIconContainer,
                      {
                        backgroundColor: theme.softGray,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {isCurrentlySaving ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <MaterialCommunityIcons
                        name={getMaintenanceIcon(item.title)}
                        size={22}
                        color={theme.primary}
                      />
                    )}
                  </View>

                  <View style={[styles.uxTextGroup, { alignItems }]}>
                    <Text
                      style={[
                        styles.uxMaintenanceTitle,
                        { textAlign, color: theme.text },
                      ]}
                    >
                      {translateMaintenanceTitle(item.title)}
                    </Text>
                    <View
                      style={[
                        styles.uxMetaRow,
                        {
                          flexDirection: iconSideDirection,
                          alignSelf: iconSideSelf,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.uxMaintenanceSub,
                          { textAlign, color: theme.muted },
                        ]}
                      >
                        {t.walletEvery} {item.intervalDays} {t.walletDay}
                      </Text>
                      <View
                        style={[
                          styles.uxStatusBadge,
                          { backgroundColor: statusBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.uxStatusBadgeText,
                            { color: statusColor },
                          ]}
                        >
                          {badgeText}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.uxCardActions,
                      { flexDirection: iconSideDirection },
                    ]}
                  >
                    {hasData ? (
                      <TouchableOpacity
                        style={[
                          styles.resetButtonCircle,
                          {
                            backgroundColor: theme.warningBg,
                            borderColor: darkModeEnabled
                              ? "rgba(253,186,116,0.34)"
                              : "rgba(245,158,11,0.24)",
                          },
                        ]}
                        activeOpacity={0.78}
                        onPress={() => handleResetMaintenance(item)}
                        disabled={isCurrentlySaving}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather
                          name="refresh-cw"
                          size={13}
                          color={theme.warning}
                        />
                      </TouchableOpacity>
                    ) : null}

                    <View style={styles.uxEditHint}>
                      <Feather
                        name={isArabic ? "chevron-left" : "chevron-right"}
                        size={20}
                        color={theme.mutedLight}
                      />
                    </View>
                  </View>
                </View>

                {/* جزء التواريخ: متناسق تماماً مع القراءة العربية من اليمين (الماضي) إلى اليسار (المستقبل) */}
                <View
                  style={[
                    styles.uxGridContainer,
                    {
                      flexDirection: rowDirection,
                      backgroundColor: theme.soft,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {/* اليمين: آخر صيانة تمت */}
                  <View style={styles.uxGridItem}>
                    <Text style={[styles.uxGridLabel, { color: theme.muted }]}>
                      {t.walletLastMaintenance}
                    </Text>
                    <Text style={[styles.uxGridValue, { color: theme.text }]}>
                      {item.lastDate || "—"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.uxGridDivider,
                      { backgroundColor: theme.border },
                    ]}
                  />

                  {/* اليسار: الموعد القادم المستحق */}
                  <View style={styles.uxGridItem}>
                    <Text style={[styles.uxGridLabel, { color: theme.muted }]}>
                      {t.walletNextDate}
                    </Text>
                    <Text
                      style={[styles.uxGridValue, { color: valueDateColor }]}
                    >
                      {item.nextDate || "—"}
                    </Text>
                  </View>
                </View>

                {/* شريط التقدم السفلي ومؤشر التفاعل */}
                <View
                  style={[styles.uxFooterRow, { flexDirection: rowDirection }]}
                >
                  <View
                    style={[
                      styles.uxActionIndicator,
                      { flexDirection: iconSideDirection },
                    ]}
                  >
                    <Feather
                      name="calendar"
                      size={13}
                      color={theme.mutedLight}
                    />
                    <Text style={[styles.uxActionText, { color: theme.muted }]}>
                      {t.walletUpdate}
                    </Text>
                    <Feather
                      name={isArabic ? "chevron-left" : "chevron-right"}
                      size={13}
                      color={theme.mutedLight}
                    />
                  </View>
                  <View
                    style={[
                      styles.uxProgressWrapper,
                      {
                        flexDirection: rowDirection,
                        backgroundColor: theme.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.uxProgressBar,
                        { width: `${progress}%`, backgroundColor: statusColor },
                      ]}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Android uses the native date dialog. iOS uses a clear in-app modal. */}
      {datePickerVisible && Platform.OS === "android" ? (
        <DateTimePicker
          value={pendingDate}
          mode="date"
          display="calendar"
          onChange={(event, selectedDate) => {
            if (event.type === "dismissed") {
              closeDatePicker();
              return;
            }

            if (selectedDate) {
              handleConfirmDate(selectedDate);
            } else {
              closeDatePicker();
            }
          }}
        />
      ) : null}

      <Modal
        visible={datePickerVisible && Platform.OS === "ios"}
        transparent
        animationType="fade"
        onRequestClose={closeDatePicker}
      >
        <View
          style={[
            styles.dateModalOverlay,
            { backgroundColor: theme.modalOverlay },
          ]}
        >
          <View
            style={[
              styles.dateModalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[styles.dateModalHeader, { flexDirection: rowDirection }]}
            >
              <TouchableOpacity
                style={styles.dateModalTextButton}
                activeOpacity={0.8}
                onPress={closeDatePicker}
              >
                <Text style={[styles.dateCancelText, { color: theme.muted }]}>
                  {isArabic ? "إلغاء" : "Cancel"}
                </Text>
              </TouchableOpacity>

              <View style={[styles.dateModalTitleBox, { alignItems }]}>
                <Text
                  style={[
                    styles.dateModalTitle,
                    { textAlign, color: theme.text },
                  ]}
                >
                  {currentEditingItem
                    ? translateMaintenanceTitle(currentEditingItem.title)
                    : t.walletMaintenanceTitle}
                </Text>
                <Text
                  style={[
                    styles.dateModalSubtitle,
                    { textAlign, color: theme.muted },
                  ]}
                >
                  {isArabic
                    ? "اختاري تاريخ آخر صيانة"
                    : "Select the last maintenance date"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.datePickerBox,
                { backgroundColor: theme.soft, borderColor: theme.border },
              ]}
            >
              <DateTimePicker
                value={pendingDate}
                mode="date"
                display="spinner"
                textColor={theme.text}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setPendingDate(selectedDate);
                  }
                }}
                style={styles.datePicker}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.dateConfirmButton,
                { backgroundColor: theme.primary },
              ]}
              activeOpacity={0.88}
              onPress={() => handleConfirmDate(pendingDate)}
            >
              <Text style={styles.dateConfirmButtonText}>
                {isArabic ? "تأكيد التاريخ" : "Confirm date"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={maintenanceSuccessVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMaintenanceSuccessVisible(false)}
      >
        <View
          style={[
            styles.successOverlay,
            { backgroundColor: theme.modalOverlay },
          ]}
        >
          <View
            style={[
              styles.successCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.successAnimationWrapper}>
              <LottieView
                ref={maintenanceSuccessLottieRef}
                source={require("../../assets/animations/success-check.json")}
                loop={false}
                speed={1.15}
                style={styles.successLottie}
              />
            </View>

            <Text
              style={[
                styles.successTitle,
                { color: theme.text, textAlign: "center" },
              ]}
              allowFontScaling={false}
            >
              {maintenanceSuccessTitle}
            </Text>

            {!!maintenanceSuccessMessage.trim() && (
              <Text
                style={[
                  styles.successMessage,
                  { color: theme.muted, textAlign: "center" },
                ]}
                allowFontScaling={false}
              >
                {maintenanceSuccessMessage}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row-reverse",
    backgroundColor: COLORS.bg,
  },
  headerSide: {
    width: 40,
    height: 40,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F2F2F2",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
    color: COLORS.text,
    fontFamily: FONT_EXTRABOLD,
    textAlign: "center",
    lineHeight: 29,
    includeFontPadding: true,
    paddingBottom: 2,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 130,
    backgroundColor: COLORS.bg,
  },
  overviewRow: {
    width: "100%",
    gap: 10,
    marginBottom: 8,
  },
  overviewCard: {
    flex: 1,
    minHeight: 126,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 13,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewTopRow: {
    alignItems: "center",
    gap: 9,
  },
  overviewIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewTextBox: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.text,
    fontFamily: FONT_BOLD,
  },
  overviewSubtitle: {
    marginTop: 2,
    fontSize: 10.8,
    lineHeight: 15,
    color: COLORS.muted,
    fontFamily: FONT_REGULAR,
  },
  overviewNumber: {
    marginTop: 10,
    fontSize: 30,
    lineHeight: 34,
    color: COLORS.primary,
    fontFamily: FONT_BOLD,
    includeFontPadding: false,
  },
  sectionHeaderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(135,27,23,0.10)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1,
  },
  maintenanceHeaderCard: {
    marginTop: 28,
  },
  sectionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.softGray,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionIconCirclePrimary: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTextBox: {
    flex: 1,
    alignItems: "flex-end",
  },
  sectionCountBadge: {
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  sectionCountText: {
    color: COLORS.primary,
    fontSize: 23,
    fontWeight: "900",
    fontFamily: FONT_EXTRABOLD,
    lineHeight: 31,
    includeFontPadding: true,
    paddingBottom: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
    fontFamily: FONT_EXTRABOLD,
    lineHeight: 27,
    includeFontPadding: true,
    paddingBottom: 1,
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 11.3,
    fontWeight: "600",
    color: COLORS.muted,
    textAlign: "right",
    fontFamily: FONT_SEMIBOLD,
    lineHeight: 19,
    includeFontPadding: true,
  },
  reportControlsRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  filterScroll: {
    flex: 1,
  },
  filterScrollContent: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 1,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 11.6,
    lineHeight: 18,
    color: COLORS.muted,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  reportViewToggle: {
    minWidth: 78,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  reportViewToggleButton: {
    width: 32,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalReportsList: {
    width: "100%",
    gap: 10,
  },
  horizontalScroll: {
    paddingRight: 2,
    paddingLeft: 18,
    flexDirection: "row",
  },
  emptyCard: {
    width: 220,
    height: 180,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginLeft: 12,
    gap: 10,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.softGray,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.muted,
    fontFamily: FONT_BOLD,
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    includeFontPadding: true,
  },
  reportsList: {
    width: "100%",
    gap: 10,
  },
  viewAllReportsButton: {
    width: "100%",
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.neutralActionBorder,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 2,
  },
  viewAllReportsText: {
    color: COLORS.primary,
    fontSize: 13,
    lineHeight: 21,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  viewAllReportsCount: {
    color: COLORS.neutralAction,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  emptyFullCard: {
    width: "100%",
    minHeight: 150,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    gap: 10,
    paddingHorizontal: 18,
  },
  reportListCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  reportListTop: {
    alignItems: "center",
    gap: 10,
  },
  reportListIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  reportListIconBoxDocument: {
    backgroundColor: COLORS.reportDocumentBg,
    borderColor: COLORS.reportDocumentBorder,
  },
  reportListIconBoxAlert: {
    backgroundColor: COLORS.reportAlertBg,
    borderColor: COLORS.reportAlertBorder,
  },
  reportListInfo: {
    flex: 1,
  },
  reportListTitle: {
    fontSize: 14.8,
    lineHeight: 22,
    fontFamily: FONT_BOLD,
    color: COLORS.text,
  },
  reportListMeta: {
    alignItems: "center",
    gap: 8,
    marginTop: 7,
    flexWrap: "wrap",
  },
  reportListDate: {
    fontSize: 11.5,
    color: COLORS.muted,
    fontFamily: FONT_REGULAR,
  },
  reportListActionSide: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statusSmallPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 24,
    marginLeft: 12,
    width: 228,
    minHeight: 238,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reportBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-end",
  },
  reportBadgePdf: {
    backgroundColor: COLORS.reportDocumentBg,
    borderWidth: 1,
    borderColor: COLORS.reportDocumentBorder,
  },
  reportBadgeDtc: {
    backgroundColor: COLORS.reportAlertBg,
    borderWidth: 1,
    borderColor: COLORS.reportAlertBorder,
  },
  reportBadgeText: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "900",
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  reportBadgeTextPdf: {
    color: COLORS.reportDocument,
  },
  reportBadgeTextDtc: {
    color: COLORS.reportAlert,
  },
  reportIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.softGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
    fontFamily: FONT_BOLD,
    lineHeight: 22,
  },
  cardDate: {
    fontSize: 12,
    lineHeight: 20,
    color: COLORS.muted,
    marginTop: 5,
    textAlign: "right",
    fontFamily: FONT_REGULAR,
    includeFontPadding: true,
  },
  statusPill: {
    alignSelf: "flex-end",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
  },
  statusPillPending: {
    backgroundColor: COLORS.reportPendingBg,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.24)",
  },
  statusPillSaved: {
    backgroundColor: COLORS.reportSavedBg,
    borderWidth: 1,
    borderColor: "rgba(31,138,76,0.14)",
  },
  statusPillText: {
    fontSize: 10.5,
    lineHeight: 17,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  statusPillTextPending: {
    color: COLORS.reportPending,
  },
  statusPillTextSaved: {
    color: COLORS.reportSaved,
  },
  actionsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },
  saveReportBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  saveReportContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveReportText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 20,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  rejectBtn: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.neutralActionBorder,
    backgroundColor: COLORS.neutralActionBg,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    color: COLORS.neutralAction,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  openReportBtn: {
    marginTop: 14,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  openReportText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 20,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  maintenanceLoadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 10,
  },

  /* ─── الستايلات الحديثة والمحسنة لقسم الصيانات (UX Optimized) ─── */
  uxMaintenanceCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 9,
    elevation: 2,
  },
  uxCardTopElement: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  uxTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  uxTextGroup: {
    alignItems: "flex-end",
    flex: 1,
  },
  uxMetaRow: {
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  uxMaintenanceTitle: {
    fontSize: 15.5,
    fontFamily: FONT_BOLD,
    color: COLORS.text,
    lineHeight: 23,
  },
  uxMaintenanceSub: {
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.muted,
    fontFamily: FONT_REGULAR,
    marginTop: 2,
    includeFontPadding: true,
  },
  uxIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.softGray,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  uxCardActions: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  resetButtonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  uxEditHint: {
    width: 22,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  uxStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  uxStatusBadgeText: {
    fontSize: 11,
    lineHeight: 18,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  uxGridContainer: {
    flexDirection: "row-reverse",
    backgroundColor: COLORS.soft,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  uxGridItem: {
    flex: 1,
    alignItems: "center",
  },
  uxGridDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  uxGridLabel: {
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.muted,
    fontFamily: FONT_REGULAR,
    marginBottom: 3,
    includeFontPadding: true,
  },
  uxGridValue: {
    fontSize: 13,
    lineHeight: 21,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  uxFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  uxProgressWrapper: {
    flex: 1,
    height: 7,
    backgroundColor: "#ECECEC",
    borderRadius: 7,
    overflow: "hidden",
    flexDirection: "row-reverse",
  },
  uxProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  uxActionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  uxActionText: {
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.muted,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  dateModalCard: {
    width: "100%",
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  dateModalHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  dateModalTitleBox: {
    flex: 1,
  },
  dateModalTitle: {
    fontSize: 16,
    lineHeight: 25,
    color: COLORS.text,
    fontFamily: FONT_EXTRABOLD,
    includeFontPadding: true,
  },
  dateModalSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 20,
    color: COLORS.muted,
    fontFamily: FONT_REGULAR,
    includeFontPadding: true,
  },
  dateModalSmallButton: {
    minWidth: 64,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.softGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  dateModalSmallButtonText: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: FONT_BOLD,
  },
  dateModalTextButton: {
    minWidth: 58,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  dateCancelText: {
    fontSize: 13,
    lineHeight: 22,
    color: COLORS.muted,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
    paddingBottom: 1,
  },
  datePickerBox: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  datePicker: {
    width: "100%",
    height: Platform.OS === "ios" ? 216 : undefined,
  },
  dateConfirmButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  dateConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 23,
    fontFamily: FONT_BOLD,
    includeFontPadding: true,
  },
  successOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  successCard: {
    width: "100%",
    maxWidth: 330,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  successAnimationWrapper: {
    width: 94,
    height: 94,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successLottie: {
    width: 94,
    height: 94,
  },
  successTitle: {
    fontSize: 17,
    lineHeight: 28,
    fontFamily: FONT_EXTRABOLD,
    includeFontPadding: true,
    paddingBottom: 1,
  },
  successMessage: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 22,
    fontFamily: FONT_SEMIBOLD,
    includeFontPadding: true,
    paddingHorizontal: 4,
  },
});