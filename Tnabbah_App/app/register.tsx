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

    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [loading, setLoading] = useState(false);

    const validatePassword = () => {
        const hasMinLength = password.length >= 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (!password.trim()) {
            setErrorMessage('اكتبي كلمة المرور');
            return false;
        }

        if (!hasMinLength) {
            setErrorMessage('كلمة المرور لازم تكون 6 خانات على الأقل');
            return false;
        }

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            setErrorMessage('كلمة المرور لازم تحتوي على حرف كبير، حرف صغير، ورقم');
            return false;
        }

        setErrorMessage('');
        return true;
    };

    const handleRegister = async () => {
        try {
            if (!fullName.trim()) {
                setErrorMessage('');
                return Alert.alert('خطأ', 'أدخلي الاسم الكامل');
            }

            if (!email.trim()) {
                setErrorMessage('');
                return Alert.alert('خطأ', 'أدخلي البريد الإلكتروني');
            }

            if (!validatePassword()) {
                return;
            }

            setLoading(true);

            const cleanName = fullName.trim();
            const cleanEmail = email.trim().toLowerCase();

            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                    data: {
                        full_name: cleanName,
                    },
                    emailRedirectTo: 'https://qzhnghwmgujgthbkivdi.supabase.co/auth/v1/callback',
                },
            });

            if (error) {
                setErrorMessage(error.message);
                return;
            }

            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        username: cleanEmail,
                        full_name: cleanName,
                        avatar_url: null,
                        website: null,
                    });

                if (profileError) {
                    console.log('Profile Upsert Error:', profileError);
                    Alert.alert(
                        'تنبيه',
                        'تم إنشاء الحساب، لكن الاسم لم يُحفظ في جدول profiles. راجعي صلاحيات Supabase.'
                    );
                    return;
                }
            }

            setPassword('');
            setErrorMessage('');

            if (data.session) {
                router.replace("/connection-intro" as any);
            } else {
                Alert.alert('تم التسجيل', 'تم إرسال رابط التفعيل إلى بريدك 📩');
                router.replace('/login');
            }

        } catch (err) {
            console.log(err);
            setErrorMessage('صار خطأ غير متوقع، حاولي مرة أخرى');
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
                        <Feather
                            name="user"
                            size={22}
                            color="#7C6A6A"
                            style={styles.inputIcon}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="الاسم الكامل"
                            placeholderTextColor="#7C6A6A"
                            value={fullName}
                            onChangeText={(text) => {
                                setFullName(text);
                                setErrorMessage('');
                            }}
                            textAlign="right"
                        />
                    </View>

                    <View style={styles.inputBox}>
                        <Feather
                            name="mail"
                            size={22}
                            color="#7C6A6A"
                            style={styles.inputIcon}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="البريد الإلكتروني"
                            placeholderTextColor="#7C6A6A"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrorMessage('');
                            }}
                            textAlign="right"
                        />
                    </View>

                    <View style={[styles.inputBox, errorMessage && styles.inputBoxError]}>
                        <Feather
                            name="lock"
                            size={23}
                            color={errorMessage ? "#D32F2F" : "#7C6A6A"}
                            style={styles.inputIcon}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="كلمة المرور"
                            placeholderTextColor="#7C6A6A"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setErrorMessage('');
                            }}
                            textAlign="right"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TouchableOpacity
                            style={styles.eyeButton}
                            activeOpacity={0.7}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? "eye-outline" : "eye-off-outline"}
                                size={22}
                                color="#7C6A6A"
                            />
                        </TouchableOpacity>
                    </View>

                    {errorMessage ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={18} color="#D32F2F" />
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}
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

    inputBoxError: {
        borderColor: '#D32F2F',
        backgroundColor: 'rgba(255, 245, 245, 0.88)',
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

    eyeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    errorBox: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: -6,
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        backgroundColor: 'rgba(211, 47, 47, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(211, 47, 47, 0.18)',
        gap: 7,
    },

    errorText: {
        color: '#D32F2F',
        fontSize: 13.5,
        fontWeight: '800',
        textAlign: 'right',
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