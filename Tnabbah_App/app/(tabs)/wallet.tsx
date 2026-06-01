import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import { useWallet } from "../../providers/WalletProvider";
import { useLanguage } from "../../providers/LanguageProvider";

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
  warning: "#B7791F",
  warningBg: "#FFF8E1",
  success: "#1F8A4C",
  successBg: "#EFFAF3",

  reportSaved: "#1F8A4C",
  reportSavedBg: "#EFFAF3",
  reportPending: "#B7791F",
  reportPendingBg: "#FFF8E1",
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
  } = useWallet();

  const [fontsLoaded] = useFonts({
    "Tajawal-Regular": require("../../assets/fonts/Tajawal-Regular.ttf"),
    "Tajawal-Bold": require("../../assets/fonts/Tajawal-Bold.ttf"),
  });

  const { session } = useAuth();
  const userId = session?.user?.id;
  const { t, isArabic, language } = useLanguage();

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
  const [showAllReports, setShowAllReports] = useState(false);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(new Date());
  const [currentEditingItem, setCurrentEditingItem] =
    useState<MaintenanceItem | null>(null);


  const translateMaintenanceTitle = (title: string) => {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes("زيت المحرك") || normalizedTitle.includes("engine oil")) {
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

    if (normalizedTitle.includes("فلتر الهواء") || normalizedTitle.includes("air filter")) {
      return t.walletAirFilter;
    }

    if (normalizedTitle.includes("بطارية") || normalizedTitle.includes("البطارية") || normalizedTitle.includes("battery")) {
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
    if (t.includes("الكفرات") || t.includes("كفر") || t.includes("tires") || t.includes("tyres")) return "car-tire-alert";
    if (t.includes("الفرامل") || t.includes("فحم") || t.includes("brake")) return "car-brake-alert";
    if (t.includes("فلتر الهواء") || t.includes("air filter")) return "air-filter";
    if (t.includes("بطارية") || t.includes("البطارية") || t.includes("battery")) return "battery"; // إيقونة البطارية المضافة هنا

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

  const openReport = (id: string) => {
    router.push({ pathname: "/report", params: { id } });
  };

  const formatLocalDate = (date: Date) => {
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
    if (!currentEditingItem || !userId) {
      setCurrentEditingItem(null);
      return;
    }

    const selectedDateStr = formatLocalDate(date);
    if (selectedDateStr === currentEditingItem.lastDate) return;

    setSavingId(currentEditingItem.maintenanceTypeId);

    try {
      const [year, month, day] = selectedDateStr.split("-").map(Number);
      const next = new Date(year, month - 1, day);
      next.setDate(next.getDate() + currentEditingItem.intervalDays);
      const nextDateStr = formatLocalDate(next);

      const { error } = await supabase.from("maintenance_reminders").upsert(
        {
          user_id: userId,
          maintenance_type_id: currentEditingItem.maintenanceTypeId,
          last_date: selectedDateStr,
          next_date: nextDateStr,
          notification_stage: 0,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,maintenance_type_id" },
      );

      if (error) throw error;
      await fetchMaintenance();

      try {
        await fetch("http://207.180.244.27:3102/check-now", { method: "POST" });
      } catch (error) {
        console.log("Check notifications now error:", error);
      }

      Alert.alert(t.walletDoneTitle, `${t.walletMaintenanceUpdated} (${translateMaintenanceTitle(currentEditingItem.title)})`);
    } catch (err: any) {
      console.error("Save maintenance failed:", err);
      Alert.alert(t.walletErrorTitle, err?.message || t.walletSaveMaintenanceError);
    } finally {
      setSavingId(null);
      setCurrentEditingItem(null);
    }
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>{t.walletTitle}</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.headerDivider} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── قسم التقارير ─── */}
        <View style={[styles.sectionHeaderCard, { flexDirection: iconSideDirection }]}>
          <View style={styles.sectionIconCirclePrimary}>
            <Feather name="file-text" size={18} color="#FFFFFF" />
          </View>

          <View style={[styles.sectionTextBox, { alignItems }]}>
            <Text style={[styles.sectionTitle, { textAlign }]}>
              {t.walletReportsTitle}
            </Text>
            <Text style={[styles.sectionSubtitle, { textAlign }]}>
              {t.walletReportsSubtitle}
            </Text>
          </View>

          <View style={styles.sectionCountBadge}>
            <Text style={styles.sectionCountText}>{reportCount}</Text>
          </View>
        </View>

        <View style={[styles.filterRow, { flexDirection: rowDirection }]}>
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
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {f.label} ({getFilterCount(key)})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.reportsList}>
          {reportsLoading && reports.length === 0 && (
            <View style={styles.emptyFullCard}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.emptyText}>{t.walletLoadingReports}</Text>
            </View>
          )}

          {!reportsLoading && visibleReports.length === 0 && (
            <View style={styles.emptyFullCard}>
              <View style={styles.emptyIconCircle}>
                <Feather name="folder" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>
                {!userId ? t.walletLoginRequired : t.walletNoReports}
              </Text>
            </View>
          )}

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
                style={styles.reportListCard}
                activeOpacity={0.82}
                onPress={() => {
                  if (!isPending) openReport(report.id);
                }}
              >
                <View style={[styles.reportListTop, { flexDirection: iconSideDirection }]}>
                  <View
                    style={[
                      styles.reportListIconBox,
                      isDtc
                        ? styles.reportListIconBoxAlert
                        : styles.reportListIconBoxDocument,
                    ]}
                  >
                    <Feather
                      name={isDtc ? "alert-triangle" : "file-text"}
                      size={18}
                      color={isDtc ? COLORS.reportAlert : COLORS.reportDocument}
                    />
                  </View>

                  <View style={[styles.reportListInfo, { alignItems }]}>
                    <Text style={[styles.reportListTitle, { textAlign }]} numberOfLines={2}>
                      {report.title}
                    </Text>

                    <View
                      style={[
                        styles.reportListMeta,
                        { flexDirection: iconSideDirection, alignSelf: iconSideSelf },
                      ]}
                    >
                      <Text style={[styles.reportListDate, { textAlign }]}>
                        {report.date}
                      </Text>

                      <View
                        style={[
                          styles.reportBadge,
                          isDtc ? styles.reportBadgeDtc : styles.reportBadgePdf,
                        ]}
                      >
                        <Text
                          style={[
                            styles.reportBadgeText,
                            isDtc
                              ? styles.reportBadgeTextDtc
                              : styles.reportBadgeTextPdf,
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
                          ? styles.statusPillPending
                          : styles.statusPillSaved,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isPending
                            ? styles.statusPillTextPending
                            : styles.statusPillTextSaved,
                        ]}
                      >
                        {isPending ? t.walletPending : t.walletSaved}
                      </Text>
                    </View>

                    {!isPending ? (
                      <Feather
                        name={isArabic ? "chevron-left" : "chevron-right"}
                        size={20}
                        color={COLORS.mutedLight}
                      />
                    ) : null}
                  </View>
                </View>

                {isPending ? (
                  <View style={[styles.actionsRow, { flexDirection: rowDirection }]}>
                    <TouchableOpacity
                      style={styles.saveReportBtn}
                      activeOpacity={0.85}
                      onPress={() => handleSaveReport(report.id)}
                    >
                      <View style={[styles.saveReportContent, { flexDirection: iconSideDirection }]}>
                        <Feather name="bookmark" size={14} color="#FFFFFF" />
                        <Text style={styles.saveReportText}>{t.walletSaveReport}</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectBtn}
                      activeOpacity={0.85}
                      onPress={() => handleRejectReport(report.id)}
                    >
                      <Text style={styles.rejectBtnText}>{t.walletIgnore}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}

          {hasMoreReports ? (
            <TouchableOpacity
              style={[styles.viewAllReportsButton, { flexDirection: iconSideDirection }]}
              activeOpacity={0.85}
              onPress={() => setShowAllReports((prev) => !prev)}
            >
              <Text style={styles.viewAllReportsText}>
                {showAllReports
                  ? isArabic
                    ? "عرض أقل"
                    : "Show less"
                  : isArabic
                  ? "عرض الكل"
                  : "View all"}
              </Text>

              <Text style={styles.viewAllReportsCount}>
                {showAllReports
                  ? `${displayedReports.length}/${visibleReports.length}`
                  : `${REPORT_PREVIEW_LIMIT}/${visibleReports.length}`}
              </Text>

              <Feather
                name={showAllReports ? "chevron-up" : isArabic ? "chevron-left" : "chevron-right"}
                size={18}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ─── قسم الصيانات الدورية ─── */}
        <View style={[styles.sectionHeaderCard, styles.maintenanceHeaderCard, { flexDirection: iconSideDirection }]}>
          <View style={styles.sectionIconCirclePrimary}>
            <MaterialCommunityIcons
              name="wrench-clock"
              size={18}
              color="#FFFFFF"
            />
          </View>

          <View style={[styles.sectionTextBox, { alignItems }]}>
            <Text style={[styles.sectionTitle, { textAlign }]}>
              {t.walletMaintenanceTitle}
            </Text>
            <Text style={[styles.sectionSubtitle, { textAlign }]}>
              {t.walletMaintenanceSubtitle}
            </Text>
          </View>

          <View style={styles.sectionCountBadge}>
            <Text style={styles.sectionCountText}>{maintenanceCount}</Text>
          </View>
        </View>

        {maintenanceLoading && maintenance.length === 0 ? (
          <View style={styles.maintenanceLoadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.emptyText}>{t.walletLoadingMaintenance}</Text>
          </View>
        ) : (
          maintenance.map((item: MaintenanceItem) => {
            const hasData = !!item.lastDate;
            const progress = hasData
              ? Math.min(
                  ((item.intervalDays - (item.remainingDays ?? 0)) /
                    item.intervalDays) *
                    100,
                  100,
                )
              : 0;

            const remainingDays = item.remainingDays ?? 0;
            const isOverdue = hasData && (item.status === "overdue" || remainingDays < 0);
            const isSoon =
              hasData &&
              !isOverdue &&
              (item.status === "due" || remainingDays <= 7);
            const isUpcoming = hasData && !isOverdue && !isSoon;
            const isCurrentlySaving = savingId === item.maintenanceTypeId;

            let statusColor = COLORS.success;
            let statusBg = COLORS.successBg;
            if (isSoon) {
              statusColor = COLORS.warning;
              statusBg = COLORS.warningBg;
            }
            if (isOverdue) {
              statusColor = COLORS.danger;
              statusBg = COLORS.dangerBg;
            }
            if (!hasData) {
              statusColor = COLORS.muted;
              statusBg = COLORS.softGray;
            }

            // تحديد نص الشارة بناءً على الشروط الجديدة المطلوبة
            let badgeText = "";
            if (!hasData) {
              badgeText = t.walletNotRegistered;
            } else if (isOverdue) {
              const absDays = Math.abs(item.remainingDays ?? 0);
              badgeText = `${absDays} ${t.walletDaysLate}`;
            } else if (isSoon) {
              badgeText = `${t.walletRemaining} ${remainingDays} ${t.walletDay}`;
            } else {
              badgeText = `${t.walletRemaining} ${remainingDays} ${t.walletDay}`;
            }

            // تلوين نص التاريخ بناءً على الحالة (أخضر للمستقبل البعيد)
            let valueDateColor = COLORS.text;
            if (isOverdue) valueDateColor = COLORS.danger;
            else if (isSoon) valueDateColor = COLORS.warning;
            else if (isUpcoming) valueDateColor = COLORS.success;

            return (
              <TouchableOpacity
                key={item.maintenanceTypeId}
                style={styles.uxMaintenanceCard}
                activeOpacity={0.75}
                disabled={isCurrentlySaving}
                onPress={() => openMaintenanceDatePicker(item)}
              >
                {/* الجزء العلوي: الأيقونة في اليمين للعربي وتنعكس لليسار في الإنجليزي */}
                <View style={[styles.uxCardTopElement, { flexDirection: iconSideDirection }]}>
                  <View style={styles.uxIconContainer}>
                    {isCurrentlySaving ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <MaterialCommunityIcons
                        name={getMaintenanceIcon(item.title)}
                        size={22}
                        color={COLORS.primary}
                      />
                    )}
                  </View>

                  <View style={[styles.uxTextGroup, { alignItems }]}>
                    <Text style={[styles.uxMaintenanceTitle, { textAlign }]}>
                      {translateMaintenanceTitle(item.title)}
                    </Text>
                    <View
                      style={[
                        styles.uxMetaRow,
                        { flexDirection: iconSideDirection, alignSelf: iconSideSelf },
                      ]}
                    >
                      <Text style={[styles.uxMaintenanceSub, { textAlign }]}>
                        {t.walletEvery} {item.intervalDays} {t.walletDay}
                      </Text>
                      <View style={[styles.uxStatusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.uxStatusBadgeText, { color: statusColor }]}>
                          {badgeText}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.uxEditHint}>
                    <Feather
                      name={isArabic ? "chevron-left" : "chevron-right"}
                      size={20}
                      color={COLORS.mutedLight}
                    />
                  </View>
                </View>

                {/* جزء التواريخ: متناسق تماماً مع القراءة العربية من اليمين (الماضي) إلى اليسار (المستقبل) */}
                <View style={[styles.uxGridContainer, { flexDirection: rowDirection }]}>
                  {/* اليمين: آخر صيانة تمت */}
                  <View style={styles.uxGridItem}>
                    <Text style={styles.uxGridLabel}>{t.walletLastMaintenance}</Text>
                    <Text style={styles.uxGridValue}>
                      {item.lastDate || "—"}
                    </Text>
                  </View>

                  <View style={styles.uxGridDivider} />

                  {/* اليسار: الموعد القادم المستحق */}
                  <View style={styles.uxGridItem}>
                    <Text style={styles.uxGridLabel}>{t.walletNextDate}</Text>
                    <Text
                      style={[styles.uxGridValue, { color: valueDateColor }]}
                    >
                      {item.nextDate || "—"}
                    </Text>
                  </View>
                </View>

                {/* شريط التقدم السفلي ومؤشر التفاعل */}
                <View style={[styles.uxFooterRow, { flexDirection: rowDirection }]}>
                  <View style={[styles.uxActionIndicator, { flexDirection: iconSideDirection }]}>
                    <Feather
                      name="calendar"
                      size={13}
                      color={COLORS.mutedLight}
                    />
                    <Text style={styles.uxActionText}>{t.walletUpdate}</Text>
                    <Feather
                      name={isArabic ? "chevron-left" : "chevron-right"}
                      size={13}
                      color={COLORS.mutedLight}
                    />
                  </View>
                  <View style={[styles.uxProgressWrapper, { flexDirection: rowDirection }]}>
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
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalCard}>
            <View style={[styles.dateModalHeader, { flexDirection: rowDirection }]}>
              <TouchableOpacity
                style={styles.dateModalTextButton}
                activeOpacity={0.8}
                onPress={closeDatePicker}
              >
                <Text style={styles.dateCancelText}>
                  {isArabic ? "إلغاء" : "Cancel"}
                </Text>
              </TouchableOpacity>

              <View style={[styles.dateModalTitleBox, { alignItems }]}>
                <Text style={[styles.dateModalTitle, { textAlign }]}>
                  {currentEditingItem
                    ? translateMaintenanceTitle(currentEditingItem.title)
                    : t.walletMaintenanceTitle}
                </Text>
                <Text style={[styles.dateModalSubtitle, { textAlign }]}>
                  {isArabic ? "اختاري تاريخ آخر صيانة" : "Select the last maintenance date"}
                </Text>
              </View>
            </View>

            <View style={styles.datePickerBox}>
              <DateTimePicker
                value={pendingDate}
                mode="date"
                display="spinner"
                            textColor={COLORS.text}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setPendingDate(selectedDate);
                  }
                }}
                style={styles.datePicker}
              />
            </View>

            <TouchableOpacity
              style={styles.dateConfirmButton}
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
    paddingBottom: 10,
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
    fontFamily: "Tajawal-Bold",
    textAlign: "center",
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
    fontFamily: "Tajawal-Bold",
  },
  overviewSubtitle: {
    marginTop: 2,
    fontSize: 10.8,
    lineHeight: 15,
    color: COLORS.muted,
    fontFamily: "Tajawal-Regular",
  },
  overviewNumber: {
    marginTop: 10,
    fontSize: 30,
    lineHeight: 34,
    color: COLORS.primary,
    fontFamily: "Tajawal-Bold",
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
    fontFamily: "Tajawal-Bold",
    includeFontPadding: false,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
    fontFamily: "Tajawal-Bold",
  },
  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    textAlign: "right",
    fontFamily: "Tajawal-Regular",
  },
  filterRow: {
    flexDirection: "row-reverse",
    marginBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: "Tajawal-Bold",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
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
    fontFamily: "Tajawal-Bold",
    fontSize: 13,
    textAlign: "center",
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
    fontFamily: "Tajawal-Bold",
    includeFontPadding: false,
  },
  viewAllReportsCount: {
    color: COLORS.neutralAction,
    fontSize: 12,
    fontFamily: "Tajawal-Bold",
    includeFontPadding: false,
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
    fontFamily: "Tajawal-Bold",
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
    fontFamily: "Tajawal-Regular",
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
    fontWeight: "900",
    fontFamily: "Tajawal-Bold",
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
    fontFamily: "Tajawal-Bold",
    lineHeight: 22,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
    textAlign: "right",
    fontFamily: "Tajawal-Regular",
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
    borderColor: "rgba(183,121,31,0.16)",
  },
  statusPillSaved: {
    backgroundColor: COLORS.reportSavedBg,
    borderWidth: 1,
    borderColor: "rgba(31,138,76,0.14)",
  },
  statusPillText: {
    fontSize: 10.5,
    fontFamily: "Tajawal-Bold",
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
    fontFamily: "Tajawal-Bold",
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
    fontFamily: "Tajawal-Bold",
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
    fontFamily: "Tajawal-Bold",
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
    fontFamily: "Tajawal-Bold",
    color: COLORS.text,
    lineHeight: 23,
  },
  uxMaintenanceSub: {
    fontSize: 11,
    color: COLORS.muted,
    fontFamily: "Tajawal-Regular",
    marginTop: 2,
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
    fontFamily: "Tajawal-Bold",
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
    color: COLORS.muted,
    fontFamily: "Tajawal-Regular",
    marginBottom: 4,
  },
  uxGridValue: {
    fontSize: 13,
    fontFamily: "Tajawal-Bold",
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
    color: COLORS.muted,
    fontFamily: "Tajawal-Bold",
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
    color: COLORS.text,
    fontFamily: "Tajawal-Bold",
  },
  dateModalSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: "Tajawal-Regular",
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
    fontFamily: "Tajawal-Bold",
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
    color: COLORS.muted,
    fontFamily: "Tajawal-Bold",
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
    fontFamily: "Tajawal-Bold",
  },
});
