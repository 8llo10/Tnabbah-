import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Modal,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleSubmit = async () => {
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            Alert.alert('تنبيه', 'الرجاء إدخال البريد الإلكتروني');
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

            if (error) {
                console.log('Forgot password error:', error.message);
                Alert.alert('خطأ', error.message);
                return;
            }

            // بدل رسالة النظام، نعرض نافذة منبثقة من نفس ثيم التطبيق
            setShowSuccessModal(true);
        } catch (err) {
            console.log('Forgot password unexpected error:', err);
            Alert.alert('خطأ', 'حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    const goToResetPassword = () => {
        const cleanEmail = email.trim().toLowerCase();

        setShowSuccessModal(false);

        router.push({
            pathname: '/auth/reset-password' as any,
            params: { email: cleanEmail },
        });
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
                        {/* زر الرجوع */}
                        <TouchableOpacity
                            style={styles.backButtonWrapper}
                            activeOpacity={0.82}
                            onPress={() => router.replace('/login')}
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
                            <Text style={styles.title}>نسيت كلمة المرور؟</Text>

                            <Text style={styles.subtitle}>
                                أدخلي البريد الإلكتروني المرتبط بحسابك لإرسال كود إعادة تعيين كلمة المرور
                            </Text>

                            <View style={styles.formArea}>
                                {/* البريد الإلكتروني */}
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
                                        returnKeyType="done"
                                    />
                                </LinearGradient>
                            </View>
                        </View>

                        <View style={styles.buttonsArea}>
                            {/* زر إرسال الكود */}
                            <TouchableOpacity
                                style={[
                                    styles.resetButtonWrapper,
                                    loading && { opacity: 0.6 },
                                ]}
                                onPress={handleSubmit}
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
                                    style={styles.resetGradient}
                                >
                                    <View style={styles.resetGlassTop} />

                                    {loading ? (
                                        <View style={styles.loadingRow}>
                                            <ActivityIndicator
                                                size="small"
                                                color="#FFFFFF"
                                            />
                                            <Text style={styles.resetText}>
                                                جاري الإرسال...
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.resetText}>
                                            إرسال الكود
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* النافذة المنبثقة بعد نجاح الإرسال */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <LinearGradient
                        colors={[
                            'rgba(255,255,255,0.98)',
                            'rgba(255,241,238,0.95)',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.successModal}
                    >
                        <View style={styles.successIconCircle}>
                            <Ionicons
                                name="checkmark"
                                size={30}
                                color="#871B17"
                            />
                        </View>

                        <Text style={styles.successTitle}>تم إرسال الكود</Text>

                        <Text style={styles.successMessage}>
                            أرسلنا كود إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
                        </Text>

                        <TouchableOpacity
                            style={styles.modalButtonWrapper}
                            activeOpacity={0.9}
                            onPress={goToResetPassword}
                        >
                            <LinearGradient
                                colors={[
                                    'rgba(139, 26, 23, 0.98)',
                                    'rgba(110, 20, 17, 0.98)',
                                ]}
                                start={{ x: 0.2, y: 0 }}
                                end={{ x: 0.8, y: 1 }}
                                style={styles.modalButtonGradient}
                            >
                                <View style={styles.modalButtonGlassTop} />

                                <Text style={styles.modalButtonText}>
                                    إدخال الكود
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </Modal>
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

    // زر الرجوع
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
        marginBottom: 58,
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

    buttonsArea: {
        marginTop: 'auto',
        paddingTop: 28,
        zIndex: 8,
    },

    resetButtonWrapper: {
        width: '100%',
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',

        shadowColor: '#6E1411',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 6,
    },

    resetGradient: {
        flex: 1,
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    resetGlassTop: {
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

    resetText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '800',
        zIndex: 5,
    },

    // النافذة المنبثقة
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(46, 29, 29, 0.28)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },

    successModal: {
        width: '100%',
        borderRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(135, 27, 23, 0.14)',

        shadowColor: '#6E1411',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 8,
    },

    successIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(135, 27, 23, 0.09)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },

    successTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#871B17',
        textAlign: 'center',
    },

    successMessage: {
        marginTop: 12,
        marginBottom: 24,
        fontSize: 15.5,
        lineHeight: 24,
        fontWeight: '600',
        color: '#7C6A6A',
        textAlign: 'center',
    },

    modalButtonWrapper: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',

        shadowColor: '#6E1411',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 5,
    },

    modalButtonGradient: {
        flex: 1,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    modalButtonGlassTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '46%',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.07)',
        zIndex: 1,
    },

    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        zIndex: 5,
    },
});