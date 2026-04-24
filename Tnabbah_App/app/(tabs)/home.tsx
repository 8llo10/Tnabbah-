import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../providers/AuthProvider';
import { useEffect, useState } from "react";


export const unstable_settings = {
    headerShown: false,
};


export default function HomeScreen() {
    const { profile } = useAuth();

    const [carData, setCarData] = useState({});

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch("http://172.20.10.7:3000/car");
                const data = await res.json();
                setCarData(data);
            } catch (e) {
                console.log("Proxy offline");
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    return (
        /*  <ImageBackground
             source={require('../assets/images/appBackground.png')} // ← الخلفية العامة
             style={styles.pageBackground}
         > */

        <View style={styles.pageBackground}>

            {/* البطاقة */}
            <View style={styles.cardWrapper}>
                <ImageBackground
                    source={require('../../assets/images/carCard.png')}

                    style={styles.bgImage}
                    imageStyle={styles.bgImageStyle}
                >


                    <View style={styles.topRightStatus}>
                        <Text style={styles.topRightText}>سيارتك بيرفكت يا الطيب</Text>
                    </View>

                    {/* زر صغير تحت البطاقة */}
                    <TouchableOpacity style={styles.smallButton}>
                        <Text style={styles.smallButtonText}>عرض التفاصيل</Text>
                    </TouchableOpacity>

                    {/* دمج الصورة مع الخلفية */}
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.95)']}
                        style={styles.fadeBottom}
                    />

                    {/* بيانات المستخدم - يسار تحت */}
                    <View style={styles.leftInfo}>
                        <Text style={styles.username}>
                            {profile?.full_name || "—"}
                        </Text>

                        <Text style={styles.carName}>
                            Porsche 911 Turbo
                        </Text>

                    </View>

                    {/* بيانات البطارية - يمين تحت */}
                    <View style={styles.rightInfo}>
                        <Text style={styles.battery}>🔋 30.6V</Text>
                        <Text style={styles.fuel}>⛽ 90</Text>
                    </View>



                </ImageBackground>
            </View>



            {/* أقسام البيانات */}
            <View style={styles.dataContainer}>

                {/* لايف داتا */}
                <View style={styles.dataBox}>
                    <Text style={styles.dataTitle}>Live Data</Text>
                    <Text style={styles.dataPlaceholder}>— لا توجد بيانات بعد —</Text>
                </View>

                {/* DTCs */}
                <View style={styles.dataBox}>
                    <Text style={styles.dataTitle}>DTCs (الأعطال)</Text>
                    <Text style={styles.dataPlaceholder}>— لا توجد أعطال —</Text>
                </View>

                {/* معلومات السيارة */}
                <View style={styles.dataBox}>
                    <Text style={styles.dataTitle}>Vehicle Info</Text>
                    <Text style={styles.dataPlaceholder}>— سيتم عرض المعلومات هنا —</Text>
                </View>

            </View>


        </View>


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
