import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

export default function Wallet() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>المحفظة</Text>

            <ScrollView style={{ flex: 1 }}>

                {/* قسم التقارير المحفوظة */}
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

                {/* قسم الصيانات الدورية */}
                <Text style={styles.sectionTitle}>الصيانات الدورية</Text>

                <View style={styles.maintenanceCard}>
                    <Text style={styles.maintenanceTitle}>تغيير زيت المحرك</Text>
                    <Text style={styles.maintenanceInfo}>آخر تغيير: 10 يناير 2026</Text>
                    <Text style={styles.maintenanceInfo}>المتبقي: 2500 كم</Text>
                </View>

                <View style={styles.maintenanceCard}>
                    <Text style={styles.maintenanceTitle}>تغيير الكفرات</Text>
                    <Text style={styles.maintenanceInfo}>آخر تغيير: 20 نوفمبر 2025</Text>
                    <Text style={styles.maintenanceInfo}>المتبقي: 8000 كم</Text>
                </View>

                <View style={styles.maintenanceCard}>
                    <Text style={styles.maintenanceTitle}>تغيير فلتر الهواء</Text>
                    <Text style={styles.maintenanceInfo}>آخر تغيير: 1 ديسمبر 2025</Text>
                    <Text style={styles.maintenanceInfo}>المتبقي: 5000 كم</Text>
                </View>

            </ScrollView>
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
        width: 120,
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
});
