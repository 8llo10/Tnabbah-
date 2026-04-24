import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';
import { useEffect, useState } from 'react';

export default function StartScreen() {
    const router = useRouter();
    const { session, loading } = useAuth();

    // ---------------------------------------------------------
    // state للتحكم بظهور الأنميشن
    // true = الأنميشن ظاهر
    // false = الأنميشن انتهى
    // ---------------------------------------------------------
    const [showAnimation, setShowAnimation] = useState(true);

    // ---------------------------------------------------------
    // الأنميشن يشتغل أول 1.2 ثانية على الجميع
    // سواء كان المستخدم مسجل دخول أو جديد
    // ---------------------------------------------------------
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAnimation(false); // نخفي الأنميشن بعد 1.2 ثانية
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    // ---------------------------------------------------------
    // بعد انتهاء الأنميشن:
    // لو المستخدم مسجل دخول → نحوله مباشرة للـ Home
    // ---------------------------------------------------------
    useEffect(() => {
        if (!loading && session && !showAnimation) {
            router.replace('/home');
        }
    }, [loading, session, showAnimation]);

    // ---------------------------------------------------------
    // 1) أثناء الأنميشن (للحالتين: مستخدم جديد أو مسجل دخول)
    // نعرض اللوقو + دائرة التحميل
    // ---------------------------------------------------------
    if (showAnimation || loading) {
        return (
            <View style={styles.center}>
                <Image
                    source={require('../assets/images/logo.png')}
                    style={{ width: 180, height: 180 }}
                    resizeMode="contain"
                />
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            </View>
        );
    }

    // ---------------------------------------------------------
    // 2) بعد الأنميشن:
    // لو المستخدم مسجل دخول → ما نعرض الصفحة
    // (لأن التحويل صار في useEffect فوق)
    // ---------------------------------------------------------
    if (session) {
        return null;
    }

    // ---------------------------------------------------------
    // 3) مستخدم جديد:
    // بعد الأنميشن نعرض صفحة Start كاملة
    // ---------------------------------------------------------
    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            <Text style={styles.title}>Welcome</Text>

            <Text style={styles.subtitle}>
                Create an account or log in to continue
            </Text>

            <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/login')}
            >
                <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.registerButton}
                onPress={() => router.push('/register')}
            >
                <Text style={styles.registerText}>Create Account</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#fff',
    },
    logo: {
        width: 180,
        height: 180,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    loginButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#000',
        borderRadius: 10,
        marginBottom: 15,
    },
    loginText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
    registerButton: {
        width: '100%',
        padding: 15,
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: 10,
    },
    registerText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
});
