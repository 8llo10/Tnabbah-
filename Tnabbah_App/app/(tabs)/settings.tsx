import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function Settings() {
    const { profile } = useAuth();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);



    const handleLogout = () => {
        Alert.alert(
            "تسجيل الخروج",
            "هل أنت متأكد أنك تريد تسجيل الخروج؟",
            [
                { text: "إلغاء", style: "cancel" },
                {
                    text: "تسجيل خروج",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoggingOut(true); // ← يبدأ التحميل

                            const { error } = await supabase.auth.signOut();

                            if (error) {
                                Alert.alert("خطأ", "ما قدر يسجل خروج");
                                return;
                            }

                            router.replace("/start");
                        } finally {
                            setLoggingOut(false); // ← يوقف التحميل
                        }
                    },
                },
            ]
        );
    };


    return (
        <View style={styles.container}>
            <Text style={styles.title}>الإعدادات</Text>

            <View style={styles.card}>
                <Text style={styles.label}>الاسم</Text>
                <Text style={styles.value}>{profile?.full_name || "—"}</Text>

                <Text style={styles.label}>البريد</Text>
                <Text style={styles.value}>{profile?.email || "—"}</Text>
            </View>

            <TouchableOpacity
                style={[styles.logoutButton, loggingOut && { opacity: 0.5 }]}
                onPress={handleLogout}
                disabled={loggingOut}
            >
                <Text style={styles.logoutText}>
                    {loggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
                </Text>
            </TouchableOpacity>

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
        marginBottom: 30,
    },
    card: {
        padding: 20,
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        marginBottom: 40,
    },
    label: {
        fontSize: 16,
        color: "#777",
        marginTop: 10,
    },
    value: {
        fontSize: 20,
        fontWeight: "600",
        marginTop: 5,
    },
    logoutButton: {
        backgroundColor: "#b00020",
        padding: 15,
        borderRadius: 10,
    },
    logoutText: {
        color: "#fff",
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
    },
});
