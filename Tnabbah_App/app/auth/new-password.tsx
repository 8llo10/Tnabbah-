import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { setPasswordRecoveryMode } from '../../utils/passwordRecoveryFlag';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function NewPasswordScreen() {
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [loading, setLoading] = useState(false);

    const clearMessages = () => {
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleUpdatePassword = async () => {
        const cleanPassword = password.trim();
        const cleanConfirmPassword = confirmPassword.trim();

        if (!cleanPassword) {
            setErrorMessage('اكتبي كلمة المرور الجديدة');
            return;
        }

        if (cleanPassword.length < 6) {
            setErrorMessage('كلمة المرور لازم تكون 6 أحرف أو أكثر');
            return;
        }

        if (!cleanConfirmPassword) {
            setErrorMessage('أكدي كلمة المرور الجديدة');
            return;
        }

        if (cleanPassword !== cleanConfirmPassword) {
            setErrorMessage('كلمة المرور وتأكيدها غير متطابقين');
            return;
        }

        try {
            setLoading(true);
            clearMessages();

            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession();

            if (sessionError) {
                console.log('getSession error:', sessionError.message);
                setErrorMessage(
                    'صار خطأ في جلسة تغيير كلمة المرور، اطلبي رمز جديد'
                );
                return;
            }

            if (!sessionData.session) {
                console.log('No recovery session found');
                setErrorMessage(
                    'انتهت جلسة تغيير كلمة المرور، اطلبي رمز جديد'
                );
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: cleanPassword,
            });

            if (updateError) {
                console.log('update password error:', updateError.message);
                setErrorMessage(
                    'ما قدرنا نحفظ كلمة المرور الجديدة، حاولي مرة ثانية'
                );
                return;
            }

            setPassword('');
            setConfirmPassword('');
            setSuccessMessage('تم حفظ كلمة المرور بنجاح');

            await AsyncStorage.removeItem('password_recovery_flow');
            await setPasswordRecoveryMode(false);

            setTimeout(() => {
                router.replace('/login' as any);
            }, 800);
        } catch (error) {
            console.log('new password error:', error);
            setErrorMessage('حدث خطأ غير متوقع، حاولي مرة ثانية');
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = () => {
        if (errorMessage) {
            return (
                <View style={styles.messageBoxError}>
                    <Ionicons
                        name="alert-circle"
                        size={18}
                        color="#D32F2F"
                    />
                    <Text style={styles.messageTextError}>
                        {errorMessage}
                    </Text>
                </View>
            );
        }

        if (successMessage) {
            return (
                <View style={styles.messageBoxInfo}>
                    <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#2E7D32"
                    />
                    <Text style={styles.messageTextInfo}>
                        {successMessage}
                    </Text>
                </View>
            );
        }

        return null;
    };

    return (
        <LinearGradient
            colors={['#FFFFFF', '#FFF8F7', '#FFF1EE']}
            locations={[0, 0.6, 1]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.container}
        >
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="interactive"
                >
                    <View style={styles.screenContent}>
                        {/* زر الرجوع بنفس تنسيق الواجهات السابقة */}
                        <TouchableOpacity
                            style={styles.backButtonWrapper}
                            activeOpacity={0.82}
                            onPress={() => router.back()}
                        >
                            <LinearGradient
                                colors={[
                                    'rgba(255,255,255,0.96)',
                                    'rgba(255,241,238,0.86)',
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.backButtonGradient}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={23}
                                    color="#871B17"
                                />
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.content}>
                            <Text style={styles.title}>تعيين كلمة المرور</Text>

                            <Text style={styles.subtitle}>
                                أدخلي كلمة المرور الجديدة ثم أعيدي إدخالها للتأكيد
                            </Text>

                            <View style={styles.formArea}>
                                {/* كلمة المرور الجديدة */}
                                <LinearGradient
                                    colors={[
                                        'rgba(255,255,255,0.96)',
                                        'rgba(255,241,238,0.86)',
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.inputBox}
                                >
                                    <Feather
                                        name="lock"
                                        size={22}
                                        color="#7C6A6A"
                                        style={styles.inputIcon}
                                    />

                                    <TextInput
                                        style={styles.input}
                                        placeholder="كلمة المرور الجديدة"
                                        placeholderTextColor="#7C6A6A"
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            clearMessages();
                                        }}
                                        textAlign="right"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        selectionColor="#6E1411"
                                        returnKeyType="next"
                                    />

                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        activeOpacity={0.7}
                                        onPress={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        <Ionicons
                                            name={
                                                showPassword
                                                    ? 'eye-outline'
                                                    : 'eye-off-outline'
                                            }
                                            size={22}
                                            color="#7C6A6A"
                                        />
                                    </TouchableOpacity>
                                </LinearGradient>

                                {/* تأكيد كلمة المرور */}
                                <LinearGradient
                                    colors={[
                                        'rgba(255,255,255,0.96)',
                                        'rgba(255,241,238,0.86)',
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.inputBox}
                                >
                                    <Feather
                                        name="lock"
                                        size={22}
                                        color="#7C6A6A"
                                        style={styles.inputIcon}
                                    />

                                    <TextInput
                                        style={styles.input}
                                        placeholder="تأكيد كلمة المرور الجديدة"
                                        placeholderTextColor="#7C6A6A"
                                        secureTextEntry={!showConfirmPassword}
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            clearMessages();
                                        }}
                                        textAlign="right"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        selectionColor="#6E1411"
                                        returnKeyType="done"
                                    />

                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        activeOpacity={0.7}
                                        onPress={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                    >
                                        <Ionicons
                                            name={
                                                showConfirmPassword
                                                    ? 'eye-outline'
                                                    : 'eye-off-outline'
                                            }
                                            size={22}
                                            color="#7C6A6A"
                                        />
                                    </TouchableOpacity>
                                </LinearGradient>

                                {renderMessage()}
                            </View>
                        </View>

                        <View style={styles.bottomArea}>
                            <TouchableOpacity
                                style={[
                                    styles.mainButtonWrapper,
                                    loading && { opacity: 0.75 },
                                ]}
                                onPress={handleUpdatePassword}
                                disabled={loading}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={[
                                        'rgba(139, 26, 23, 0.98)',
                                        'rgba(110, 20, 17, 0.98)',
                                    ]}
                                    start={{ x: 0.2, y: 0 }}
                                    end={{ x: 0.8, y: 1 }}
                                    style={styles.buttonGradient}
                                >
                                    <View style={styles.buttonGlassTop} />

                                    {loading ? (
                                        <View style={styles.loadingRow}>
                                            <ActivityIndicator
                                                size="small"
                                                color="#FFFFFF"
                                            />
                                            <Text style={styles.buttonText}>
                                                جاري الحفظ...
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.buttonText}>
                                            حفظ كلمة المرور
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },

    keyboardAvoidingView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
    },

    screenContent: {
        flex: 1,
        minHeight: height,
        paddingHorizontal: 24,
        paddingBottom: height * 0.064,
    },

    // زر الرجوع نفس الواجهات السابقة
    backButtonWrapper: {
        position: 'absolute',
        top: height * 0.105,
        left: 24,
        width: 52,
        height: 52,
        borderRadius: 26,
        zIndex: 10,

        shadowColor: '#871B17',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.11,
        shadowRadius: 15,
        elevation: 4,
    },

    backButtonGradient: {
        flex: 1,
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: 'rgba(135, 27, 23, 0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    content: {
        zIndex: 5,
        paddingTop: height * 0.19,
        alignItems: 'center',
    },

    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#2E1D1D',
        textAlign: 'center',
        letterSpacing: -0.4,
    },

    subtitle: {
        marginTop: 18,
        marginBottom: 48,
        fontSize: 16,
        color: '#7C6A6A',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 24,
    },

    formArea: {
        width: '100%',
    },

    inputBox: {
        width: '100%',
        height: 62,
        borderRadius: 31,
        borderWidth: 1.2,
        borderColor: 'rgba(135, 27, 23, 0.16)',
        marginBottom: 18,
        paddingHorizontal: 22,
        flexDirection: 'row-reverse',
        alignItems: 'center',

        shadowColor: '#871B17',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
        elevation: 3,
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
    },

    eyeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    bottomArea: {
        marginTop: 'auto',
        paddingTop: 28,
        zIndex: 8,
    },

    mainButtonWrapper: {
        width: '100%',
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',
        marginBottom: 22,

        shadowColor: '#6E1411',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 6,
    },

    buttonGradient: {
        flex: 1,
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    buttonGlassTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '46%',
        borderTopLeftRadius: 33,
        borderTopRightRadius: 33,
        backgroundColor: 'rgba(255,255,255,0.07)',
        zIndex: 1,
    },

    loadingRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        zIndex: 5,
    },

    buttonText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '800',
        zIndex: 5,
    },

    messageBoxError: {
        width: '100%',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginTop: 0,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: 'rgba(211, 47, 47, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(211, 47, 47, 0.14)',
        gap: 7,
    },

    messageBoxInfo: {
        width: '100%',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginTop: 0,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: 'rgba(46, 125, 50, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(46, 125, 50, 0.14)',
        gap: 7,
    },

    messageTextError: {
        color: '#D32F2F',
        fontSize: 13.5,
        fontWeight: '700',
        textAlign: 'right',
        flex: 1,
    },

    messageTextInfo: {
        color: '#2E7D32',
        fontSize: 13.5,
        fontWeight: '700',
        textAlign: 'right',
        flex: 1,
    },
});