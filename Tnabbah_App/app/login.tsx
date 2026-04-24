import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            if (!email.trim()) return Alert.alert('خطأ', 'أدخلي البريد الإلكتروني');
            if (!password.trim()) return Alert.alert('خطأ', 'أدخلي كلمة المرور');

            setLoading(true);

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                Alert.alert('خطأ', error.message);
                return;
            }

            // إذا تم تسجيل الدخول بنجاح
            if (data.session) {
                router.replace('/home');
            }

        } catch (err) {
            console.log(err);
            Alert.alert('خطأ', 'صار خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>تسجيل دخول</Text>

            <TextInput
                style={styles.input}
                placeholder="البريد الإلكتروني"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.5 }]}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.link}>ليس لديك حساب؟ إنشاء حساب جديد</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 25,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        padding: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#000',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
    link: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
    },
});
