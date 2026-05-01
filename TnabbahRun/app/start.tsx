import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
0
function TnabbahBackground() {
    return (
        <View style={styles.background}>
            <View style={styles.dashedCircle} />
            <View style={styles.innerCircle} />
        </View>
    );
}

export default function StartScreen() {
    const router = useRouter();
    const { session, loading } = useAuth();

    const [showAnimation, setShowAnimation] = useState(true);

    const [language, setLanguage] = useState<'ar' | 'en'>('ar');

    const isArabic = language === 'ar';

    const toggleLanguage = () => {
        setLanguage(prev => (prev === 'ar' ? 'en' : 'ar'));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAnimation(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!loading && session && !showAnimation) {
            router.replace('/home');
        }
    }, [loading, session, showAnimation]);

    if (showAnimation || loading) {
        return (
            <View style={styles.center}>
                <TnabbahBackground />

                <Image
                    source={require('../assets/images/logo.png')}
                    style={{ width: 180, height: 180 }}
                    resizeMode="contain"
                />
                <ActivityIndicator size="large" style={{ marginTop: 20 }} color="#871B17" />
            </View>
        );
    }

    if (session) {
        return null;
    }

    return (
        <View style={styles.container}>
            <TnabbahBackground />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.langButton}
                    activeOpacity={0.8}
                    onPress={toggleLanguage}
                >
                    <Feather name="globe" size={17} color="#2E1D1D" />
                    <Text style={styles.langText}>
                        {isArabic ? 'EN' : 'AR'}
                    </Text>
                </TouchableOpacity>

                <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.welcomeArea}>
                <Text style={styles.title}>
                    {isArabic ? 'مرحباً بك في تنبه' : 'Welcome to Tnabbah'}
                </Text>

                <Text style={styles.subtitle}>
                    {isArabic
                        ? 'لأن سيارتك تحتاج من ينتبه لها'
                        : 'Because your car needs someone to watch over it'}
                </Text>
            </View>

            <View style={styles.carSection}>
                <View style={styles.aiBubble}>
                    <Text style={styles.aiText}>AI</Text>
                </View>

                <View style={styles.warningBubble}>
                    <Ionicons name="warning-outline" size={24} color="#871B17" />
                </View>

                <View style={styles.shieldBubble}>
                    <Feather name="shield" size={23} color="#871B17" />
                </View>

                <View style={styles.engineBubble}>
                    <MaterialCommunityIcons name="engine" size={25} color="#871B17" />
                </View>

                <Image
                    source={require('../assets/images/car-front.png')}
                    style={styles.carImage}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.buttonsArea}>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.push('/login')}
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
                            {isArabic ? 'تسجيل الدخول' : 'Login'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => router.push('/register')}
                    activeOpacity={0.9}
                >
                    <Text style={styles.registerText}>
                        {isArabic ? 'إنشاء حساب جديد' : 'Create Account'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    dashedCircle: {
    position: 'absolute',
    width: width * 0.66,
    height: width * 0.66,
    borderRadius: width * 0.33,
    borderWidth: 1.4,
    borderColor: 'rgba(135, 27, 23, 0.32)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    top: height * 0.385,
    left: width / 2 - (width * 0.66) / 2,
},

innerCircle: {
    position: 'absolute',
    width: width * 0.50,
    height: width * 0.50,
    borderRadius: width * 0.25,
    borderWidth: 1.2,
    borderColor: 'rgba(135, 27, 23, 0.18)',
    backgroundColor: 'transparent',
    top: height * 0.385 + (width * 0.08),
    left: width / 2 - (width * 0.50) / 2,
},
    background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
},

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },

    container: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },

    header: {
        width: '100%',
        marginTop: height * 0.105,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 5,
    },

    langButton: {
        height: 47,
        minWidth: 83,
        paddingHorizontal: 16,
        borderRadius: 24,
        backgroundColor: 'rgba(248, 238, 238, 0.85)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },

    langText: {
        fontSize: 14,
        color: '#2E1D1D',
        fontWeight: '500',
    },

    logo: {
        width: 88,
        height: 64,
        marginTop: -6,
    },

    welcomeArea: {
        marginTop: height * 0.06,
        alignItems: 'center',
        zIndex: 5,
    },

    title: {
        fontSize: 31,
        fontWeight: '900',
        color: '#871B17',
        textAlign: 'center',
        letterSpacing: -0.5,
    },

    subtitle: {
        marginTop: 15,
        fontSize: 18,
        color: '#4D3A3A',
        fontWeight: '500',
        textAlign: 'center',
    },

    carSection: {
        position: 'absolute',
        width: width * 0.66,
        height: width * 0.66,
        top: height * 0.385,
        left: width / 2 - (width * 0.66) / 2,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 6,
    },

    aiBubble: {
        position: 'absolute',
        width: 62,
        height: 62,
        borderRadius: 31,
        top: -31,
        left: '50%',
        marginLeft: -31,
        backgroundColor: 'rgba(248,238,238,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 8,
    },

    aiText: {
        color: '#871B17',
        fontSize: 17,
        fontWeight: '900',
    },

    warningBubble: {
        position: 'absolute',
        width: 62,
        height: 62,
        borderRadius: 31,
        left: -31,
        top: '50%',
        marginTop: -31,
        backgroundColor: 'rgba(248,238,238,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 8,
    },

    shieldBubble: {
        position: 'absolute',
        width: 62,
        height: 62,
        borderRadius: 31,
        right: -31,
        top: '50%',
        marginTop: -31,
        backgroundColor: 'rgba(248,238,238,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 8,
    },

    engineBubble: {
        position: 'absolute',
        width: 62,
        height: 62,
        borderRadius: 31,
        bottom: -31,
        left: '50%',
        marginLeft: -31,
        backgroundColor: 'rgba(248,238,238,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 8,
    },

    carImage: {
        width: width * 0.24,
        height: width * 0.17,
        zIndex: 7,
    },

    buttonsArea: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: height * 0.065,
        zIndex: 8,
    },

    loginButton: {
        width: '100%',
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#5F130F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.13,
        shadowRadius: 16,
        elevation: 4,
    },

    loginGradient: {
        flex: 1,
        borderRadius: 33,
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
    },

    registerButton: {
        width: '100%',
        height: 66,
        borderRadius: 33,
        borderWidth: 1.5,
        borderColor: '#DABDBD',
        backgroundColor: 'rgba(248,238,238,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    registerText: {
        color: '#871B17',
        textAlign: 'center',
        fontSize: 19,
        fontWeight: '900',
    },
});