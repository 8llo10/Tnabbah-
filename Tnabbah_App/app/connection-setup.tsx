import React, { useEffect, useRef } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import {
    Animated,
    Dimensions,
    Easing,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height } = Dimensions.get('window');

const BURGUNDY = '#871B17';
const BURGUNDY_DARK = '#6E1411';
const TEXT_DARK = '#2E1D1D';
const TEXT_MUTED = '#7C6A6A';

export default function ConnectionSetupScreen() {
    const startStepAnim = useRef(new Animated.Value(0)).current;
    const prepareStepAnim = useRef(new Animated.Value(0)).current;
    const chooseStepAnim = useRef(new Animated.Value(0)).current;
    const activeLineAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(startStepAnim, {
                    toValue: 1,
                    duration: 420,
                    easing: Easing.out(Easing.back(1.4)),
                    useNativeDriver: true,
                }),
                Animated.timing(cardAnim, {
                    toValue: 1,
                    duration: 650,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),

            Animated.timing(activeLineAnim, {
                toValue: 1,
                duration: 520,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),

            Animated.timing(prepareStepAnim, {
                toValue: 1,
                duration: 420,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
            }),

            Animated.timing(chooseStepAnim, {
                toValue: 1,
                duration: 420,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
            }),
        ]).start();

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();

        return () => pulse.stop();
    }, [
        startStepAnim,
        prepareStepAnim,
        chooseStepAnim,
        activeLineAnim,
        cardAnim,
        pulseAnim,
    ]);

    const activeLineWidth = activeLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 72],
    });

    const cardTranslateY = cardAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [18, 0],
    });

    const cardOpacity = cardAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <LinearGradient
            colors={['#FFFFFF', '#FFF8F7', '#FFF1EE']}
            locations={[0, 0.6, 1]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.gradientBackground}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* زر الرجوع بنفس شكل الواجهات السابقة */}
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
                                color={BURGUNDY}
                            />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* الخطوات العلوية */}
                    <View style={styles.stepsContainer}>
                        <Animated.View
                            style={{
                                opacity: chooseStepAnim,
                                transform: [
                                    {
                                        scale: chooseStepAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.8, 1],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <StepItem
                                label="اختر"
                                iconName="bluetooth"
                                state="inactive"
                            />
                        </Animated.View>

                        <View style={styles.lineInactive} />

                        <Animated.View
                            style={{
                                opacity: prepareStepAnim,
                                transform: [
                                    {
                                        scale: Animated.multiply(
                                            prepareStepAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1],
                                            }),
                                            pulseAnim
                                        ),
                                    },
                                ],
                            }}
                        >
                            <StepItem
                                label="جهّز"
                                iconName="car-outline"
                                state="current"
                            />
                        </Animated.View>

                        <View style={styles.activeLineTrack}>
                            <Animated.View
                                style={[
                                    styles.activeLineFill,
                                    { width: activeLineWidth },
                                ]}
                            />
                        </View>

                        <Animated.View
                            style={{
                                opacity: startStepAnim,
                                transform: [
                                    {
                                        scale: startStepAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.8, 1],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <StepItem
                                label="ابدأ"
                                iconName="cellphone-cog"
                                state="completed"
                            />
                        </Animated.View>
                    </View>

                    {/* الكارد الكبير */}
                    <Animated.View
                        style={[
                            styles.cardWrapper,
                            {
                                opacity: cardOpacity,
                                transform: [{ translateY: cardTranslateY }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={[
                                'rgba(255,255,255,0.96)',
                                'rgba(255,241,238,0.86)',
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.card}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.cardScrollContent}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardIconCircle}>
                                        <MaterialCommunityIcons
                                            name="car-outline"
                                            size={32}
                                            color={BURGUNDY}
                                        />
                                    </View>

                                    <View style={styles.headerTextBox}>
                                        <Text style={styles.title}>
                                            جهّزي القطعة
                                        </Text>

                                        <Text style={styles.subtitle}>
                                            ابدئي بتجهيز السيارة والقطعة حتى
                                            يتمكن التطبيق من التعرف عليها قبل
                                            اختيار طريقة الاتصال.
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.instructionsBox}>
                                    <InstructionRow
                                        number="1"
                                        text="شغّلي السيارة"
                                    />
                                    <InstructionRow
                                        number="2"
                                        text="ركّبي القطعة في مدخل OBD"
                                    />
                                </View>

                                {/* الأنيميشن */}
                                <View style={styles.animationBox}>
                                    <LottieView
                                        source={require('../assets/animations/connected-car.json')}
                                        autoPlay
                                        loop
                                        resizeMode="contain"
                                        style={styles.lottie}
                                    />
                                </View>

                                <View style={styles.lastInstructionBox}>
                                    <InstructionRow
                                        number="3"
                                        text="انتظري حتى تضيء لمبة القطعة"
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.nextButtonWrapper}
                                    activeOpacity={0.9}
                                    onPress={() =>
                                        router.push('/bluetooth-setup' as any)
                                    }
                                >
                                    <LinearGradient
                                        colors={[
                                            'rgba(139, 26, 23, 0.98)',
                                            'rgba(110, 20, 17, 0.98)',
                                        ]}
                                        start={{ x: 0.2, y: 0 }}
                                        end={{ x: 0.8, y: 1 }}
                                        style={styles.nextGradient}
                                    >
                                        <View style={styles.nextGlassTop} />

                                        <Text style={styles.nextButtonText}>
                                            تم توصيل القطعة
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </ScrollView>
                        </LinearGradient>
                    </Animated.View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

function StepItem({
    label,
    iconName,
    state,
}: {
    label: string;
    iconName: keyof typeof MaterialCommunityIcons.glyphMap;
    state: 'inactive' | 'current' | 'completed';
}) {
    const isActive = state === 'current' || state === 'completed';
    const isCurrent = state === 'current';

    return (
        <View style={styles.stepItem}>
            <LinearGradient
                colors={
                    isActive
                        ? [
                              'rgba(139, 26, 23, 0.98)',
                              'rgba(110, 20, 17, 0.98)',
                          ]
                        : [
                              'rgba(255,255,255,0.96)',
                              'rgba(255,241,238,0.86)',
                          ]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.stepCircle,
                    isActive && styles.stepCircleActive,
                    isCurrent && styles.stepCircleCurrent,
                ]}
            >
                <MaterialCommunityIcons
                    name={iconName}
                    size={24}
                    color={isActive ? '#FFFFFF' : '#9B6B6B'}
                />
            </LinearGradient>

            <Text
                style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

function InstructionRow({
    number,
    text,
}: {
    number: string;
    text: string;
}) {
    return (
        <View style={styles.instructionRow}>
            <View style={styles.numberCircle}>
                <Text style={styles.numberText}>{number}</Text>
            </View>

            <Text style={styles.instructionText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },

    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    container: {
        flex: 1,
        paddingHorizontal: 22,
        paddingTop: height * 0.055,
    },

    // زر الرجوع
    backButtonWrapper: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginBottom: 26,

        shadowColor: BURGUNDY,
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

    // الخطوات
    stepsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginBottom: 30,
    },

    stepItem: {
        width: 58,
        alignItems: 'center',
    },

    stepCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(135, 27, 23, 0.12)',

        shadowColor: BURGUNDY,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },

    stepCircleActive: {
        borderWidth: 0,
        shadowColor: BURGUNDY_DARK,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 5,
    },

    stepCircleCurrent: {
        shadowOpacity: 0.22,
        shadowRadius: 16,
        elevation: 6,
    },

    stepLabel: {
        marginTop: 7,
        fontSize: 12,
        color: '#B0A3A3',
        fontWeight: '700',
    },

    stepLabelActive: {
        color: BURGUNDY,
        fontWeight: '900',
    },

    lineInactive: {
        width: 72,
        height: 2,
        backgroundColor: 'rgba(135, 27, 23, 0.12)',
        marginTop: 23,
        borderRadius: 1,
    },

    activeLineTrack: {
        width: 72,
        height: 2,
        backgroundColor: 'rgba(135, 27, 23, 0.12)',
        marginTop: 23,
        borderRadius: 1,
        overflow: 'hidden',
        alignItems: 'flex-end',
    },

    activeLineFill: {
        height: 2,
        backgroundColor: BURGUNDY,
        borderRadius: 1,
    },

    // الكارد
    cardWrapper: {
        flex: 1,
        width: '100%',
        marginBottom: 18,
    },

    card: {
        flex: 1,
        width: '100%',
        borderWidth: 1.2,
        borderColor: 'rgba(135, 27, 23, 0.14)',
        borderRadius: 28,
        overflow: 'hidden',

        shadowColor: BURGUNDY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
    },

    cardScrollContent: {
        paddingHorizontal: 18,
        paddingTop: 26,
        paddingBottom: 24,
    },

    cardHeader: {
        width: '100%',
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
    },

    cardIconCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'rgba(135, 27, 23, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },

    headerTextBox: {
        flex: 1,
        alignItems: 'flex-end',
        paddingTop: 2,
    },

    title: {
        fontSize: 19,
        fontWeight: '900',
        color: TEXT_DARK,
        textAlign: 'right',
        marginBottom: 10,
    },

    subtitle: {
        fontSize: 14.5,
        color: TEXT_MUTED,
        fontWeight: '600',
        textAlign: 'right',
        lineHeight: 24,
    },

    instructionsBox: {
        width: '100%',
        alignItems: 'flex-end',
        marginTop: 34,
        gap: 18,
    },

    instructionRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        paddingRight: 4,
    },

    numberCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(135, 27, 23, 0.10)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },

    numberText: {
        color: BURGUNDY,
        fontSize: 17,
        fontWeight: '900',
    },

    instructionText: {
        flex: 1,
        fontSize: 15.5,
        fontWeight: '800',
        color: TEXT_DARK,
        textAlign: 'right',
    },

    animationBox: {
        width: '100%',
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 14,
    },

    lottie: {
        width: 250,
        height: 250,
    },

    lastInstructionBox: {
        width: '100%',
        alignItems: 'flex-end',
        marginTop: 8,
        marginBottom: 26,
    },

    // زر تم توصيل القطعة
    nextButtonWrapper: {
        width: '100%',
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',

        shadowColor: BURGUNDY_DARK,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 6,
    },

    nextGradient: {
        flex: 1,
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    nextGlassTop: {
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

    nextButtonText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '800',
        zIndex: 5,
    },
});