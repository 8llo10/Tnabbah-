import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useFonts } from "expo-font";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";

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
  id: number;
  title: string;
  lastDate: string;
  nextDate: string;
  intervalDays: number;
  remainingDays: number;
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

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(dateString: string, days: number) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function getRemainingDays(nextDateString: string) {
  const today = new Date();
  const nextDate = new Date(nextDateString);

  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  const diff = nextDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function recalculateMaintenance(item: MaintenanceItem): MaintenanceItem {
  const nextDate = addDays(item.lastDate, item.intervalDays);
  const remainingDays = getRemainingDays(nextDate);

  return {
    ...item,
    nextDate,
    remainingDays,
  };
}

export default function Wallet() {
  const [fontsLoaded] = useFonts({
    "Tajawal-Regular": require("../../assets/fonts/Tajawal-Regular.ttf"),
    "Tajawal-Bold": require("../../assets/fonts/Tajawal-Bold.ttf"),
  });

  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([
    {
      id: 1,
      title: "زيت المحرك",
      lastDate: "2026-01-10",
      nextDate: "2026-04-10",
      intervalDays: 90,
      remainingDays: 45,
    },
    {
      id: 2,
      title: "الكفرات",
      lastDate: "2025-11-20",
      nextDate: "2026-11-20",
      intervalDays: 365,
      remainingDays: 120,
    },
    {
      id: 3,
      title: "الفرامل",
      lastDate: "2025-12-01",
      nextDate: "2026-06-01",
      intervalDays: 180,
      remainingDays: 60,
    },
    {
      id: 4,
      title: "فلتر الهواء",
      lastDate: "2025-12-01",
      nextDate: "2026-03-01",
      intervalDays: 90,
      remainingDays: 15,
    },
    {
      id: 5,
      title: "البطارية",
      lastDate: "2025-12-01",
      nextDate: "2027-12-01",
      intervalDays: 730,
      remainingDays: 500,
    },
  ]);

  const { session } = useAuth();
  const userId = session?.user?.id;

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportFilter, setReportFilter] = useState<
    "all" | "saved" | "pending"
  >("all");

  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState<MaintenanceItem[]>([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<number | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

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
        () => fetchReports()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchReports]);

  const handleSaveReport = async (id: string) => {
    if (!userId) return;

    const prev = reports;

    setReports((rs) =>
      rs.map((r) => (r.id === id ? { ...r, status: "saved" } : r))
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

  const visibleReports = reports.filter((r) => {
    if (reportFilter === "all") return true;
    return r.status === reportFilter;
  });

  const openModal = () => {
    setEditData(maintenance.map((item) => ({ ...item })));
    setModalVisible(true);
  };

  const updateField = (
    id: number,
    field: keyof MaintenanceItem,
    value: string
  ) => {
    const updated = editData.map((item) => {
      if (item.id !== id) return item;

      const updatedItem = {
        ...item,
        [field]: value,
      };

      if (field === "lastDate") {
        return recalculateMaintenance(updatedItem);
      }

      return updatedItem;
    });

    setEditData(updated);
  };

  const saveAll = () => {
    const recalculated = editData.map(recalculateMaintenance);
    setMaintenance(recalculated);
    setModalVisible(false);
    Alert.alert("تم الحفظ", "تم تحديث مواعيد الصيانة بنجاح.");
  };

  const handleConfirmDate = (date: Date) => {
    if (currentEditingId !== null) {
      const formatted = formatDate(date);
      updateField(currentEditingId, "lastDate", formatted);
    }

    setDatePickerVisible(false);
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
        <View style={styles.sectionHeader}>
          <View style={styles.reportSectionIconCircle}>
            <Feather name="file-text" size={24} color={COLORS.primary} />
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

            const count =
              key === "all"
                ? reports.filter(
                    (r) => r.status === "saved" || r.status === "pending"
                  ).length
                : reports.filter((r) => r.status === key).length;

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
                  {f.label} ({count})
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

        <View style={styles.maintenanceSectionTop}>
          <View style={styles.sectionHeader}>
            <View style={styles.maintenanceIconCircle}>
              <Feather name="tool" size={24} color={COLORS.primary} />
            </View>

            <View style={styles.sectionTextBox}>
              <Text style={styles.sectionTitle}>الصيانات الدورية</Text>
              <Text style={styles.sectionSubtitle}>
                مواعيد الصيانة القادمة حسب آخر تحديث
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={openModal}
            style={styles.editActionBtn}
            activeOpacity={0.85}
          >
            <Feather name="calendar" size={18} color={COLORS.primary} />
            <Text style={styles.editActionText}>تعديل بيانات الصيانة</Text>
          </TouchableOpacity>
        </View>

        {maintenance.map((item) => {
          const progress = Math.min(
            Math.max((item.remainingDays / item.intervalDays) * 100, 0),
            100
          );

          const isSoon = item.remainingDays <= 30 && item.remainingDays >= 0;
          const isLate = item.remainingDays < 0;

          return (
            <View key={item.id} style={styles.maintenanceCard}>
              <View style={styles.maintenanceHeader}>
                <View
                  style={[
                    styles.daysBadge,
                    isLate
                      ? styles.daysBadgeLate
                      : isSoon
                      ? styles.daysBadgeWarning
                      : styles.daysBadgeNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.daysBadgeText,
                      isLate
                        ? styles.daysBadgeTextLate
                        : isSoon
                        ? styles.daysBadgeTextWarning
                        : styles.daysBadgeTextNormal,
                    ]}
                  >
                    {isLate
                      ? `متأخر ${Math.abs(item.remainingDays)} يوم`
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
                <Text style={styles.nextDateText}>{item.nextDate}</Text>
              </View>

              <View style={[styles.dateRow, { marginTop: 5 }]}>
                <Text style={styles.dateLabel}>آخر صيانة تمت:</Text>
                <Text style={styles.lastDateText}>{item.lastDate}</Text>
              </View>

              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${progress}%`,
                      backgroundColor: isLate
                        ? COLORS.danger
                        : isSoon
                        ? COLORS.warning
                        : COLORS.primary,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

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

              <Text style={styles.modalTitle}>تعديل بيانات الصيانة</Text>

              <View style={styles.modalHeaderSide} />
            </View>

            <View style={styles.modalDivider} />

            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {editData.map((item) => (
                <View key={item.id} style={styles.inputGroup}>
                  <View style={styles.inputGroupHeader}>
                    <View style={styles.inputIconCircle}>
                      <Feather name="tool" size={15} color={COLORS.primary} />
                    </View>

                    <View style={styles.inputTextBox}>
                      <Text style={styles.inputLabel}>{item.title}</Text>
                      <Text style={styles.inputHint}>
                        اختاري تاريخ آخر صيانة تمت
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setCurrentEditingId(item.id);
                      setDatePickerVisible(true);
                    }}
                  >
                    <View style={styles.dateInputBox}>
                      <Feather name="calendar" size={16} color={COLORS.primary} />

                      <TextInput
                        value={item.lastDate}
                        style={styles.input}
                        editable={false}
                        textAlign="center"
                      />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.editPreviewBox}>
                    <Text style={styles.editPreviewText}>
                      القادم: {item.nextDate}
                    </Text>
                    <Text style={styles.editPreviewText}>
                      المتبقي: {item.remainingDays} يوم
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveAll}
              activeOpacity={0.85}
            >
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
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

  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
    gap: 12,
  },

  reportSectionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.softGray,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  maintenanceIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
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

  maintenanceSectionTop: {
    marginTop: 6,
  },

  editActionBtn: {
    height: 40,
    backgroundColor: COLORS.softGray,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: "stretch",
  },

  editActionText: {
    color: COLORS.text,
    textAlign: "center",
    fontWeight: "900",
    fontSize: 13,
    fontFamily: "Tajawal-Bold",
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
    backgroundColor: COLORS.successBg,
  },

  daysBadgeWarning: {
    backgroundColor: COLORS.warningBg,
  },

  daysBadgeLate: {
    backgroundColor: COLORS.dangerBg,
  },

  daysBadgeText: {
    fontSize: 11,
    fontFamily: "Tajawal-Bold",
  },

  daysBadgeTextNormal: {
    color: COLORS.success,
  },

  daysBadgeTextWarning: {
    color: COLORS.warning,
  },

  daysBadgeTextLate: {
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

  inputGroup: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.soft,
  },

  inputGroupHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  inputIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  inputTextBox: {
    flex: 1,
    alignItems: "flex-end",
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
    color: COLORS.text,
    fontFamily: "Tajawal-Bold",
  },

  inputHint: {
    marginTop: 2,
    fontSize: 11.5,
    color: COLORS.muted,
    textAlign: "right",
    fontFamily: "Tajawal-Regular",
  },

  dateInputBox: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Tajawal-Regular",
  },

  editPreviewBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },

  editPreviewText: {
    fontSize: 11.5,
    color: COLORS.muted,
    fontFamily: "Tajawal-Regular",
    textAlign: "right",
  },

  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
    gap: 8,
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