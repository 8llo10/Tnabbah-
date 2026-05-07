import { useState } from 'react';
import { useRouter } from "expo-router";
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

import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

function TnabbahBackground() {
    return (
        <View style={styles.background} />
    );
}

export default function LoginScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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

           if (data.session) {
  router.replace("/bluetooth-setup" as any);
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
                <Text style={styles.title}>تسجيل الدخول</Text>

                <Text style={styles.subtitle}>مرحباً بك في تنبه</Text>

                <View style={styles.formArea}>
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
                            onChangeText={setEmail}
                            textAlign="right"
                        />
                    </View>

                    <View style={styles.inputBox}>
                        <Feather
                            name="lock"
                            size={23}
                            color="#7C6A6A"
                            style={styles.inputIcon}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="كلمة المرور"
                            placeholderTextColor="#7C6A6A"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
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

                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.forgotPasswordButton}
                        onPress={() => router.push("/forgot-password" as any)}
                    >
                        <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.buttonsArea}>
                <TouchableOpacity
                    style={[styles.loginButton, loading && { opacity: 0.5 }]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#9A3A33', '#5F130F']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.loginGradient}
                    >
                        <View style={styles.loginHighlight} />

                        <Text style={styles.loginText}>
                            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.registerRow}>
                    <Text style={styles.linkLight}>ليس لديك حساب؟</Text>

                    <TouchableOpacity
                        onPress={() => router.push('/register')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.linkBold}>تسجيل حساب جديد</Text>
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
        paddingTop: height * 0.205,
    },

    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#2E1D1D',
        textAlign: 'center',
        letterSpacing: -0.4,
        includeFontPadding: false,
    },

    subtitle: {
        marginTop: 18,
        marginBottom: 58,
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

    eyeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    forgotPasswordButton: {
        alignSelf: 'flex-end',
        paddingVertical: 10,
        zIndex: 999,
        elevation: 999,
    },

    forgotPasswordText: {
        color: '#871B17',
        fontSize: 14,
        textAlign: 'right',
        fontWeight: '900',
        includeFontPadding: false,
    },

    buttonsArea: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: height * 0.064,
        zIndex: 8,
    },

    loginButton: {
        width: '100%',
        height: 62,
        borderRadius: 31,
        overflow: 'hidden',
        marginBottom: 22,
        shadowColor: '#5F130F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 4,
    },

    loginGradient: {
        flex: 1,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    loginHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },

    loginText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '900',
        includeFontPadding: false,
    },

    registerRow: {
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