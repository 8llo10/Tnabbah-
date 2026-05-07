import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from "react-native";
import { useState } from "react";

export default function Wallet() {

    const [maintenance, setMaintenance] = useState([
        {
            id: 1,
            title: "زيت المحرك",
            lastDate: "2026-01-10",
            intervalKm: 5000,
            remainingKm: 2500,
        },
        {
            id: 2,
            title: "الكفرات",
            lastDate: "2025-11-20",
            intervalKm: 40000,
            remainingKm: 8000,
        },
         {
            id: 3,
            title: "الفرامل",
            lastDate: "2025-12-01",
            intervalKm: 10000,
            remainingKm: 5000,
        },
        {
            id: 4,
            title: "فلتر الهواء",
            lastDate: "2025-12-01",
            intervalKm: 10000,
            remainingKm: 5000,
        },
        {
          id: 5,
            title: "البطارية",
            lastDate: "2025-12-01",
            intervalKm: 10000,
            remainingKm: 5000,
        },
    ]);

    const [modalVisible, setModalVisible] = useState(false);
    const [editData, setEditData] = useState(maintenance);

    const openModal = () => {
        setEditData(maintenance);
        setModalVisible(true);
    };

    const updateDate = (id:number, value:string) => {
        const updated = editData.map((item) => {
            if (item.id === id) {
                return { ...item, lastDate: value };
            }
            return item;
        });

        setEditData(updated);
    };

    const saveAll = () => {
        setMaintenance(editData);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>المحفظة</Text>

            <ScrollView style={{ flex: 1 }}>

                {/* التقارير */}
                <Text style={styles.sectionTitle}>التقارير المحفوظة</Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>تقرير فحص شامل</Text>
                    <Text style={styles.cardDate}>12 مارس 2026</Text>
                    <TouchableOpacity style={styles.detailsBtn}>
                        <Text style={styles.detailsText}>عرض التفاصيل</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>تقرير أعطال DTC</Text>
                    <Text style={styles.cardDate}>5 فبراير 2026</Text>
                    <TouchableOpacity style={styles.detailsBtn}>
                        <Text style={styles.detailsText}>عرض التفاصيل</Text>
                    </TouchableOpacity>
                </View>

                {/* الصيانات */}
                <Text style={styles.sectionTitle}>الصيانات الدورية</Text>

                {/* زر واحد فقط */}
                <TouchableOpacity style={styles.detailsBtn} onPress={openModal}>
                    <Text style={styles.detailsText}>تعديل </Text>
                </TouchableOpacity>

                {maintenance.map((item) => (
                    <View key={item.id} style={styles.maintenanceCard}>
                        <Text style={styles.maintenanceTitle}>{item.title}</Text>
                        <Text style={styles.maintenanceInfo}>آخر تغيير: {item.lastDate}</Text>
                        <Text style={styles.maintenanceInfo}>المتبقي: {item.remainingKm} كم</Text>
                    </View>
                ))}

            </ScrollView>

            {/* Modal تعديل الصيانات */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>

                        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
                            تعديل الصيانات
                        </Text>

                        <ScrollView>
                            {editData.map((item) => (
                                <View key={item.id} style={{ marginBottom: 15 }}>
                                    <Text style={{ fontWeight: "700", marginBottom: 5 }}>
                                        {item.title}
                                    </Text>

                                    <TextInput
                                        value={item.lastDate}
                                        onChangeText={(text) => updateDate(item.id, text)}
                                        placeholder="2026-01-10"
                                        style={styles.input}
                                    />
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={styles.detailsBtn} onPress={saveAll}>
                            <Text style={styles.detailsText}>حفظ الكل</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={{ marginTop: 10, color: "#777" }}>إلغاء</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 25,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginTop: 20,
        marginBottom: 10,
    },
    card: {
        backgroundColor: "#f5f5f5",
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    cardDate: {
        fontSize: 14,
        color: "#777",
        marginTop: 5,
    },
    detailsBtn: {
        marginTop: 10,
        backgroundColor: "#7a0f1f",
        paddingVertical: 8,
        borderRadius: 8,
        width: 140,
    },
    detailsText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "700",
    },
    maintenanceCard: {
        backgroundColor: "#fafafa",
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderLeftWidth: 5,
        borderLeftColor: "#7a0f1f",
    },
    maintenanceTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    maintenanceInfo: {
        fontSize: 14,
        color: "#555",
        marginTop: 5,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBox: {
        width: "85%",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        maxHeight: "80%",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 10,
        borderRadius: 8,
    },
});