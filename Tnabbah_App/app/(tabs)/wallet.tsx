import { Feather } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import { useWallet } from "../../providers/WalletProvider";
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
  const [reportFilter, setReportFilter] = useState<"all" | "saved" | "pending">("all");

  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState<MaintenanceItem[]>([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<number | null>(null);

  const handleSaveReport = async (id: string) => {
    if (!userId) return;
    const prev = reports;

    setReports((rs: any[]) =>
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

  const openModal = () => {
    setEditData([...maintenance]);
    setModalVisible(true);
  };

  const handleConfirmDate = (date: Date) => {
    setDatePickerVisible(false);
    if (currentEditingId === null) return;

    const formatted = date.toISOString().split("T")[0];

    setEditData((prev) =>
      prev.map((item) =>
        item.maintenanceTypeId === currentEditingId
          ? { ...item, lastDate: formatted }
          : item
      )
    );
  };


  const saveAll = async () => {
    if (!userId) {
      Alert.alert("خطأ", "لا يوجد مستخدم مسجل");
      return;
    }

    const changed = editData.filter((item) => {
      const original = maintenance.find(
        (m: MaintenanceItem) => m.maintenanceTypeId === item.maintenanceTypeId
      );

      return item.lastDate && item.lastDate !== original?.lastDate;
    });

    if (changed.length === 0) {
      Alert.alert("تنبيه", "ما فيه تغييرات للحفظ");
      return;
    }

    setSavingId(-1);



    try {
      for (const item of changed) {
        const next = new Date(item.lastDate);
        next.setDate(next.getDate() + item.intervalDays);


        const nextDate = next.toISOString().split("T")[0];

        const { error } = await supabase
          .from("maintenance_reminders")
          .upsert(
            {
              user_id: userId,
              maintenance_type_id: item.maintenanceTypeId,
              last_date: item.lastDate,
              next_date: nextDate,
              notification_stage: 0,
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,maintenance_type_id",
            }
          );

        if (error) {
          console.log("UPSERT ERROR:", error);
          throw error;
        }
      }

      await fetchMaintenance();
      setModalVisible(false);
      Alert.alert("تم", "تم حفظ الصيانة وتفعيل التذكير");
    } catch (err: any) {
      console.error("Save maintenance failed:", err);
      Alert.alert("خطأ", err?.message || "تعذر حفظ التعديلات");
    } finally {
      setSavingId(null);
    }
  };

  const visibleReports = reports.filter((r: any) => {
    if (reportFilter === "all") return true;
    return r.status === reportFilter;
  });

  const getFilterCount = (key: "all" | "saved" | "pending") => {
    if (key === "all") {
      return reports.filter(
        (r: any) => r.status === "saved" || r.status === "pending"
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
          maintenance.map((item: MaintenanceItem) => {
            const hasData = !!item.lastDate;
            const progress = hasData
              ? Math.min(
                ((item.intervalDays - (item.remainingDays ?? 0)) /
                  item.intervalDays) *
                100,
                100
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
                  <Text style={styles.nextDateText}>{item.nextDate || "—"}</Text>
                </View>

                <View style={[styles.dateRow, { marginTop: 5 }]}>
                  <Text style={styles.dateLabel}>آخر صيانة تمت:</Text>
                  <Text style={styles.lastDateText}>{item.lastDate || "—"}</Text>
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

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
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
