import { Feather } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaintenanceItem {
  // reminder_id from create_reminders
  reminderId: number | null;
  // id from maintenance_types
  maintenanceTypeId: number;
  title: string;
  lastDate: string;
  nextDate: string;
  intervalDays: number;
  remainingDays: number | null;
  status: "upcoming" | "due" | "overdue";
  notificationId: string | null;
}

type ReportStatus = "pending" | "saved" | "temp_rejected" | "deleted";

interface ReportItem {
  id: string;
  title: string;
  date: string;
  type: "PDF" | "DTC";
  status: ReportStatus;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mapRowToReport = (row: any): ReportItem => {
  const content = row?.content || {};
  const hasDtc =
    Array.isArray(content.detected_dtcs) && content.detected_dtcs.length > 0;
  const ts = content.timestamp || row.created_at;

  let dateLabel = "";
  try {
    dateLabel = new Date(ts).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    dateLabel = String(ts || "");
  }

  return {
    id: row.id,
    title: hasDtc ? "تقرير أعطال DTC" : "تقرير فحص شامل",
    date: dateLabel,
    type: hasDtc ? "DTC" : "PDF",
    status: (row.status || "pending") as ReportStatus,
    createdAt: row.created_at,
  };
};

const calcRemainingDays = (nextDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextDate);
  next.setHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getMaintenanceStatus = (
  remainingDays: number | null,
): "upcoming" | "due" | "overdue" => {
  if (remainingDays === null) return "upcoming";
  if (remainingDays < 0) return "overdue";
  if (remainingDays <= 7) return "due";
  return "upcoming";
};

const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    Alert.alert("تنبيه", "يرجى السماح بالإشعارات لتفعيل التذكيرات");
  }
};

// القائمة الثابتة لأنواع الصيانة — تعكس جدول maintenance_types في قاعدة البيانات
// id يجب أن يطابق الـ id الموجود في جدول maintenance_types
const STATIC_MAINTENANCE_TYPES: Pick<
  MaintenanceItem,
  "maintenanceTypeId" | "title" | "intervalDays"
>[] = [
  { maintenanceTypeId: 1, title: "زيت المحرك", intervalDays: 90 },
  { maintenanceTypeId: 2, title: "الكفرات", intervalDays: 365 },
  { maintenanceTypeId: 3, title: "الفرامل", intervalDays: 180 },
  { maintenanceTypeId: 4, title: "فلتر الهواء", intervalDays: 90 },
  { maintenanceTypeId: 5, title: "البطارية", intervalDays: 730 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Wallet() {
  const [fontsLoaded] = useFonts({
    "Tajawal-Regular": require("../../assets/fonts/Tajawal-Regular.ttf"),
    "Tajawal-Bold": require("../../assets/fonts/Tajawal-Bold.ttf"),
  });

  const { session } = useAuth();
  const userId = session?.user?.id;

  const scheduleMaintenanceNotification = async (
    title: string,
    nextDate: string,
    maintenanceTypeId: number,
  ) => {
    const notificationId = `maintenance-${maintenanceTypeId}`;
    const targetDate = new Date(nextDate);

    const daysBefore = 7;
    const diff = targetDate.getTime() - Date.now();

    if (diff < 0) return;

    const notifyDate = new Date(targetDate);
    notifyDate.setDate(notifyDate.getDate() - daysBefore);

    if (notifyDate.getTime() < Date.now()) {
      notifyDate.setTime(Date.now() + 5000);
    }

    notifyDate.setHours(9);
    notifyDate.setSeconds(0);
    notifyDate.setMilliseconds(0);

    if (notifyDate.getTime() < Date.now()) return;

    await Notifications.cancelScheduledNotificationAsync(notificationId);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "تذكير صيانة",
        body: `اقترب موعد صيانة ${title}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notifyDate,
      },
    });

    return id;
  };

  // ── State ──────────────────────────────────────────────────────────────────

  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportFilter, setReportFilter] = useState<"all" | "saved" | "pending">(
    "all",
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState<MaintenanceItem[]>([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<number | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchReports = useCallback(async () => {
    if (!userId) {
      setReports([]);
      setReportsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("id, content, status, created_at, is_permanently_saved")
        .eq("user_id", userId)
        .in("status", ["pending", "saved"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports((data || []).map(mapRowToReport));
    } catch (err: any) {
      console.error("Failed to load reports:", err?.message || err);
    } finally {
      setReportsLoading(false);
    }
  }, [userId]);

  const fetchMaintenance = useCallback(async () => {
    if (!userId) {
      // عرض القائمة الثابتة بدون تواريخ حتى لو المستخدم مش مسجل دخول
      setMaintenance(
        STATIC_MAINTENANCE_TYPES.map((t) => ({
          ...t,
          reminderId: null,
          lastDate: "",
          nextDate: "",
          remainingDays: 0,
          status: "upcoming",
          notificationId: null,
        })),
      );
      setMaintenanceLoading(false);
      return;
    }
    try {
      // نجيب فقط التواريخ من maintenance_reminders
      const { data: reminders, error } = await supabase
        .from("maintenance_reminders")
        .select(
          "reminder_id, maintenance_type_id, last_date, next_date, notification_id",
        )
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      const remindersMap = new Map(
        (reminders || []).map((r: any) => [r.maintenance_type_id, r]),
      );

      // ندمج القائمة الثابتة مع التواريخ الديناميكية
      const items = STATIC_MAINTENANCE_TYPES.map((type) => {
        const reminder = remindersMap.get(type.maintenanceTypeId);

        const nextDate = reminder?.next_date ?? "";
        const remainingDays = nextDate ? calcRemainingDays(nextDate) : null;

        return {
          ...type,
          reminderId: reminder?.reminder_id ?? null,
          lastDate: reminder?.last_date ?? "",
          nextDate,
          remainingDays,
          status: getMaintenanceStatus(remainingDays),
          notificationId: reminder?.notification_id ?? null,
        };
      });
      setMaintenance(items);
    } catch (err: any) {
      console.error("Failed to load maintenance:", err?.message || err);
    } finally {
      setMaintenanceLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        await fetchReports();
        await fetchMaintenance();
      };

      load();
    }, [fetchReports, fetchMaintenance]),
  );

  const rescheduleAllNotifications = useCallback(
    async (list: MaintenanceItem[]) => {
      if (!list.length) return;

      for (const item of list) {
        if (!item.nextDate || !item.maintenanceTypeId) continue;

        if (item.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(
            item.notificationId,
          );
        }

        await scheduleMaintenanceNotification(
          item.title,
          item.nextDate,
          item.maintenanceTypeId,
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (!maintenance.length) return;
    rescheduleAllNotifications(maintenance);
  }, [maintenance, rescheduleAllNotifications]);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`wallet-reports-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchReports(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchReports]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveReport = async (id: string) => {
    if (!userId) return;
    const prev = reports;

    setReports((rs) =>
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

    setReports((rs) => rs.filter((r) => r.id !== id));

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

  const openModal = () => {
    setEditData([...maintenance]);
    setModalVisible(true);
  };

  // currentEditingId هنا هو maintenanceTypeId
  const handleConfirmDate = (date: Date) => {
    setDatePickerVisible(false);
    if (currentEditingId === null) return;

    const formatted = date.toISOString().split("T")[0];

    // تحديث محلي فقط — الحفظ يصير عند الضغط على "حفظ التغييرات"
    setEditData((prev) =>
      prev.map((item) =>
        item.maintenanceTypeId === currentEditingId
          ? { ...item, lastDate: formatted }
          : item,
      ),
    );
  };

  const saveAll = async () => {
    if (!userId) return;

    // نحدد فقط العناصر اللي تغير فيها lastDate مقارنةً بالبيانات الحالية
    const changed = editData.filter((item) => {
      const original = maintenance.find(
        (m) => m.maintenanceTypeId === item.maintenanceTypeId,
      );
      return item.lastDate && item.lastDate !== original?.lastDate;
    });

    if (changed.length === 0) {
      setModalVisible(false);
      return;
    }

    setSavingId(-1); // -1 = كل شيء يتحفظ
    try {
      await Promise.all(
        changed.map((item) =>
          supabase.functions
            .invoke("create-reminder", {
              body: {
                user_id: userId,
                maintenance_type_id: item.maintenanceTypeId,
                last_date: item.lastDate,
              },
            })
            .then(({ error }) => {
              if (error) throw error;
            }),
        ),
      );

      // رفرش الواجهة من قاعدة البيانات بعد الحفظ
      await fetchMaintenance();
      for (const item of changed) {
        const intervalItem = STATIC_MAINTENANCE_TYPES.find(
          (t) => t.maintenanceTypeId === item.maintenanceTypeId,
        );

        if (!intervalItem) continue;

        const date = new Date(item.lastDate);
        date.setDate(date.getDate() + intervalItem.intervalDays);

        const nextDate = date.toISOString().split("T")[0];

        const notificationId = await scheduleMaintenanceNotification(
          item.title,
          nextDate,
          item.maintenanceTypeId,
        );

        if (notificationId) {
          await supabase
            .from("maintenance_reminders")
            .update({
              notification_id: notificationId,
            })
            .eq("user_id", userId)
            .eq("maintenance_type_id", item.maintenanceTypeId);
        }
      }
      setModalVisible(false);
    } catch (err: any) {
      console.error("Save maintenance failed:", err?.message || err);
      Alert.alert("خطأ", "تعذر حفظ التعديلات، حاول مجدداً");
    } finally {
      setSavingId(null);
    }
  };

  // ── Derived Values ─────────────────────────────────────────────────────────

  const visibleReports = reports.filter((r) => {
    if (reportFilter === "all") return true;
    return r.status === reportFilter;
  });

  const getFilterCount = (key: "all" | "saved" | "pending") => {
    if (key === "all") {
      return reports.filter(
        (r) => r.status === "saved" || r.status === "pending",
      ).length;
    }
    return reports.filter((r) => r.status === key).length;
  };

  // ── Early Return ───────────────────────────────────────────────────────────

  if (!fontsLoaded) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
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
        {/* ── Reports Section ── */}
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

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(
            [
              { key: "all", label: "الكل" },
              { key: "saved", label: "المحفوظة" },
              { key: "pending", label: "غير المحفوظة" },
            ] as { key: "all" | "saved" | "pending"; label: string }[]
          ).map((f) => {
            const active = reportFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setReportFilter(f.key)}
                activeOpacity={0.85}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {f.label} ({getFilterCount(f.key)})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Report Cards */}
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

          {visibleReports.map((report) => {
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

        {/* ── Maintenance Section ── */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity
            onPress={openModal}
            style={styles.editActionBtn}
            activeOpacity={0.85}
          >
            <Feather name="edit-3" size={15} color="#FFFFFF" />
            <Text style={styles.editActionText}>تعديل البيانات</Text>
          </TouchableOpacity>
          <View style={styles.sectionTextBox}>
            <Text style={styles.sectionTitle}>الصيانات الدورية</Text>
            <Text style={styles.sectionSubtitle}>
              مواعيد الصيانة القادمة حسب آخر تحديث
            </Text>
          </View>
        </View>

        {maintenanceLoading ? (
          <View style={styles.maintenanceLoadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.emptyText}>جاري تحميل الصيانات...</Text>
          </View>
        ) : (
          maintenance.map((item) => {
            const hasData = !!item.lastDate;
            const progress = hasData
              ? Math.min(
                  ((item.intervalDays - (item.remainingDays ?? 0)) /
                    item.intervalDays) *
                    100,
                  100,
                )
              : 0;
            const isSoon = item.status === "due";
            const isOverdue = item.status === "overdue";

            return (
              <View key={item.maintenanceTypeId} style={styles.maintenanceCard}>
                <View style={styles.maintenanceHeader}>
                  <View
                    style={[
                      styles.daysBadge,
                      !hasData
                        ? styles.daysBadgeNormal
                        : isOverdue
                          ? styles.daysBadgeDanger
                          : isSoon
                            ? styles.daysBadgeWarning
                            : styles.daysBadgeNormal,
                    ]}
                  >
                    <Text
                      style={[
                        styles.daysBadgeText,
                        isOverdue
                          ? styles.daysBadgeTextDanger
                          : isSoon
                            ? styles.daysBadgeTextWarning
                            : styles.daysBadgeTextNormal,
                      ]}
                    >
                      {!hasData
                        ? "لم يُسجَّل بعد"
                        : isOverdue
                          ? "متأخر"
                          : isSoon
                            ? `مستحقة خلال ${item.remainingDays} يوم`
                            : `متبقي ${item.remainingDays} يوم`}
                    </Text>
                  </View>
                  <View style={styles.maintenanceTitleBox}>
                    <Text style={styles.maintenanceTitle}>{item.title}</Text>
                    <Text style={styles.maintenanceHint}>
                      كل {item.intervalDays} يوم
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>موعد الصيانة القادم:</Text>
                  <Text style={styles.nextDateText}>
                    {item.nextDate || "—"}
                  </Text>
                </View>
                <View style={[styles.dateRow, { marginTop: 5 }]}>
                  <Text style={styles.dateLabel}>آخر صيانة تمت:</Text>
                  <Text style={styles.lastDateText}>
                    {item.lastDate || "—"}
                  </Text>
                </View>

                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${progress}%`,
                        backgroundColor: isSoon
                          ? COLORS.warning
                          : COLORS.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Edit Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.85}
              >
                <Feather name="x" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تعديل البيانات</Text>
              <View style={styles.modalHeaderSide} />
            </View>

            <View style={styles.modalDivider} />

            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {editData.map((item) => (
                <View key={item.maintenanceTypeId} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{item.title}</Text>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={0.85}
                    onPress={() => {
                      setCurrentEditingId(item.maintenanceTypeId);
                      setDatePickerVisible(true);
                    }}
                  >
                    <TextInput
                      value={item.lastDate}
                      placeholder="اختر التاريخ"
                      placeholderTextColor={COLORS.mutedLight}
                      style={styles.input}
                      editable={false}
                      textAlign="center"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, savingId === -1 && { opacity: 0.7 }]}
              onPress={saveAll}
              activeOpacity={0.85}
              disabled={savingId === -1}
            >
              {savingId === -1 ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
              )}
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={datePickerVisible}
              mode="date"
              onConfirm={handleConfirmDate}
              onCancel={() => setDatePickerVisible(false)}
            />
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

  // Header
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

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 130,
    backgroundColor: COLORS.bg,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
    gap: 12,
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
  sectionTextBox: {
    flex: 1,
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 16,
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

  // Filter
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
    fontFamily: "Tajawal-Bold",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },

  // Horizontal Scroll
  horizontalScroll: {
    paddingRight: 2,
    paddingLeft: 18,
    flexDirection: "row",
  },

  // Empty State
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

  // Report Card
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
    fontFamily: "Tajawal-Bold",
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
    backgroundColor: COLORS.warningBg,
  },
  statusPillSaved: {
    backgroundColor: COLORS.successBg,
  },
  statusPillText: {
    fontSize: 10.5,
    fontFamily: "Tajawal-Bold",
  },
  statusPillTextPending: {
    color: COLORS.warning,
  },
  statusPillTextSaved: {
    color: COLORS.success,
  },

  // Report Actions
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
    fontFamily: "Tajawal-Bold",
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

  // Edit Button
  editActionBtn: {
    height: 40,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  editActionText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "900",
    fontSize: 12,
    fontFamily: "Tajawal-Bold",
  },

  // Maintenance Card
  maintenanceLoadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 10,
  },
  maintenanceCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  maintenanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  maintenanceTitleBox: {
    flex: 1,
    alignItems: "flex-end",
  },
  maintenanceTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "right",
    fontFamily: "Tajawal-Bold",
  },
  maintenanceHint: {
    marginTop: 3,
    fontSize: 11.5,
    color: COLORS.muted,
    fontFamily: "Tajawal-Regular",
    textAlign: "right",
  },
  daysBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  daysBadgeNormal: {
    backgroundColor: COLORS.softGray,
  },
  daysBadgeWarning: {
    backgroundColor: COLORS.warningBg,
  },
  daysBadgeText: {
    fontSize: 11,
    fontFamily: "Tajawal-Bold",
  },
  daysBadgeTextNormal: {
    color: COLORS.text,
  },
  daysBadgeTextWarning: {
    color: COLORS.warning,
  },
  daysBadgeDanger: {
    backgroundColor: COLORS.dangerBg,
  },

  daysBadgeTextDanger: {
    color: COLORS.danger,
  },

  divider: {
    height: 1,
    backgroundColor: "#F2F2F2",
    marginVertical: 12,
  },
  dateRow: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 13,
    color: COLORS.muted,
    marginLeft: 8,
    fontFamily: "Tajawal-Regular",
  },
  nextDateText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
    fontFamily: "Tajawal-Bold",
  },
  lastDateText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
    fontFamily: "Tajawal-Regular",
  },
  progressContainer: {
    height: 8,
    backgroundColor: COLORS.softGray,
    borderRadius: 4,
    marginTop: 15,
    overflow: "hidden",
    flexDirection: "row-reverse",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 22,
    maxHeight: "90%",
  },
  modalHeader: {
    minHeight: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.softGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderSide: {
    width: 42,
    height: 42,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    fontFamily: "Tajawal-Bold",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#F2F2F2",
    marginBottom: 14,
  },
  modalList: {
    marginBottom: 18,
  },

  // Input Group
  inputGroup: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.soft,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "right",
    color: COLORS.primary,
    fontFamily: "Tajawal-Bold",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Tajawal-Regular",
  },

  // Save Button
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  saveBtnText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "900",
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
  },
});
