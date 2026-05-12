import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';

const { height } = Dimensions.get('window');

const BURGUNDY = '#871B17';
const BURGUNDY_DARK = '#6E1411';
const TEXT_DARK = '#2E1D1D';
const TEXT_MUTED = '#7C6A6A';

type DeviceItem = {
    id: string;
    name: string;
    raw: Device;
};

export default function BluetoothSetupScreen() {
    const manager = useMemo(() => new BleManager(), []);

    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
    const [showDeviceList, setShowDeviceList] = useState(false);
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const startStepAnim = useRef(new Animated.Value(0)).current;
    const prepareStepAnim = useRef(new Animated.Value(0)).current;
    const chooseStepAnim = useRef(new Animated.Value(0)).current;
    const firstLineAnim = useRef(new Animated.Value(0)).current;
    const secondLineAnim = useRef(new Animated.Value(0)).current;
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

            Animated.timing(firstLineAnim, {
                toValue: 1,
                duration: 420,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),

            Animated.timing(prepareStepAnim, {
                toValue: 1,
                duration: 420,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
            }),

            Animated.timing(secondLineAnim, {
                toValue: 1,
                duration: 420,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
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
        firstLineAnim,
        secondLineAnim,
        cardAnim,
        pulseAnim,
    ]);

    const firstLineWidth = firstLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 72],
    });

    const secondLineWidth = secondLineAnim.interpolate({
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

    const getBluetoothStateMessage = (state: State) => {
        if (state === State.PoweredOff) {
            return 'البلوتوث مقفل. فعّليه من إعدادات الجوال ثم أعيدي المحاولة.';
        }

        if (state === State.Unauthorized) {
            return 'التطبيق لا يملك صلاحية البلوتوث. افتحي إعدادات الجوال وفعّلي صلاحية البلوتوث لتطبيق تنبه.';
        }

        if (state === State.Unsupported) {
            return 'هذا الجهاز لا يدعم البحث عن أجهزة البلوتوث المطلوبة.';
        }

        if (state === State.Resetting) {
            return 'البلوتوث يعيد التشغيل الآن. انتظري ثواني ثم أعيدي المحاولة.';
        }

        if (state === State.Unknown) {
            return 'حالة البلوتوث غير جاهزة الآن. انتظري ثواني ثم أعيدي المحاولة.';
        }

        return 'البلوتوث غير جاهز الآن. انتظري ثواني ثم أعيدي المحاولة.';
    };

    const startScan = async () => {
        try {
            console.log('✅ startScan pressed');

            setErrorMessage('');
            setDevices([]);
            setSelectedDevice(null);
            setShowDeviceList(true);

            const state = await manager.state();
            console.log('Bluetooth state:', state);

            if (state !== State.PoweredOn) {
                setErrorMessage(getBluetoothStateMessage(state));
                return;
            }

            setIsScanning(true);

            manager.startDeviceScan(
                null,
                { allowDuplicates: false },
                (error, device) => {
                    if (error) {
                        console.log('Bluetooth scan error:', error);
                        console.log('Bluetooth state:', state);

                        setErrorMessage(
                            error.message || 'صار خطأ أثناء البحث عن أجهزة البلوتوث.'
                        );

                        setIsScanning(false);
                        return;
                    }

                    if (!device) return;

                    const deviceName =
                        device.name ||
                        device.localName ||
                        `جهاز بلوتوث ${device.id.slice(-5)}`;

                    setDevices((prev) => {
                        const exists = prev.some((item) => item.id === device.id);
                        if (exists) return prev;

                        return [
                            ...prev,
                            {
                                id: device.id,
                                name: deviceName,
                                raw: device,
                            },
                        ];
                    });
                }
            );

            setTimeout(() => {
                manager.stopDeviceScan();
                setIsScanning(false);
            }, 10000);
        } catch (error: any) {
            console.log('Scan catch error:', error);
            setErrorMessage(error?.message || 'تعذر تشغيل البحث عن البلوتوث.');
            setIsScanning(false);
        }
    };

    const handleConnectDevice = async () => {
        if (!selectedDevice) {
            setErrorMessage('اختاري جهاز البلوتوث أولًا');
            return;
        }

        try {
            setIsConnecting(true);
            setErrorMessage('');

            console.log('Trying to connect to:', selectedDevice.id);

            manager.stopDeviceScan();
            setIsScanning(false);

            const connectedDevice = await manager.connectToDevice(
                selectedDevice.id,
                {
                    timeout: 15000,
                }
            );

            await connectedDevice.discoverAllServicesAndCharacteristics();

            console.log(
                'Connected successfully:',
                connectedDevice.name ||
                    connectedDevice.localName ||
                    connectedDevice.id
            );

            router.replace('/(tabs)/home' as any);
        } catch (error: any) {
            console.log('Bluetooth connect error:', error);

            setErrorMessage(
                'تعذر الاتصال بالجهاز. تأكدي أن القطعة قريبة وشغالة وغير متصلة بجهاز آخر.'
            );
        } finally {
            setIsConnecting(false);
        }
    };

    useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            console.log('Bluetooth state changed:', state);

            if (state === State.PoweredOn) {
                startScan();
            }
        }, true);

        return () => {
            manager.stopDeviceScan();
            subscription.remove();
            manager.destroy();
        };
    }, [manager]);

    return (
        <LinearGradient
            colors={['#FFFFFF', '#FFF8F7', '#FFF1EE']}
            locations={[0, 0.6, 1]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.gradientBackground}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.container}>
                            {/* زر الرجوع */}
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
                                                scale: Animated.multiply(
                                                    chooseStepAnim.interpolate({
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
                                        label="اختر"
                                        iconName="bluetooth"
                                        state="current"
                                    />
                                </Animated.View>

                                <View style={styles.activeLineTrack}>
                                    <Animated.View
                                        style={[
                                            styles.activeLineFill,
                                            { width: secondLineWidth },
                                        ]}
                                    />
                                </View>

                                <Animated.View
                                    style={{
                                        opacity: prepareStepAnim,
                                        transform: [
                                            {
                                                scale: prepareStepAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.8, 1],
                                                }),
                                            },
                                        ],
                                    }}
                                >
                                    <StepItem
                                        label="جهّز"
                                        iconName="car-outline"
                                        state="completed"
                                    />
                                </Animated.View>

                                <View style={styles.activeLineTrack}>
                                    <Animated.View
                                        style={[
                                            styles.activeLineFill,
                                            { width: firstLineWidth },
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

                            {/* الكارد */}
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
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardIconCircle}>
                                            <Ionicons
                                                name="bluetooth"
                                                size={34}
                                                color={BURGUNDY}
                                            />
                                        </View>

                                        <View style={styles.headerTextBox}>
                                            <Text style={styles.title}>
                                                اختاري اتصال البلوتوث
                                            </Text>

                                            <Text style={styles.subtitle}>
                                                ابحثي عن القطعة من الأجهزة
                                                المتاحة، ثم اختاريها لإكمال الربط.
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.formArea}>
                                        <Text style={styles.inputLabel}>
                                            الأجهزة المتاحة
                                        </Text>

                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                setShowDeviceList(true);
                                                startScan();
                                            }}
                                            disabled={isConnecting}
                                        >
                                            <LinearGradient
                                                colors={[
                                                    'rgba(255,255,255,0.96)',
                                                    'rgba(255,241,238,0.86)',
                                                ]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.deviceSelectBox}
                                            >
                                                <Ionicons
                                                    name="chevron-down"
                                                    size={22}
                                                    color="#7C6A6A"
                                                />

                                                <Text style={styles.deviceSelectText}>
                                                    {isScanning
                                                        ? 'جاري البحث...'
                                                        : selectedDevice
                                                          ? selectedDevice.name
                                                          : 'اختاري الجهاز'}
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        {showDeviceList && (
                                            <LinearGradient
                                                colors={[
                                                    'rgba(255,255,255,0.98)',
                                                    'rgba(255,241,238,0.94)',
                                                ]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.dropdownBox}
                                            >
                                                {isScanning && (
                                                    <View style={styles.loadingRow}>
                                                        <ActivityIndicator
                                                            color={BURGUNDY}
                                                        />
                                                        <Text
                                                            style={
                                                                styles.loadingText
                                                            }
                                                        >
                                                            جاري البحث عن الأجهزة...
                                                        </Text>
                                                    </View>
                                                )}

                                                <ScrollView
                                                    style={styles.deviceList}
                                                    nestedScrollEnabled
                                                    showsVerticalScrollIndicator={false}
                                                >
                                                    {!isScanning &&
                                                    devices.length === 0 ? (
                                                        <TouchableOpacity
                                                            style={styles.emptyBox}
                                                            onPress={startScan}
                                                            activeOpacity={0.8}
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.emptyText
                                                                }
                                                            >
                                                                لا توجد أجهزة
                                                                بلوتوث متاحة الآن.
                                                                تأكدي أن الجهاز قريب
                                                                ويعمل بنظام BLE، ثم
                                                                اضغطي لإعادة البحث.
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ) : (
                                                        devices.map((item) => (
                                                            <TouchableOpacity
                                                                key={item.id}
                                                                style={[
                                                                    styles.deviceItem,
                                                                    selectedDevice?.id ===
                                                                        item.id &&
                                                                        styles.deviceItemSelected,
                                                                ]}
                                                                disabled={
                                                                    isConnecting
                                                                }
                                                                onPress={() => {
                                                                    setSelectedDevice(
                                                                        item
                                                                    );
                                                                    setShowDeviceList(
                                                                        false
                                                                    );
                                                                    setErrorMessage(
                                                                        ''
                                                                    );
                                                                }}
                                                            >
                                                                <Ionicons
                                                                    name="bluetooth"
                                                                    size={22}
                                                                    color={
                                                                        BURGUNDY
                                                                    }
                                                                />

                                                                <View
                                                                    style={
                                                                        styles.deviceInfo
                                                                    }
                                                                >
                                                                    <Text
                                                                        style={
                                                                            styles.deviceName
                                                                        }
                                                                    >
                                                                        {item.name}
                                                                    </Text>
                                                                    <Text
                                                                        style={
                                                                            styles.deviceId
                                                                        }
                                                                    >
                                                                        ID:{' '}
                                                                        {item.id}
                                                                    </Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                        ))
                                                    )}
                                                </ScrollView>
                                            </LinearGradient>
                                        )}

                                        <Text style={styles.inputLabel}>
                                            كلمة المرور
                                        </Text>

                                        <LinearGradient
                                            colors={[
                                                'rgba(255,255,255,0.96)',
                                                'rgba(255,241,238,0.86)',
                                            ]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.passwordBox}
                                        >
                                            <Ionicons
                                                name="lock-closed-outline"
                                                size={22}
                                                color="#7C6A6A"
                                            />

                                            <TextInput
                                                style={styles.passwordInput}
                                                placeholder="اكتبي كلمة المرور"
                                                placeholderTextColor="#7C6A6A"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry
                                                textAlign="right"
                                            />
                                        </LinearGradient>

                                        {!!errorMessage && (
                                            <View style={styles.messageBoxError}>
                                                <Ionicons
                                                    name="alert-circle"
                                                    size={18}
                                                    color="#D32F2F"
                                                />
                                                <Text style={styles.errorText}>
                                                    {errorMessage}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.connectButtonWrapper,
                                            (!selectedDevice || isConnecting) &&
                                                styles.disabledButton,
                                        ]}
                                        disabled={!selectedDevice || isConnecting}
                                        activeOpacity={0.9}
                                        onPress={handleConnectDevice}
                                    >
                                        <LinearGradient
                                            colors={[
                                                'rgba(139, 26, 23, 0.98)',
                                                'rgba(110, 20, 17, 0.98)',
                                            ]}
                                            start={{ x: 0.2, y: 0 }}
                                            end={{ x: 0.8, y: 1 }}
                                            style={styles.connectGradient}
                                        >
                                            <View style={styles.connectGlassTop} />

                                            {isConnecting ? (
                                                <View style={styles.connectingRow}>
                                                    <ActivityIndicator
                                                        color="#FFFFFF"
                                                    />
                                                    <Text
                                                        style={
                                                            styles.connectButtonText
                                                        }
                                                    >
                                                        جاري الربط...
                                                    </Text>
                                                </View>
                                            ) : (
                                                <Text
                                                    style={
                                                        styles.connectButtonText
                                                    }
                                                >
                                                    ربط الجهاز
                                                </Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </Animated.View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    state: 'current' | 'completed';
}) {
    const isCurrent = state === 'current';

    return (
        <View style={styles.stepItem}>
            <LinearGradient
                colors={[
                    'rgba(139, 26, 23, 0.98)',
                    'rgba(110, 20, 17, 0.98)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.stepCircle,
                    isCurrent && styles.stepCircleCurrent,
                ]}
            >
                <MaterialCommunityIcons
                    name={iconName}
                    size={24}
                    color="#FFFFFF"
                />
            </LinearGradient>

            <Text style={styles.stepLabelActive}>{label}</Text>
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

    keyboardAvoidingView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
    },

    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: height * 0.055,
        paddingBottom: 18,
    },

    // زر الرجوع
    backButtonWrapper: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginLeft: 6,
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

    stepLabelActive: {
        marginTop: 7,
        fontSize: 12,
        color: BURGUNDY,
        fontWeight: '900',
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
        width: '100%',
    },

    card: {
        width: '100%',
        minHeight: 470,
        borderWidth: 1.2,
        borderColor: 'rgba(135, 27, 23, 0.14)',
        borderRadius: 28,
        paddingHorizontal: 22,
        paddingTop: 26,
        paddingBottom: 18,
        justifyContent: 'space-between',

        shadowColor: BURGUNDY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
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

    formArea: {
        width: '100%',
        marginTop: 30,
    },

    inputLabel: {
        fontSize: 13,
        color: TEXT_MUTED,
        fontWeight: '700',
        textAlign: 'right',
        marginBottom: 8,
    },

    deviceSelectBox: {
        width: '100%',
        height: 58,
        borderRadius: 29,
        borderWidth: 1.2,
        borderColor: 'rgba(135, 27, 23, 0.16)',
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,

        shadowColor: BURGUNDY,
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
        elevation: 3,
    },

    deviceSelectText: {
        flex: 1,
        fontSize: 16,
        color: TEXT_DARK,
        fontWeight: '800',
        textAlign: 'right',
    },

    dropdownBox: {
        width: '100%',
        maxHeight: 180,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(135, 27, 23, 0.14)',
        marginTop: -10,
        marginBottom: 16,
        overflow: 'hidden',

        shadowColor: BURGUNDY,
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 3,
    },

    loadingRow: {
        minHeight: 46,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    loadingText: {
        color: TEXT_MUTED,
        fontSize: 13,
        fontWeight: '700',
    },

    deviceList: {
        maxHeight: 165,
    },

    emptyBox: {
        minHeight: 70,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 14,
    },

    emptyText: {
        color: TEXT_MUTED,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },

    deviceItem: {
        minHeight: 58,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(135, 27, 23, 0.08)',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 10,
    },

    deviceItemSelected: {
        backgroundColor: 'rgba(135, 27, 23, 0.07)',
    },

    deviceInfo: {
        flex: 1,
    },

    deviceName: {
        fontSize: 14.5,
        color: TEXT_DARK,
        fontWeight: '800',
        textAlign: 'right',
    },

    deviceId: {
        marginTop: 3,
        fontSize: 10.5,
        color: '#9A8A8A',
        textAlign: 'right',
    },

    passwordBox: {
        width: '100%',
        height: 58,
        borderRadius: 29,
        borderWidth: 1.2,
        borderColor: 'rgba(135, 27, 23, 0.16)',
        paddingHorizontal: 18,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 12,

        shadowColor: BURGUNDY,
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
        elevation: 3,
    },

    passwordInput: {
        flex: 1,
        fontSize: 16,
        color: TEXT_DARK,
        fontWeight: '600',
        paddingVertical: 0,
        marginRight: 10,
    },

    messageBoxError: {
        width: '100%',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: 'rgba(211, 47, 47, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(211, 47, 47, 0.14)',
        gap: 7,
        marginTop: 4,
    },

    errorText: {
        flex: 1,
        color: '#D32F2F',
        fontSize: 13,
        textAlign: 'right',
        lineHeight: 20,
        fontWeight: '700',
    },

    // زر ربط الجهاز
    connectButtonWrapper: {
        width: '100%',
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',
        marginTop: 28,

        shadowColor: BURGUNDY_DARK,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 6,
    },

    disabledButton: {
        opacity: 0.55,
    },

    connectGradient: {
        flex: 1,
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    connectGlassTop: {
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

    connectingRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        zIndex: 5,
    },

    connectButtonText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '800',
        zIndex: 5,
    },
});