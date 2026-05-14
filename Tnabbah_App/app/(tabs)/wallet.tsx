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
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";

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

  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState<MaintenanceItem[]>([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<number | null>(null);

  if (!fontsLoaded) return null;

  const openModal = () => {
    setEditData([...maintenance]);
    setModalVisible(true);
  };

  const updateField = (
    id: number,
    field: keyof MaintenanceItem,
    value: string
  ) => {
    const updated = editData.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );

    setEditData(updated);
  };

  const saveAll = () => {
    setMaintenance(editData);
    setModalVisible(false);
  };

  const handleConfirmDate = (date: Date) => {
    if (currentEditingId !== null) {
      const formatted = date.toISOString().split("T")[0];
      updateField(currentEditingId, "lastDate", formatted);
    }

    setDatePickerVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
          <Text style={styles.sectionTitle}>التقارير</Text>
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
          contentContainerStyle={[
            { paddingRight: 20, paddingLeft: 20 },
            styles.horizontalScroll,
          ]}
        >
          {reportsLoading && reports.length === 0 && (
            <View style={styles.emptyCard}>
              <ActivityIndicator color="#7a0f1f" />
            </View>
          )}

          {!reportsLoading && visibleReports.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {!userId ? "يجب تسجيل الدخول" : "لا توجد تقارير"}
              </Text>
            </View>
          )}

          {visibleReports.map((report) => {
            const isPending = report.status === "pending";
            const isDtc = report.type === "DTC";

            return (
              <View key={report.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isPending ? "#E0A800" : "#28A745" },
                    ]}
                  />

                  <View
                    style={[
                      styles.reportBadge,
                      isDtc && { backgroundColor: "#E9ECEF" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reportBadgeText,
                        isDtc && { color: "#495057" },
                      ]}
                    >
                      {report.type}
                    </Text>
                  </View>
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
                      style={[styles.detailsBtn, { flex: 1 }]}
                      onPress={() => handleSaveReport(report.id)}
                    >
                      <Text style={styles.detailsText}>حفظ التقرير</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleRejectReport(report.id)}
                    >
                      <Text style={styles.rejectBtnText}>تجاهل</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => openReport(report.id)}
                  >
                    <Text style={styles.detailsText}>فتح التقرير</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <TouchableOpacity onPress={openModal} style={styles.editActionBtn}>
            <Text style={styles.editActionText}>تعديل البيانات</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>الصيانات الدورية</Text>
        </View>

        {maintenance.map((item) => (
          <View key={item.id} style={styles.maintenanceCard}>
            <View style={styles.maintenanceHeader}>
              <View style={styles.daysBadge}>
                <Text style={styles.daysBadgeText}>
                  متبقي {item.remainingDays} يوم
                </Text>
              </View>

              <Text style={styles.maintenanceTitle}>{item.title}</Text>
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
                    width: `${Math.min(
                      (item.remainingDays / item.intervalDays) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text
                  style={{
                    color: "#7a0f1f",
                    fontFamily: "Tajawal-Bold",
                  }}
                >
                  إلغاء
                </Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>تعديل البيانات</Text>
            </View>

            <ScrollView style={styles.modalList}>
              {editData.map((item) => (
                <View key={item.id} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{item.title}</Text>

                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      setCurrentEditingId(item.id);
                      setDatePickerVisible(true);
                    }}
                  >
                    <TextInput
                      value={item.lastDate}
                      style={styles.input}
                      editable={false}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={saveAll}>
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
    backgroundColor: "#FFFFFF",
  },

  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row-reverse",
    backgroundColor: "#FFFFFF",
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
    color: "#1D1D1F",
    fontFamily: "Tajawal-Bold",
    textAlign: "center",
  },

  scrollContent: {
    paddingBottom: 30,
    backgroundColor: "#F8F9FA",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    textAlign: "right",
    fontFamily: "Tajawal-Bold",
  },

  horizontalScroll: {
    paddingRight: 20,
    flexDirection: "row",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 15,
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  filterRow: {
    flexDirection: "row-reverse",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginLeft: 8,
  },

  filterChipActive: {
    backgroundColor: "#7a0f1f",
    borderColor: "#7a0f1f",
  },

  filterChipText: {
    fontSize: 12,
    color: "#495057",
    fontFamily: "Tajawal-Bold",
  },

  filterChipTextActive: {
    color: "#fff",
  },

  emptyCard: {
    width: 200,
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  emptyText: {
    color: "#ADB5BD",
    fontFamily: "Tajawal-Bold",
    fontSize: 13,
  },

  cardTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  statusPill: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
  },

  statusPillPending: {
    backgroundColor: "#FFF8E1",
  },

  statusPillSaved: {
    backgroundColor: "#E8F5E9",
  },

  statusPillText: {
    fontSize: 10,
    fontFamily: "Tajawal-Bold",
  },

  statusPillTextPending: {
    color: "#B8860B",
  },

  statusPillTextSaved: {
    color: "#1E7E34",
  },

  actionsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },

  rejectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginRight: 8,
  },

  rejectBtnText: {
    color: "#7a0f1f",
    fontSize: 12,
    fontFamily: "Tajawal-Bold",
  },

  reportBadge: {
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-end",
    marginBottom: 10,
  },

  reportBadgeText: {
    color: "#7a0f1f",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "Tajawal-Bold",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
    fontFamily: "Tajawal-Bold",
  },

  cardDate: {
    fontSize: 12,
    color: "#ADB5BD",
    marginTop: 4,
    textAlign: "right",
    fontFamily: "Tajawal-Regular",
  },

  detailsBtn: {
    marginTop: 15,
    margin: 10,
    backgroundColor: "#7a0f1f",
    paddingVertical: 8,
    borderRadius: 8,
  },

  detailsText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 12,
    fontFamily: "Tajawal-Bold",
  },

  editActionBtn: {
    backgroundColor: "#7a0f1f",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  editActionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 12,
    fontFamily: "Tajawal-Bold",
  },

  maintenanceCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRightWidth: 5,
    borderRightColor: "#7a0f1f",
    elevation: 1,
  },

  maintenanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  maintenanceTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
    fontFamily: "Tajawal-Bold",
  },

  daysBadge: {
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  daysBadgeText: {
    fontSize: 11,
    color: "#7a0f1f",
    fontWeight: "bold",
    fontFamily: "Tajawal-Bold",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F3F5",
    marginVertical: 12,
  },

  dateRow: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    alignItems: "center",
  },

  dateLabel: {
    fontSize: 13,
    color: "#6C757D",
    marginLeft: 8,
    fontFamily: "Tajawal-Regular",
  },

  nextDateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    fontFamily: "Tajawal-Bold",
  },

  lastDateText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#495057",
    fontFamily: "Tajawal-Regular",
  },

  progressContainer: {
    height: 8,
    backgroundColor: "#F1F3F5",
    borderRadius: 4,
    marginTop: 15,
    overflow: "hidden",
    flexDirection: "row-reverse",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#7a0f1f",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Tajawal-Bold",
  },

  modalList: {
    marginBottom: 20,
  },

  inputGroup: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "right",
    color: "#7a0f1f",
    fontFamily: "Tajawal-Bold",
  },

  dualInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  subLabel: {
    fontSize: 11,
    color: "#777",
    textAlign: "right",
    marginBottom: 4,
    fontFamily: "Tajawal-Regular",
  },

  input: {
    borderWidth: 1,
    borderColor: "#E9ECEF",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
  },

  saveBtn: {
    backgroundColor: "#7a0f1f",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignSelf: "center",
    marginBottom: 10,
  },

  saveBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
  },
});