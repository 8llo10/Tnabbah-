import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../providers/AuthProvider';
import { useEffect, useState } from "react";


export const unstable_settings = {
    headerShown: false,
};


export default function HomeScreen() {
    const { profile } = useAuth();

    const [carData, setCarData] = useState<any>({});


    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch("http://127.0.0.1:3000/car");
                const data = await res.json();
                setCarData(data);
            } catch (e) {
                console.log("Proxy offline");
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    return (
        < View style={styles.dataContainer} >

            {/* 1. الحالة العامة */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>الحالة العامة</Text>
                <Text style={styles.dataPlaceholder}>
                    {carData.status?.state || "—"}
                </Text>
            </View >

            {/* 2. التنبيهات */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>التنبيهات (Abnormal Events)</Text>
                <Text style={styles.dataPlaceholder}>
                    {carData.events?.[0] || "لا توجد تنبيهات"}
                </Text>
            </View >

            {/* 3. الأعطال */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>أكواد الأعطال (DTCs)</Text>
                <Text style={styles.dataPlaceholder}>
                    {carData.dtcs?.codes?.[0] || "لا توجد أعطال"}
                </Text>
            </View >

            {/* 4. المحرك والأداء */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>المحرك والأداء</Text>
                <Text style={styles.dataPlaceholder}>
                    {carData.live?.rpm ? `RPM: ${carData.live.rpm}` : "—"}
                </Text>
            </View >

            {/* 5. الحرارة والتبريد */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>الحرارة والتبريد</Text>
                <Text style={styles.dataPlaceholder}>
                    {carData.live?.coolant_temp || "—"}
                </Text>
            </View >

            {/* 6. الكهرباء والطاقة */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>الكهرباء والطاقة</Text>
                <Text style={styles.dataPlaceholder}>
                    {carData.live?.voltage || "—"}
                </Text>
            </View >

            {/* 7. الوقود والكفاءة */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>الوقود والكفاءة</Text>
                <Text style={styles.dataPlaceholder}>
                    {carData.live?.fuel_level || "—"}
                </Text>
            </View >

            {/* 8. سلوك القيادة */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>سلوك القيادة</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 9. نظام الهواء */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>نظام الهواء (Air Intake)</Text>
                <Text style={styles.dataPlaceholder}>
                    {carData.live?.intake_temp || "—"}
                </Text>
            </View >

            {/* 10. نظام العادم */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>نظام العادم والانبعاثات</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 11. ناقل الحركة */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>ناقل الحركة (Transmission)</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 12. نظام الفرامل */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>نظام الفرامل</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 13. نظام التوجيه */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>نظام التوجيه</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 14. نظام التعليق */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>نظام التعليق والثبات</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 15. حالة الحساسات */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>حالة الحساسات (Sensors Health)</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 16. استجابة السيارة */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>استجابة السيارة</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 17. استقرار الأنظمة */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>استقرار الأنظمة</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 18. ظروف التشغيل */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>ظروف التشغيل (Driving Context)</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 19. سجل الأحداث */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>سجل الأحداث (Events History)</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 20. التوقعات */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>التوقعات (Predictions)</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 21. النصائح */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>النصائح والتوصيات</Text>
                <Text style={styles.dataPlaceholder}>—</Text>
            </View >

            {/* 22. معلومات السيارة */}
            < View style={styles.dataBox} >
                <Text style={styles.dataTitle}>معلومات السيارة (Vehicle Info)</Text>
                <Text style={styles.dataPlaceholder}>
                    {carData.info?.model || "—"}
                </Text>
            </View >

        </View >

        /*  </ImageBackground> */
    );
}

const styles = StyleSheet.create({
    /* pageBackground: {
        flex: 1,
        width: "100%",
        height: "100%",
    }, */
    pageBackground: {
        flex: 1,
        backgroundColor: "#FFFFFFFB", // ← هنا لون الخلفية
        alignItems: "center",
    },


    cardWrapper: {
        width: "100%",
        height: 300,
        borderRadius: 0,
        overflow: "hidden",
        marginTop: 0,
        alignSelf: "center",
    },

    bgImage: {
        flex: 1,
        justifyContent: "flex-end",
    },

    bgImageStyle: {
        resizeMode: "cover",
    },

    fadeBottom: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        height: 140,
    },

    leftInfo: {
        position: "absolute",
        bottom: 25,
        left: 20,
    },

    username: {
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
        marginBottom: 4,
    },

    carName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },

    status: {
        fontSize: 16,
        color: "#8B1A1A",
        fontWeight: "600",
    },

    rightInfo: {
        position: "absolute",
        bottom: 25,
        right: 20,
        alignItems: "flex-end",
    },

    battery: {
        fontSize: 18,
        fontWeight: "700",
        color: "#000",
    },

    fuel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginTop: 4,
    },

    smallButton: {
        position: "absolute",
        top: 40,        // ← تحت الجملة
        right: 20,      // ← يمين
        backgroundColor: "#732626DC",
        paddingVertical: 6,   // ← صغّر
        paddingHorizontal: 5, // ← صغّر
        borderRadius: 20,
    },


    smallButtonText: {
        color: "#fff",
        fontSize: 11.5,   // ← صغّر
        fontWeight: "700",
    },


    dataContainer: {
        marginTop: 25,
        width: "92%",
        alignSelf: "center",
    },

    dataBox: {
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },

    dataTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },

    dataPlaceholder: {
        fontSize: 15,
        color: "#666",
    },

    topRightStatus: {
        position: "absolute",
        top: 10,
        right: 20,
    },

    topRightText: {
        fontSize: 18,
        fontWeight: "700",
        color: "rgb(105, 105, 105)",
        textShadowColor: "rgb(219, 219, 219)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },

});
