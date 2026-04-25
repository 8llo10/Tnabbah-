import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Dimensions,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

function TnabbahBackground() {
    return (
        <View style={styles.background} />
    );
}

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
                        username: email.trim(),
                        full_name: fullName,
                        avatar_url: null,
                        website: null,
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
            <TnabbahBackground />

            <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.8}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-forward" size={24} color="#2E1D1D" />
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={styles.title}>إنشاء حساب جديد</Text>

                <Text style={styles.subtitle}>
                    انضم إلى تنبه وابدأ متابعة سيارتك
                </Text>

                <View style={styles.formArea}>
                    <View style={styles.inputBox}>
                        <Feather name="user" size={22} color="#7C6A6A" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="الاسم الكامل"
                            placeholderTextColor="#7C6A6A"
                            value={fullName}
                            onChangeText={setFullName}
                            textAlign="right"
                        />
                    </View>

                    <View style={styles.inputBox}>
                        <Feather name="mail" size={22} color="#7C6A6A" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="البريد الإلكتروني"
                            placeholderTextColor="#7C6A6A"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            textAlign="right"
                        />
                    </View>

                    <View style={styles.inputBox}>
                        <Feather name="lock" size={23} color="#7C6A6A" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="كلمة المرور"
                            placeholderTextColor="#7C6A6A"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            textAlign="right"
                        />
                    </View>
                </View>
            </View>

            <View style={styles.buttonsArea}>
                <TouchableOpacity
                    style={[styles.registerButton, loading && { opacity: 0.5 }]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#9A3A33', '#5F130F']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.registerGradient}
                    >
                        <View style={styles.registerHighlight} />
                        <Text style={styles.registerText}>
                            {loading ? 'جاري التسجيل...' : 'تسجيل حساب جديد'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>أو</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.loginRow}>
                    <Text style={styles.linkLight}>لديك حساب بالفعل؟</Text>

                    <TouchableOpacity
                        onPress={() => router.push('/login')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.linkBold}>تسجيل الدخول</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },

    container: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },

    backButton: {
        position: 'absolute',
        top: height * 0.112,
        left: 24,
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(248, 238, 238, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },

    content: {
        flex: 1,
        zIndex: 5,
        paddingTop: height * 0.195,
    },

    title: {
        fontSize: 31,
        fontWeight: '900',
        color: '#2E1D1D',
        textAlign: 'center',
        letterSpacing: -0.4,
        includeFontPadding: false,
    },

    subtitle: {
        marginTop: 18,
        marginBottom: 48,
        fontSize: 16,
        color: '#7C6A6A',
        fontWeight: '600',
        textAlign: 'center',
        includeFontPadding: false,
    },

    formArea: {
        width: '100%',
    },

    inputBox: {
        width: '100%',
        height: 62,
        borderRadius: 31,
        borderWidth: 1.3,
        borderColor: '#E7C6C6',
        backgroundColor: 'rgba(255,255,255,0.68)',
        marginBottom: 18,
        paddingHorizontal: 22,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        shadowColor: '#5F130F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.025,
        shadowRadius: 10,
        elevation: 1,
    },

    inputIcon: {
        marginLeft: 13,
    },

    input: {
        flex: 1,
        fontSize: 17,
        color: '#2E1D1D',
        fontWeight: '600',
        paddingVertical: 0,
        includeFontPadding: false,
    },

    buttonsArea: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: height * 0.064,
        zIndex: 8,
    },

    registerButton: {
        width: '100%',
        height: 62,
        borderRadius: 31,
        overflow: 'hidden',
        marginBottom: 28,
        shadowColor: '#5F130F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 4,
    },

    registerGradient: {
        flex: 1,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    registerHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },

    registerText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '900',
        includeFontPadding: false,
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 22,
    },

    dividerLine: {
        width: 92,
        height: 1,
        backgroundColor: '#E0BDBD',
    },

    dividerText: {
        marginHorizontal: 16,
        fontSize: 15,
        color: '#7C6A6A',
        fontWeight: '700',
        includeFontPadding: false,
    },

    loginRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        alignItems: 'center',
        columnGap: 5,
    },

    linkLight: {
        color: '#7C6A6A',
        fontWeight: '600',
        fontSize: 15.5,
        includeFontPadding: false,
    },

    linkBold: {
        color: '#871B17',
        fontWeight: '900',
        fontSize: 15.5,
        includeFontPadding: false,
    },
});