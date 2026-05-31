import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const [savingId, setSavingId] = useState<number | null>(null);
  const [reportFilter, setReportFilter] = useState<"all" | "saved" | "pending">(
    "all",
  );

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentEditingItem, setCurrentEditingItem] =
    useState<MaintenanceItem | null>(null);

  // دالة مساعدة لاختيار أيقونة الصيانة بناءً على الكلمات المفتاحية بالاسم لمظهر احترافي
  const getMaintenanceIcon = (
    title: string,
  ): React.ComponentProps<typeof MaterialCommunityIcons>["name"] => {
    const t = title.toLowerCase();

    if (t.includes("زيت المحرك")) return "oil";
    if (t.includes("الكفرات") || t.includes("كفر")) return "car-tire-alert";
    if (t.includes("الفرامل") || t.includes("فحم")) return "car-brake-alert";
    if (t.includes("فلتر الهواء")) return "air-filter";
    if (t.includes("بطارية") || t.includes("البطارية")) return "battery";

    return "car-cog";
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
      Alert.alert("خطأ", "فشل حفظ التقرير");
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
      Alert.alert("خطأ", "تعذر تجاهل التقرير");
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

  const handleConfirmDate = async (date: Date) => {
    setDatePickerVisible(false);
    if (!currentEditingItem || !userId) return;

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

      Alert.alert("تم", `تم تحديث صيانة (${currentEditingItem.title}) بنجاح`);
    } catch (err: any) {
      console.error("Save maintenance failed:", err);
      Alert.alert("خطأ", err?.message || "تعذر حفظ التعديل");
    } finally {
      setSavingId(null);
      setCurrentEditingItem(null);
    }
  };

  // دالة إعادة تعيين البيانات لتصبح null كبداية التطبيق
  const handleResetMaintenance = (item: MaintenanceItem) => {
    if (!userId) return;

    Alert.alert(
      "إعادة تعيين الصيانة",
      `هل أنت متأكد من رغبتك في إعادة تعيين صيانة (${item.title})؟ سيتم تصفير التواريخ لتصبح فارغة تماماً.`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إعادة تعيين",
          style: "default",
          onPress: async () => {
            setSavingId(item.maintenanceTypeId);
            try {
              // نقوم بعمل update للقيم لتصبح null بدلاً من حذف الصف كاملاً للحفاظ على التهيئة المبدئية
              const { error } = await supabase
                .from("maintenance_reminders")
                .update({
                  last_date: null,
                  next_date: null,
                  notification_stage: 0,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", userId)
                .eq("maintenance_type_id", item.maintenanceTypeId);

              if (error) throw error;
              await fetchMaintenance();
              Alert.alert("تم", "تمت إعادة تعيين بيانات الصيانة بنجاح");
            } catch (err: any) {
              console.error("Reset maintenance failed:", err);
              Alert.alert("خطأ", "تعذر إعادة تعيين بيانات الصيانة");
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

      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>المحفظة</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.headerDivider} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── قسم التقارير ─── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconCircle}>
            <Feather name="file-text" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.sectionTextBox}>
            <Text style={styles.sectionTitle}>التقارير</Text>
            <Text style={styles.sectionSubtitle}>
              تقارير الفحص المحفوظة وغير المحفوظة
            </Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {[
            { key: "all", label: "الكل" },
            { key: "saved", label: "المحفوظة" },
            { key: "pending", label: "غير المحفوظة" },
          ].map((f) => {
            const key = f.key as "all" | "saved" | "pending";
            const active = reportFilter === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setReportFilter(key)}
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {reportsLoading && reports.length === 0 && (
            <View style={styles.emptyCard}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.emptyText}>جاري تحميل التقارير...</Text>
            </View>
          )}

          {!reportsLoading && visibleReports.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Feather name="folder" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>
                {!userId ? "يجب تسجيل الدخول" : "لا توجد تقارير"}
              </Text>
            </View>
          )}

          {visibleReports.map((report: any) => {
            const isPending = report.status === "pending";
            const isDtc = report.type === "DTC";

            return (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isPending
                          ? COLORS.warning
                          : COLORS.success,
                      },
                    ]}
                  />
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
                      {report.type}
                    </Text>
                  </View>
                </View>

                <View style={styles.reportIconCircle}>
                  <Feather
                    name={isDtc ? "alert-triangle" : "file-text"}
                    size={22}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.cardTitle}>{report.title}</Text>
                <Text style={styles.cardDate}>{report.date}</Text>

                <View
                  style={[
                    styles.statusPill,
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
                    {isPending ? "غير محفوظ" : "محفوظ"}
                  </Text>
                </View>

                {isPending ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.saveReportBtn}
                      activeOpacity={0.85}
                      onPress={() => handleSaveReport(report.id)}
                    >
                      <Text style={styles.saveReportText}>حفظ التقرير</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      activeOpacity={0.85}
                      onPress={() => handleRejectReport(report.id)}
                    >
                      <Text style={styles.rejectBtnText}>تجاهل</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.openReportBtn}
                    activeOpacity={0.85}
                    onPress={() => openReport(report.id)}
                  >
                    <Text style={styles.openReportText}>فتح التقرير</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* ─── قسم الصيانات الدورية ─── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTextBox}>
            <Text style={styles.sectionTitle}>الصيانات الدورية</Text>
            <Text style={styles.sectionSubtitle}>
              اضغط على أي بطاقة لتحديث تاريخ الصيانة فوراً
            </Text>
          </View>
        </View>

        {maintenanceLoading ? (
          <View style={styles.maintenanceLoadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.emptyText}>جاري تحميل الصيانات...</Text>
          </View>
        ) : (
          maintenance.map((item: MaintenanceItem) => {
            // معالجة وحساب الوقت بدقة محلية متكاملة لمنع تفاوت الأيام الخاطئ
            let localRemainingDays = item.remainingDays;
            if (item.nextDate) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const [y, m, d] = item.nextDate.split("-").map(Number);
              const nextLocally = new Date(y, m - 1, d);
              nextLocally.setHours(0, 0, 0, 0);

              localRemainingDays = Math.round(
                (nextLocally.getTime() - today.getTime()) /
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

            // تحديد الحالة بناءً على الأيام الدقيقة المحسوبة محلياً
            let localStatus = item.status;
            if (hasData && localRemainingDays !== null) {
              if (localRemainingDays < 0) localStatus = "overdue";
              else if (localRemainingDays <= 7) localStatus = "due";
              else localStatus = "upcoming";
            }

            const isUpcoming = localStatus === "upcoming";
            const isSoon = localStatus === "due";
            const isOverdue = localStatus === "overdue";
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

            let badgeText = "";
            if (!hasData) {
              badgeText = "لم يُسجَّل";
            } else if (isOverdue) {
              const absDays = Math.abs(localRemainingDays ?? 0);
              badgeText = `${absDays} يوم متأخر`;
            } else {
              badgeText = `متبقي ${localRemainingDays} يوم`;
            }

            let valueDateColor = COLORS.text;
            if (isOverdue) valueDateColor = COLORS.danger;
            else if (isSoon) valueDateColor = COLORS.warning;
            else if (isUpcoming) valueDateColor = COLORS.success;

            return (
              <TouchableOpacity
                key={item.maintenanceTypeId}
                style={[
                  styles.uxMaintenanceCard,
                  isCurrentlySaving && { opacity: 0.5 },
                ]}
                activeOpacity={0.75}
                disabled={isCurrentlySaving}
                onPress={() => {
                  setCurrentEditingItem(item);
                  setDatePickerVisible(true);
                }}
              >
                {/* الجزء العلوي: العنوان والأيقونة والـ Badge وإعادة التعيين */}
                <View style={styles.uxCardTopElement}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {hasData && (
                      <TouchableOpacity
                        style={styles.resetButtonCircle}
                        onPress={() => handleResetMaintenance(item)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {/* تم استبدال السلة بأيقونة التحديث وإعادة التعيين الدائرية */}
                        <Feather
                          name="refresh-cw"
                          size={13}
                          color={COLORS.warning}
                        />
                      </TouchableOpacity>
                    )}
                    <View
                      style={[
                        styles.uxStatusBadge,
                        { backgroundColor: statusBg },
                      ]}
                    >
                      {isCurrentlySaving ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.primary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.uxStatusBadgeText,
                            { color: statusColor },
                          ]}
                        >
                          {badgeText}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.uxTitleRow}>
                    <View style={styles.uxTextGroup}>
                      <Text style={styles.uxMaintenanceTitle}>
                        {item.title}
                      </Text>
                      <Text style={styles.uxMaintenanceSub}>
                        كل {item.intervalDays} يوم
                      </Text>
                    </View>
                    <View style={styles.uxIconContainer}>
                      <MaterialCommunityIcons
                        name={getMaintenanceIcon(item.title)}
                        size={22}
                        color={COLORS.primary}
                      />
                    </View>
                  </View>
                </View>

                {/* جزء التواريخ */}
                <View style={styles.uxGridContainer}>
                  {/* اليمين: آخر صيانة تمت */}
                  <View style={styles.uxGridItem}>
                    <Text style={styles.uxGridLabel}>آخر صيانة</Text>
                    <Text style={styles.uxGridValue}>
                      {item.lastDate || "—"}
                    </Text>
                  </View>

                  <View style={styles.uxGridDivider} />

                  {/* اليسار: الموعد القادم المستحق */}
                  <View style={styles.uxGridItem}>
                    <Text style={styles.uxGridLabel}>الموعد القادم</Text>
                    <Text
                      style={[styles.uxGridValue, { color: valueDateColor }]}
                    >
                      {item.nextDate || "—"}
                    </Text>
                  </View>
                </View>

                {/* شريط التقدم السفلي ومؤشر التفاعل */}
                <View style={styles.uxFooterRow}>
                  <View style={styles.uxActionIndicator}>
                    <Feather
                      name="calendar"
                      size={13}
                      color={COLORS.mutedLight}
                    />
                    <Text style={styles.uxActionText}>تحديث</Text>
                  </View>
                  <View style={styles.uxProgressWrapper}>
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

      {/* منتقي التاريخ الموحد */}
      {datePickerVisible && (
        <DateTimePicker
          value={
            currentEditingItem?.lastDate
              ? new Date(
                  currentEditingItem.lastDate.split("-").map(Number)[0],
                  currentEditingItem.lastDate.split("-").map(Number)[1] - 1,
                  currentEditingItem.lastDate.split("-").map(Number)[2],
                )
              : new Date()
          }
          mode="date"
          display="default"
          locale="ar"
          onChange={(event, selectedDate) => {
            setDatePickerVisible(false);
            if (event.type === "dismissed") {
              setCurrentEditingItem(null);
              return;
            }
            if (selectedDate) {
              handleConfirmDate(selectedDate);
            }
          }}
        />
      )}
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
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 130,
    backgroundColor: COLORS.bg,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 14,
    gap: 12,
  },
  sectionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.softGray,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTextBox: {
    flex: 1,
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
  },
  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    textAlign: "right",
  },
  filterRow: {
    flexDirection: "row-reverse",
    marginBottom: 12,
    gap: 8,
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
    fontWeight: "bold",
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
    fontWeight: "bold",
    fontSize: 13,
    textAlign: "center",
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 24,
    marginLeft: 12,
    width: 222,
    minHeight: 232,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
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
    backgroundColor: COLORS.dangerBg,
  },
  reportBadgeDtc: {
    backgroundColor: COLORS.softGray,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  reportBadgeTextPdf: {
    color: COLORS.primary,
  },
  reportBadgeTextDtc: {
    color: COLORS.muted,
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
    lineHeight: 22,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
    textAlign: "right",
  },
  statusPill: {
    alignSelf: "flex-end",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
  },
  statusPillPending: {
    backgroundColor: COLORS.warningBg,
  },
  statusPillSaved: {
    backgroundColor: COLORS.successBg,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: "bold",
  },
  statusPillTextPending: {
    color: COLORS.warning,
  },
  statusPillTextSaved: {
    color: COLORS.success,
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
  },
  saveReportText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "900",
    fontSize: 12,
  },
  rejectBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.softGray,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
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
  },
  maintenanceLoadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 10,
  },

  /* ─── الصيانات الدورية (UX Optimized) ─── */
  uxMaintenanceCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  uxCardTopElement: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  uxTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uxTextGroup: {
    alignItems: "flex-end",
  },
  uxMaintenanceTitle: {
    fontSize: 15.5,
    fontWeight: "bold",
    color: COLORS.text,
  },
  uxMaintenanceSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  uxIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.softGray,
    justifyContent: "center",
    alignItems: "center",
  },
  uxStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  uxStatusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  uxGridContainer: {
    flexDirection: "row-reverse",
    backgroundColor: COLORS.soft,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 14,
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
    marginBottom: 4,
  },
  uxGridValue: {
    fontSize: 13,
    fontWeight: "bold",
  },
  uxFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  uxProgressWrapper: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.softGray,
    borderRadius: 3,
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
    fontWeight: "bold",
  },
  resetButtonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.warningBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
});
