import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        try {
            if (!fullName.trim()) return Alert.alert('خطأ', 'أدخلي الاسم الكامل');
            if (!email.trim()) return Alert.alert('خطأ', 'أدخلي البريد الإلكتروني');
            if (!password.trim()) return Alert.alert('خطأ', 'أدخلي كلمة المرور');
            if (password.length < 6) return Alert.alert('خطأ', 'كلمة المرور لازم تكون 6 أحرف أو أكثر');

            setLoading(true);

            // 1) تسجيل المستخدم مع redirect URL
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    emailRedirectTo: 'https://qzhnghwmgujgthbkivdi.supabase.co/auth/v1/callback'
                }
            });

            if (error) {
                Alert.alert('خطأ', error.message);
                return;
            }

            // 2) حفظ الاسم في جدول profiles
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        full_name: fullName,
                    });

                if (profileError) {
                    console.log('Profile Insert Error:', profileError);
                }
            }

            // 3) إذا دخل مباشرة
            if (data.session) {
                router.replace('/home');
            } else {
                Alert.alert('تم التسجيل', 'تم إرسال رابط التفعيل إلى بريدك 📩');
                router.replace('/login');
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
            <Text style={styles.title}>إنشاء حساب</Text>

            <TextInput
                style={styles.input}
                placeholder="الاسم الكامل"
                value={fullName}
                onChangeText={setFullName}
            />

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
                onPress={handleRegister}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.link}>لديك حساب؟ تسجيل دخول</Text>
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
