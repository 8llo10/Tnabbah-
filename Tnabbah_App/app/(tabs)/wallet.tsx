import React, { useState } from "react";
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
  Platform,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useFonts } from "expo-font";

interface MaintenanceItem {
  id: number;
  title: string;
  lastDate: string;
  nextDate: string;
  intervalDays: number;
  remainingDays: number;
}

export default function Wallet() {
  const [fontsLoaded] = useFonts({
    "Tajawal-Regular": require("../../assets/fonts/Tajawal-Regular.ttf"),
    "Tajawal-Bold": require("../../assets/fonts/Tajawal-Bold.ttf"),
  });

  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([
    { id: 1, title: "زيت المحرك", lastDate: "2026-01-10", nextDate: "2026-04-10", intervalDays: 90, remainingDays: 45 },
    { id: 2, title: "الكفرات", lastDate: "2025-11-20", nextDate: "2026-11-20", intervalDays: 365, remainingDays: 120 },
    { id: 3, title: "الفرامل", lastDate: "2025-12-01", nextDate: "2026-06-01", intervalDays: 180, remainingDays: 60 },
    { id: 4, title: "فلتر الهواء", lastDate: "2025-12-01", nextDate: "2026-03-01", intervalDays: 90, remainingDays: 15 },
    { id: 5, title: "البطارية", lastDate: "2025-12-01", nextDate: "2027-12-01", intervalDays: 730, remainingDays: 500 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState<MaintenanceItem[]>([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<number | null>(null);

  if (!fontsLoaded) return null;

  const openModal = () => {
    setEditData([...maintenance]);
    setModalVisible(true);
  };

  const updateField = (id: number, field: keyof MaintenanceItem, value: string) => {
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
      const formatted = date.toISOString().split("T")[0]; // YYYY-MM-DD
      updateField(currentEditingId, "lastDate", formatted);
    }
    setDatePickerVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileIcon}>
          <View style={styles.avatarPlaceholder} />
        </TouchableOpacity>
        <Text style={styles.title}>المحفظة</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* التقارير المحفوظة */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>التقارير المحفوظة</Text>
        </View>

        <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={[
            {
            paddingRight: 20,
            paddingLeft: 420,          
            },
            styles.horizontalScroll
          ]}
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

          <View style={styles.card}>
            <View style={[styles.reportBadge, { backgroundColor: "#E9ECEF" }]}>
              <Text style={[styles.reportBadgeText, { color: "#495057" }]}>DTC</Text>
            </View>
            <Text style={styles.cardTitle}>تقرير أعطال DTC</Text>
            <Text style={styles.cardDate}>5 فبراير 2026</Text>
            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsText}>فتح التقرير</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* الصيانات الدورية */}
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
                <Text style={styles.daysBadgeText}>متبقي {item.remainingDays} يوم</Text>
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
              <View style={[styles.progressBar, { width: `${Math.min((item.remainingDays/item.intervalDays)*100,100)}%` }]} />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal تعديل البيانات */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: "#7a0f1f", fontFamily: "Tajawal-Bold" }}>إلغاء</Text>
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
                      editable={false} // منع الكتابة اليدوية
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
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { paddingHorizontal: 20, paddingVertical: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", color: "#1A1A1A", fontFamily: "Tajawal-Bold" },
  profileIcon: { padding: 5 },
  avatarPlaceholder: { width: 35, height: 35, borderRadius: 18, backgroundColor: "#E9ECEF", borderWidth: 1, borderColor: "#DDD" },
  scrollContent: { paddingBottom: 30 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginVertical: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#333", textAlign: "right", fontFamily: "Tajawal-Bold" },
  horizontalScroll: { paddingRight: 20, flexDirection: "row" },
  
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
     elevation: 2 },

  reportBadge: { backgroundColor: "#FFF0F0", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-end", marginBottom: 10 },
  reportBadgeText: { color: "#7a0f1f", fontSize: 10, fontWeight: "800", fontFamily: "Tajawal-Bold" },
  cardTitle: { fontSize: 15, fontWeight: "700", textAlign: "right", fontFamily: "Tajawal-Bold" },
  cardDate: { fontSize: 12, color: "#ADB5BD", marginTop: 4, textAlign: "right", fontFamily: "Tajawal-Regular" },
  detailsBtn: { marginTop: 15, margin: 10, backgroundColor: "#7a0f1f", paddingVertical: 8, borderRadius: 8 },
  detailsText: { color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 12, fontFamily: "Tajawal-Bold" },
  editActionBtn: { backgroundColor: "#7a0f1f", paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  editActionText: { color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 12, fontFamily: "Tajawal-Bold" },
  maintenanceCard: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginHorizontal: 20, marginBottom: 12, borderRightWidth: 5, borderRightColor: "#7a0f1f", elevation: 1 },
  maintenanceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  maintenanceTitle: { fontSize: 16, fontWeight: "700", textAlign: "right", fontFamily: "Tajawal-Bold" },
  daysBadge: { backgroundColor: "#FFF0F0", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  daysBadgeText: { fontSize: 11, color: "#7a0f1f", fontWeight: "bold", fontFamily: "Tajawal-Bold" },
  divider: { height: 1, backgroundColor: "#F1F3F5", marginVertical: 12 },
  dateRow: { flexDirection: "row-reverse", justifyContent: "flex-start", alignItems: "center" },
  dateLabel: { fontSize: 13, color: "#6C757D", marginLeft: 8, fontFamily: "Tajawal-Regular" },
  nextDateText: { fontSize: 14, fontWeight: "700", color: "#1A1A1A", fontFamily: "Tajawal-Bold" },
  lastDateText: { fontSize: 13, fontWeight: "500", color: "#495057", fontFamily: "Tajawal-Regular" },
  progressContainer: { height: 8, backgroundColor: "#F1F3F5", borderRadius: 4, marginTop: 15, overflow: "hidden", flexDirection: "row-reverse" },
  progressBar: { height: "100%", backgroundColor: "#7a0f1f" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: "800", fontFamily: "Tajawal-Bold" },
  modalList: { marginBottom: 20 },
  inputGroup: { marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: "#F1F3F5" },
  inputLabel: { fontSize: 15, fontWeight: "700", marginBottom: 10, textAlign: "right", color: "#7a0f1f", fontFamily: "Tajawal-Bold" },
  dualInputRow: { flexDirection: "row", justifyContent: "space-between" },
  subLabel: { fontSize: 11, color: "#777", textAlign: "right", marginBottom: 4, fontFamily: "Tajawal-Regular" },
  input: { borderWidth: 1, borderColor: "#E9ECEF", padding: 10, borderRadius: 8, backgroundColor: "#F8F9FA", textAlign: "center", fontSize: 14, fontFamily: "Tajawal-Regular" },
  saveBtn: { backgroundColor: "#7a0f1f", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 15, alignSelf: "center", marginBottom: 10 },
  saveBtnText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16, fontFamily: "Tajawal-Bold" },
});