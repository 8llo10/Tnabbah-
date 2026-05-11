import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useFonts } from "expo-font";
import { supabase } from "../../lib/supabase";

// القائمة الثابتة الأساسية
const MAINTENANCE_LIST = [
  { id: "oil", title: "زيت المحرك", interval_days: 90 },
  { id: "tires", title: "الكفرات", interval_days: 365 },
  { id: "brakes", title: "الفرامل", interval_days: 500 },
  { id: "battery", title: "البطارية", interval_days: 730 },
  { id: "filter", title: "فلتر الهواء", interval_days: 180 },
];

interface MaintenanceItem {
  reminder_id: string;
  user_id?: string;
  title: string;
  last_date: string | null;
  next_date: string | null;
  interval_days: number;
}

export default function Wallet() {
  const [userId, setUserId] = useState<string | null>(null);
  const [mergedMaintenance, setMergedMaintenance] = useState<MaintenanceItem[]>(
    MAINTENANCE_LIST.map((item) => ({
      ...item,
      reminder_id: item.id,
      last_date: null,
      next_date: null,
    })),
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState<MaintenanceItem[]>([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    "Tajawal-Regular": require("../../assets/fonts/Tajawal-Regular.ttf"),
    "Tajawal-Bold": require("../../assets/fonts/Tajawal-Bold.ttf"),
  });

  // 1. الحصول على ID المستخدم
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    getUser();
  }, []);

  // 2. جلب البيانات عند توفر الـ ID
  useEffect(() => {
    if (userId) {
      fetchMaintenance();
    }
  }, [userId]);

  const fetchMaintenance = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("maintenance_reminders")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    // دمج القائمة الثابتة مع البيانات القادمة من السبيس
    const merged = MAINTENANCE_LIST.map((staticItem) => {
      const dbItem = data?.find((d) => d.title === staticItem.title);
      return {
        ...staticItem,
        reminder_id: dbItem?.reminder_id ?? staticItem.id,
        user_id: userId,
        last_date: dbItem?.last_date ?? null,
        next_date: dbItem?.next_date ?? null,
      };
    });

    setMergedMaintenance(merged);
  };

  const openModal = () => {
    setEditData([...mergedMaintenance]);
    setModalVisible(true);
  };

  const updateField = (reminder_id: string, value: string) => {
    const updated = editData.map((item) =>
      item.reminder_id === reminder_id ? { ...item, last_date: value } : item,
    );
    setEditData(updated);
  };

  const saveAll = async () => {
    try {
      // نرسل فقط العناصر التي تم تعديل تاريخها
      const updates = editData.filter((item) => item.last_date !== null);

      await Promise.all(
        updates.map((item) =>
          fetch(
            "https://qzhnghwmgujgthbkivdi.supabase.co/functions/v1/create-reminder",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: userId,
                title: item.title,
                last_date: item.last_date,
              }),
            },
          ),
        ),
      );

      await fetchMaintenance();
      setModalVisible(false);
    } catch (error) {
      console.log("Save error:", error);
    }
  };

  const handleConfirmDate = (date: Date) => {
    if (currentEditingId !== null) {
      const formatted = date.toISOString().split("T")[0];
      updateField(currentEditingId, formatted);
    }
    setDatePickerVisible(false);
  };

  const calculateRemainingDays = (nextDate: string | null) => {
    if (!nextDate) return 0;
    const today = new Date();
    const next = new Date(nextDate);
    const diffTime = next.getTime() - today.getTime();
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.profileIcon}>
          <View style={styles.avatarPlaceholder} />
        </TouchableOpacity>
        <Text style={styles.title}>المحفظة</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* التقارير المحفوظة */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>التقارير المحفوظة</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          <View style={styles.card}>
            <View style={styles.reportBadge}>
              <Text style={styles.reportBadgeText}>PDF</Text>
            </View>
            <Text style={styles.cardTitle}>تقرير فحص شامل</Text>
            <Text style={styles.cardDate}>12 مارس 2026</Text>
            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsText}>فتح التقرير</Text>
            </TouchableOpacity>
          </View>
          {/* ...  إضافة الكروت الأخرى هنا */}
        </ScrollView>

        {/* الصيانات الدورية */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity onPress={openModal} style={styles.editActionBtn}>
            <Text style={styles.editActionText}>تعديل البيانات</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>الصيانات الدورية</Text>
        </View>

        {mergedMaintenance.map((item) => (
          <View key={item.reminder_id} style={styles.maintenanceCard}>
            <View style={styles.maintenanceHeader}>
              <View style={styles.daysBadge}>
                <Text style={styles.daysBadgeText}>
                  متبقي {calculateRemainingDays(item.next_date)} يوم
                </Text>
              </View>
              <Text style={styles.maintenanceTitle}>{item.title}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>موعد الصيانة القادم:</Text>
              <Text style={styles.nextDateText}>
                {item.next_date ?? "غير محدد"}
              </Text>
            </View>
            <View style={[styles.dateRow, { marginTop: 5 }]}>
              <Text style={styles.dateLabel}>آخر صيانة تمت:</Text>
              <Text style={styles.lastDateText}>
                {item.last_date ?? "غير محدد"}
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${item.next_date ? Math.min((calculateRemainingDays(item.next_date) / item.interval_days) * 100, 100) : 0}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/*  تعديل البيانات */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: "#7a0f1f", fontFamily: "Tajawal-Bold" }}>
                  إلغاء
                </Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تعديل البيانات</Text>
            </View>

            <ScrollView style={styles.modalList}>
              {editData.map((item) => (
                <View key={item.reminder_id} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{item.title}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCurrentEditingId(item.reminder_id);
                      setDatePickerVisible(true);
                    }}
                  >
                    <TextInput
                      value={item.last_date || "اختر التاريخ"}
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
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    fontFamily: "Tajawal-Bold",
  },
  profileIcon: { padding: 5 },
  avatarPlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#E9ECEF",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  scrollContent: { paddingBottom: 30 },
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
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginRight: 15,
    marginBottom: 20,
    width: 200,
    elevation: 2,
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
    backgroundColor: "#7a0f1f",
    paddingVertical: 8,
    borderRadius: 8,
    width: 100,
    alignSelf: "center",
  },
  detailsText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Tajawal-Bold",
  },
  editActionBtn: {
    backgroundColor: "#7a0f1f",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  editActionText: { color: "#fff", fontSize: 11, fontFamily: "Tajawal-Bold" },
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
  daysBadgeText: { fontSize: 11, color: "#7a0f1f", fontWeight: "bold" },
  divider: { height: 1, backgroundColor: "#F1F3F5", marginVertical: 12 },
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
  progressBar: { height: "100%", backgroundColor: "#7a0f1f" },
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
  modalTitle: { fontSize: 18, fontWeight: "800", fontFamily: "Tajawal-Bold" },
  modalList: { marginBottom: 20 },
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
  input: {
    borderWidth: 1,
    borderColor: "#E9ECEF",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    textAlign: "center",
    fontSize: 14,
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
    fontWeight: "700",
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
  },
});
