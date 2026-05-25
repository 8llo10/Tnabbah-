import React, { useEffect, useMemo, useRef, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import * as Notifications from "expo-notifications";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Device, State } from "react-native-ble-plx";
import { elmBluetoothService } from "@/services/elmBluetoothService";
import { vehicleScannerService } from "@/services/vehicleScannerService";

const START_IMAGE = require("../assets/images/obd-connection-start.png");

const COLORS = {
  screenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  title: "#8F1D1D",

  textDark: "#111111",
  textMuted: "#737373",

  grayText: "#8E8E8E",
  borderGray: "#E8E8E8",
  softGray: "#F4F4F4",

  white: "#FFFFFF",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type StepNumber = 1 | 2 | 3;

type DeviceItem = {
  id: string;
  name: string;
  raw: Device;
};

const STEPS = {
  1: {
    title: "ابدأ ربط القطعة",
    subtitle:
      "اتّبع الخطوات التالية لتجهيز قطعة OBD وربطها بالتطبيق بطريقة سهلة وآمنة.",
    icon: "cellphone-cog" as keyof typeof MaterialCommunityIcons.glyphMap,
    buttonText: "ابدأ الآن",
  },

  2: {
    title: "جهّز القطعة",
    subtitle:
      "ابدأ بتجهيز السيارة والقطعة حتى يتمكن التطبيق من التعرف عليها قبل اختيار طريقة الاتصال.",
    icon: "car-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
    buttonText: "تم توصيل القطعة",
  },

  3: {
    title: "اختار اتصال البلوتوث",
    subtitle:
      "اضغط على اختيار جهاز OBD لعرض الأجهزة القريبة، ثم اختر القطعة المناسبة.",
    icon: "bluetooth" as keyof typeof MaterialCommunityIcons.glyphMap,
    buttonText: "ربط الجهاز",
  },
};

function isElmLikeDevice(name: string) {
  const n = name.toLowerCase();

  return (
    n.includes("obd") ||
    n.includes("elm") ||
    n.includes("vlink") ||
    n.includes("veepeak") ||
    n.includes("carista") ||
    n.includes("konnwei") ||
    n.includes("vgate") ||
    n.includes("icar") ||
    n.includes("tonwon") ||
    n.includes("lelink") ||
    n.includes("bafx")
  );
}

export default function ConnectionIntroScreen() {
  const appRouter = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const manager = elmBluetoothService.manager;
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const foundDeviceCountRef = useRef(0);

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const contentAnim = useRef(new Animated.Value(1)).current;

  const stepOneAnim = useRef(new Animated.Value(0)).current;
  const stepTwoAnim = useRef(new Animated.Value(0)).current;
  const stepThreeAnim = useRef(new Animated.Value(0)).current;

  const firstLineAnim = useRef(new Animated.Value(0)).current;
  const secondLineAnim = useRef(new Animated.Value(0)).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;
  const isTablet = width >= 768;

  const horizontalPadding = clamp(width * 0.055, 20, isTablet ? 34 : 26);
  const maxContentWidth = isTablet ? clamp(width * 0.72, 520, 680) : width;

  const lineWidth = clamp(width * 0.14, 44, isTablet ? 86 : 70);
  const backIconSize = isVerySmallScreen ? 24 : 26;

  const styles = useMemo(
    () =>
      createStyles({
        width,
        height,
        safeTop: insets.top,
        safeBottom: insets.bottom,
        horizontalPadding,
        maxContentWidth,
        lineWidth,
        isSmallScreen,
        isVerySmallScreen,
        isTablet,
        currentStep,
      }),
    [
      width,
      height,
      insets.top,
      insets.bottom,
      horizontalPadding,
      maxContentWidth,
      lineWidth,
      isSmallScreen,
      isVerySmallScreen,
      isTablet,
      currentStep,
    ]
  );

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const getBluetoothStateMessage = (state: State) => {
    if (state === State.PoweredOff) {
      return "البلوتوث مقفل. فعّله من إعدادات الجوال ثم أعد المحاولة.";
    }

    if (state === State.Unauthorized) {
      return "التطبيق لا يملك صلاحية البلوتوث. فعّل صلاحية البلوتوث للتطبيق.";
    }

    if (state === State.Unsupported) {
      return "هذا الجهاز لا يدعم نوع البلوتوث المطلوب.";
    }

    if (state === State.Resetting) {
      return "البلوتوث يعيد التشغيل الآن. انتظر ثواني ثم أعد المحاولة.";
    }

    return "البلوتوث غير جاهز الآن. انتظر ثواني ثم أعد المحاولة.";
  };

  const requestAndroidBluetoothPermissions = async () => {
    if (Platform.OS !== "android") return true;

    try {
      if (Number(Platform.Version) >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const requestInitialAppPermissions = async () => {
    try {
      await Notifications.requestPermissionsAsync();

      if (Platform.OS === "android") {
        await requestAndroidBluetoothPermissions();
      }

      if (Platform.OS === "ios") {
        await manager.state();
      }
    } catch (error) {
      console.log("Initial permissions error:", error);
    }
  };

  const stopScan = (showNoDeviceMessage = false) => {
    manager.stopDeviceScan();
    setIsScanning(false);

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    if (showNoDeviceMessage && foundDeviceCountRef.current === 0) {
      setErrorMessage(
        "ما ظهرت أجهزة بلوتوث قريبة. تأكد أن القطعة مركبة ولمبتها شغالة، ثم أعد البحث."
      );
    }
  };

  const startScan = async () => {
    if (isConnecting) return;

    try {
      setErrorMessage("");
      setDevices([]);
      setSelectedDevice(null);
      setShowDeviceList(true);
      foundDeviceCountRef.current = 0;

      const hasPermission = await requestAndroidBluetoothPermissions();

      if (!hasPermission) {
        setErrorMessage("فعّل إذن البلوتوث للتطبيق حتى نقدر نبحث عن القطعة.");
        return;
      }

      let state = await manager.state();
      console.log("Bluetooth state before wait:", state);

      if (state !== State.PoweredOn) {
        await wait(1000);
        state = await manager.state();
        console.log("Bluetooth state after wait:", state);
      }

      if (state !== State.PoweredOn) {
        setErrorMessage(getBluetoothStateMessage(state));
        return;
      }

      stopScan(false);
      setIsScanning(true);

      manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error: any, device: Device | null) => {
          if (error) {
            console.log("BLE scan error:", error);
            setErrorMessage(
              error.message || "صار خطأ أثناء البحث عن أجهزة البلوتوث."
            );
            stopScan(false);
            return;
          }

          if (!device) return;

          const deviceName =
            device.name ||
            device.localName ||
            `جهاز بلوتوث ${device.id.slice(-5)}`;

          console.log("Found BLE device:", deviceName, device.id);

          setDevices((prev) => {
            const exists = prev.some((item) => item.id === device.id);
            if (exists) return prev;

            foundDeviceCountRef.current += 1;

            const item: DeviceItem = {
              id: device.id,
              name: deviceName,
              raw: device,
            };

            const updated = [...prev, item];

            return updated.sort((a, b) => {
              const aObd = isElmLikeDevice(a.name) ? 0 : 1;
              const bObd = isElmLikeDevice(b.name) ? 0 : 1;
              return aObd - bObd;
            });
          });
        }
      );

      scanTimeoutRef.current = setTimeout(() => {
        stopScan(true);
      }, 15000);
    } catch (error: any) {
      console.log("BLE start scan catch:", error);
      setErrorMessage(error?.message || "تعذر تشغيل البحث عن البلوتوث.");
      stopScan(false);
    }
  };

  const goBackToPreviousScreen = () => {
    stopScan(false);

    if (from === "settings") {
      appRouter.replace("/(tabs)/settings" as any);
      return;
    }

    if (from === "home") {
      appRouter.replace("/(tabs)/home" as any);
      return;
    }

    if (appRouter.canGoBack()) {
      appRouter.back();
      return;
    }

    appRouter.replace("/(tabs)/home" as any);
  };

  const handleSkip = () => {
    stopScan(false);
    appRouter.replace("/(tabs)/home" as any);
  };

  const handleConnectDevice = async () => {
    if (!selectedDevice) {
      setErrorMessage("اختار جهاز البلوتوث أولًا");
      return;
    }

    try {
      setIsConnecting(true);
      setErrorMessage("");
      stopScan(false);

      const readyDevice = await elmBluetoothService.connect(selectedDevice.id);

      console.log(
        "Connected to ELM:",
        readyDevice.name || readyDevice.localName || readyDevice.id
      );

      appRouter.replace("/(tabs)/home" as any);

      vehicleScannerService
        .startAutoScan({ forceFull: false })
        .catch((scanError: any) => {
          console.log("Auto scan background error:", scanError);
        });
    } catch (error: any) {
      console.log("Bluetooth connect error:", error);

      try {
        await elmBluetoothService.disconnect();
        await vehicleScannerService.stopAutoScan();
      } catch {}

      setErrorMessage(
        error?.message ||
          "تعذر الاتصال بالقطعة. قرّب الجوال من القطعة وتأكد أنها شغالة، ثم حاول مرة ثانية."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const goNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(3);
      return;
    }

    handleConnectDevice();
  };

  const handleBack = () => {
    if (isConnecting) return;

    if (currentStep === 1) {
      goBackToPreviousScreen();
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(1);
      return;
    }

    if (currentStep === 3) {
      stopScan(false);
      setCurrentStep(2);
    }
  };

  useEffect(() => {
    requestInitialAppPermissions();
  }, []);

  useEffect(() => {
    Image.resolveAssetSource(START_IMAGE);
  }, []);

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    return () => backSubscription.remove();
  }, []);

  useEffect(() => {
    stepOneAnim.setValue(0);
    stepTwoAnim.setValue(0);
    stepThreeAnim.setValue(0);
    Animated.stagger(80, [
      Animated.spring(stepOneAnim, {
        toValue: 1,
        friction: 5,
        tension: 85,
        useNativeDriver: true,
      }),
      Animated.spring(stepTwoAnim, {
        toValue: 1,
        friction: 5,
        tension: 85,
        useNativeDriver: true,
      }),
      Animated.spring(stepThreeAnim, {
        toValue: 1,
        friction: 5,
        tension: 85,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.035,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [stepOneAnim, stepTwoAnim, stepThreeAnim, pulseAnim]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(firstLineAnim, {
      toValue: currentStep >= 2 ? 1 : 0,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.timing(secondLineAnim, {
      toValue: currentStep >= 3 ? 1 : 0,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (currentStep !== 3) {
      setShowDeviceList(false);
      setSelectedDevice(null);
      setPassword("");
      setErrorMessage("");
      stopScan(false);
    }
  }, [currentStep]);

  useEffect(() => {
    const subscription = manager.onStateChange((state: State) => {
      if (currentStep === 3 && state !== State.PoweredOn) {
        setErrorMessage(getBluetoothStateMessage(state));
      }
    }, true);

    return () => {
      stopScan(false);
      subscription.remove();
    };
  }, [currentStep]);

  const contentTranslateY = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  const firstLineWidth = firstLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, lineWidth],
  });

  const secondLineWidth = secondLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, lineWidth],
  });

  const stepData = STEPS[currentStep];

  const isButtonDisabled =
    currentStep === 3 && (!selectedDevice || isConnecting);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: false }} />

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.outerContent}>
          <View style={styles.screenContent}>
            <View style={styles.topArea}>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.75}
                onPress={handleBack}
                disabled={isConnecting}
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={backIconSize}
                  color={COLORS.textDark}
                />
              </TouchableOpacity>

              {currentStep === 3 ? (
                <TouchableOpacity
                  style={styles.skipButton}
                  activeOpacity={0.85}
                  onPress={handleSkip}
                  disabled={isConnecting}
                >
                  <Text style={styles.skipText}>تخطي</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.skipPlaceholder} />
              )}
            </View>

            <View style={styles.stepsContainer}>
              <Animated.View
                style={{
                  opacity: stepThreeAnim,
                  transform: [
                    {
                      scale:
                        currentStep === 3
                          ? pulseAnim
                          : stepThreeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1],
                            }),
                    },
                  ],
                }}
              >
                <StepItem
                  label="اختر"
                  iconName="bluetooth"
                  active={currentStep === 3}
                  completed={false}
                  styles={styles}
                />
              </Animated.View>

              <View style={styles.activeLineTrack}>
                <Animated.View
                  style={[styles.activeLineFill, { width: secondLineWidth }]}
                />
              </View>

              <Animated.View
                style={{
                  opacity: stepTwoAnim,
                  transform: [
                    {
                      scale:
                        currentStep === 2
                          ? pulseAnim
                          : stepTwoAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1],
                            }),
                    },
                  ],
                }}
              >
                <StepItem
                  label="جهّز"
                  iconName="car-outline"
                  active={currentStep === 2}
                  completed={currentStep > 2}
                  styles={styles}
                />
              </Animated.View>

              <View style={styles.activeLineTrack}>
                <Animated.View
                  style={[styles.activeLineFill, { width: firstLineWidth }]}
                />
              </View>

              <Animated.View
                style={{
                  opacity: stepOneAnim,
                  transform: [
                    {
                      scale:
                        currentStep === 1
                          ? pulseAnim
                          : stepOneAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1],
                            }),
                    },
                  ],
                }}
              >
                <StepItem
                  label="إبدأ"
                  iconName="cellphone-cog"
                  active={currentStep === 1}
                  completed={currentStep > 1}
                  styles={styles}
                />
              </Animated.View>
            </View>

            <Animated.View
              style={[
                styles.contentArea,
                {
                  opacity: contentAnim,
                  transform: [{ translateY: contentTranslateY }],
                },
              ]}
            >
              <Text style={styles.title}>{stepData.title}</Text>
              <Text style={styles.subtitle}>{stepData.subtitle}</Text>

              {currentStep === 1 ? (
                <StepOneContent styles={styles} />
              ) : currentStep === 2 ? (
                <StepTwoContent styles={styles} />
              ) : (
                <BluetoothContent
                  styles={styles}
                  devices={devices}
                  isScanning={isScanning}
                  isConnecting={isConnecting}
                  selectedDevice={selectedDevice}
                  showDeviceList={showDeviceList}
                  password={password}
                  errorMessage={errorMessage}
                  startScan={startScan}
                  setSelectedDevice={setSelectedDevice}
                  setShowDeviceList={setShowDeviceList}
                  setPassword={setPassword}
                  setErrorMessage={setErrorMessage}
                />
              )}
            </Animated.View>

            <View style={styles.footerArea}>
              <TouchableOpacity
                style={[
                  styles.startButtonWrapper,
                  isButtonDisabled && styles.disabledButton,
                ]}
                activeOpacity={0.9}
                onPress={goNext}
                disabled={isButtonDisabled}
              >
                <LinearGradient
                  colors={["#9A211C", "#8F1D1D"]}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={styles.startGradient}
                >
                  {currentStep === 3 && isConnecting ? (
                    <View style={styles.connectingRow}>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={styles.startButtonText}>جاري الربط...</Text>
                    </View>
                  ) : (
                    <Text style={styles.startButtonText}>
                      {stepData.buttonText}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function StepOneContent({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.stepOneBody}>
      <Image
        source={START_IMAGE}
        style={styles.startImage}
        resizeMode="contain"
        fadeDuration={0}
        progressiveRenderingEnabled
      />
    </View>
  );
}

function StepTwoContent({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.prepareCard}>
      <View style={styles.stepTwoTopRows}>
        <InstructionRow number="1" text="شغّل السيارة" styles={styles} />

        <View style={styles.secondInstructionOffset}>
          <InstructionRow
            number="2"
            text="ركّب القطعة في مدخل OBD"
            styles={styles}
          />
        </View>
      </View>

      <View style={styles.animationBox}>
  <LottieView
    source={require("../assets/animations/connected-car.json")}
    autoPlay
    loop
    resizeMode="contain"
    style={styles.lottie}
  />
</View>

      <View style={styles.thirdInstructionOffset}>
        <InstructionRow
          number="3"
          text="انتظر حتى تضيء لمبة القطعة"
          styles={styles}
        />
      </View>
    </View>
  );
}

function BluetoothContent({
  styles,
  devices,
  isScanning,
  isConnecting,
  selectedDevice,
  showDeviceList,
  password,
  errorMessage,
  startScan,
  setSelectedDevice,
  setShowDeviceList,
  setPassword,
  setErrorMessage,
}: {
  styles: ReturnType<typeof createStyles>;
  devices: DeviceItem[];
  isScanning: boolean;
  isConnecting: boolean;
  selectedDevice: DeviceItem | null;
  showDeviceList: boolean;
  password: string;
  errorMessage: string;
  startScan: () => void;
  setSelectedDevice: (device: DeviceItem | null) => void;
  setShowDeviceList: (value: boolean) => void;
  setPassword: (value: string) => void;
  setErrorMessage: (value: string) => void;
}) {
  return (
    <View style={styles.bluetoothCard}>
      <Text style={styles.inputLabel}>الأجهزة المتاحة</Text>

      <TouchableOpacity
        style={styles.deviceSelectBox}
        activeOpacity={0.85}
        onPress={() => {
          if (showDeviceList && devices.length > 0 && !isScanning) {
            setShowDeviceList(false);
            return;
          }

          startScan();
        }}
        disabled={isConnecting}
      >
        <Ionicons
          name={showDeviceList ? "chevron-up" : "chevron-down"}
          size={22}
          color={COLORS.grayText}
        />

        <Text style={styles.deviceSelectText}>
          {isScanning
            ? "جاري البحث..."
            : selectedDevice
            ? selectedDevice.name
            : "اضغط لاختيار جهاز OBD"}
        </Text>
      </TouchableOpacity>

      {showDeviceList ? (
        <View style={styles.dropdownBox}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>
              {devices.length > 0
                ? `الأجهزة المكتشفة (${devices.length})`
                : "قائمة الأجهزة"}
            </Text>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={startScan}
              disabled={isConnecting || isScanning}
              style={styles.refreshButton}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="refresh" size={16} color={COLORS.primary} />
              )}

              <Text style={styles.refreshText}>
                {isScanning ? "بحث..." : "تحديث"}
              </Text>
            </TouchableOpacity>
          </View>

          {isScanning && devices.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>نبحث عن أجهزة قريبة...</Text>
            </View>
          ) : null}

          {!isScanning && devices.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyBox}
              onPress={startScan}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyText}>
                ما ظهرت أجهزة. تأكد أن قطعة OBD مركبة وقريبة من الجوال، ثم اضغط
                هنا لإعادة البحث.
              </Text>
            </TouchableOpacity>
          ) : (
            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              style={styles.deviceList}
              contentContainerStyle={styles.deviceListContent}
              renderItem={({ item }) => {
                const isObd = isElmLikeDevice(item.name);

                return (
                  <TouchableOpacity
                    style={[
                      styles.deviceItem,
                      selectedDevice?.id === item.id &&
                        styles.deviceItemSelected,
                    ]}
                    disabled={isConnecting}
                    onPress={() => {
                      setSelectedDevice(item);
                      setShowDeviceList(false);
                      setErrorMessage("");
                    }}
                  >
                    <View style={styles.deviceIconBox}>
                      <Feather
                        name="bluetooth"
                        size={18}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.deviceInfo}>
                      <View style={styles.deviceNameRow}>
                        {isObd ? (
                          <View style={styles.obdBadge}>
                            <Text style={styles.obdBadgeText}>OBD</Text>
                          </View>
                        ) : null}

                        <Text style={styles.deviceName}>{item.name}</Text>
                      </View>

                      <Text style={styles.deviceId}>ID: {item.id}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      ) : null}

      <Text style={styles.inputLabel}>كلمة مرور القطعة</Text>

      <View style={styles.passwordBox}>
        <Feather name="lock" size={20} color={COLORS.grayText} />

        <TextInput
          style={styles.passwordInput}
          placeholder="اختياري: 0000 أو 1234"
          placeholderTextColor="#B6B6B6"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textAlign="right"
          editable={!isConnecting}
          selectionColor={COLORS.primary}
        />
      </View>

      <Text style={styles.noteText}>
        أدخل كلمة مرور قطعة OBD نفسها. غالبًا تكون مكتوبة على القطعة أو في
        كتيّبها، مثل 0000 أو 1234.
      </Text>

      {!!errorMessage ? (
        <View style={styles.messageBox}>
          <Feather name="alert-circle" size={18} color={COLORS.primary} />
          <Text style={styles.messageText}>{errorMessage}</Text>
        </View>
      ) : (
        <View style={styles.messagePlaceholder} />
      )}
    </View>
  );
}

function StepItem({
  label,
  iconName,
  active,
  completed,
  styles,
}: {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
  completed: boolean;
  styles: ReturnType<typeof createStyles>;
}) {

  return (
    <View style={styles.stepItem}>
      <View
        style={[
          styles.stepCircle,
          active && styles.stepCircleActive,
          completed && styles.stepCircleCompleted,
        ]}
      >
        <MaterialCommunityIcons
          name={completed ? "check" : iconName}
          size={completed ? 22 : active ? 22 : 20}
          color={active || completed ? COLORS.white : COLORS.grayText}
        />
      </View>

      <Text
        style={[
          styles.stepLabel,
          active && styles.stepLabelActive,
          completed && styles.stepLabelCompleted,
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
  styles,
}: {
  number: string;
  text: string;
  styles: ReturnType<typeof createStyles>;
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

function createStyles({
  width,
  height,
  safeTop,
  safeBottom,
  horizontalPadding,
  maxContentWidth,
  lineWidth,
  isSmallScreen,
  isVerySmallScreen,
  isTablet,
  currentStep,
}: {
  width: number;
  height: number;
  safeTop: number;
  safeBottom: number;
  horizontalPadding: number;
  maxContentWidth: number;
  lineWidth: number;
  isSmallScreen: boolean;
  isVerySmallScreen: boolean;
  isTablet: boolean;
  currentStep: StepNumber;
}) {
  const stepSize = isVerySmallScreen ? 35 : 38;
  const stepItemWidth = isVerySmallScreen ? 50 : 54;

  const buttonHeight = isVerySmallScreen ? 54 : 58;
  const buttonRadius = 30;

  const topPadding = Platform.OS === "ios" ? safeTop - 18 : safeTop - 8;
  const bottomPadding = Math.max(safeBottom, isVerySmallScreen ? 8 : 12);

  const bluetoothListMaxHeight = isTablet
    ? height * 0.34
    : isVerySmallScreen
    ? height * 0.25
    : isSmallScreen
    ? height * 0.29
    : height * 0.33;

  const firstImageWidth = isTablet
    ? clamp(width * 0.56, 410, 550)
    : clamp(width * 1.02, 350, 480);

  const firstImageHeight = isTablet
    ? clamp(height * 0.49, 380, 500)
    : clamp(height * 0.49, 365, 500);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.screenBackground,
      overflow: "hidden",
    },

    safeArea: {
      flex: 1,
      backgroundColor: COLORS.screenBackground,
    },

    outerContent: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      backgroundColor: COLORS.screenBackground,
    },

    screenContent: {
      flex: 1,
      width: "100%",
      maxWidth: maxContentWidth,
      backgroundColor: COLORS.screenBackground,
      paddingHorizontal: horizontalPadding,
      paddingTop: topPadding,
      paddingBottom: bottomPadding,
    },

    topArea: {
      height: isVerySmallScreen ? 26 : 30,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 0,
    },

    backButton: {
      width: 44,
      height: 30,
      justifyContent: "center",
      alignItems: "flex-start",
    },

    skipButton: {
      minWidth: 62,
      height: 30,
      borderRadius: 15,
      backgroundColor: COLORS.softGray,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
    },

    skipText: {
      color: COLORS.primary,
      fontSize: 12.5,
      fontWeight: "900",
      includeFontPadding: false,
    },

    skipPlaceholder: {
      width: 62,
      height: 30,
    },

    stepsContainer: {
      width: "100%",
      height: isVerySmallScreen ? 46 : 50,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 20 : 26,
    },

    stepItem: {
      width: stepItemWidth,
      alignItems: "center",
      justifyContent: "flex-start",
    },

    stepCircle: {
      width: stepSize,
      height: stepSize,
      borderRadius: stepSize / 2,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.softGray,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
    },

    
    stepCircleActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
      shadowColor: COLORS.primaryDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: Platform.OS === "android" ? 0.12 : 0.18,
      shadowRadius: 10,
      elevation: 4,
    },

    stepCircleCompleted: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },

    stepLabel: {
      marginTop: 5,
      fontSize: 11,
      color: COLORS.grayText,
      fontWeight: "800",
      textAlign: "center",
      includeFontPadding: false,
    },

    stepLabelActive: {
      color: COLORS.primary,
      fontWeight: "900",
    },

    stepLabelCompleted: {
      color: COLORS.primary,
      fontWeight: "900",
    },

    activeLineTrack: {
      width: lineWidth,
      height: 2,
      marginTop: stepSize / 2,
      borderRadius: 2,
      backgroundColor: "#E4E4E4",
      overflow: "hidden",
      alignItems: "flex-end",
    },

    activeLineFill: {
      height: 2,
      borderRadius: 2,
      backgroundColor: COLORS.primary,
    },

    contentArea: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      paddingTop: currentStep === 1 ? 30 : currentStep === 3 ? 26 : 24,
    },

    title: {
      fontSize: isVerySmallScreen ? 19.5 : isTablet ? 25 : 22,
      fontWeight: "900",
      color: COLORS.title,
      textAlign: "center",
      marginTop: 0,
      marginBottom: 8,
      letterSpacing: -0.2,
      includeFontPadding: false,
    },

    subtitle: {
      width: "100%",
      fontSize: isVerySmallScreen ? 13.5 : isTablet ? 16 : 15,
      color: COLORS.textMuted,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 21 : isTablet ? 27 : 24,
      paddingHorizontal: currentStep === 3 ? 2 : 8,
      marginBottom: currentStep === 1 ? 18 : currentStep === 3 ? 16 : 12,
      includeFontPadding: false,
    },

    stepOneBody: {
      flex: 1,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: isVerySmallScreen ? 0 : 4,
    },

    startImage: {
      width: firstImageWidth,
      height: firstImageHeight,
    },

    prepareCard: {
      width: "100%",
      flex: 1,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
      backgroundColor: COLORS.white,
      paddingHorizontal: isVerySmallScreen ? 18 : isTablet ? 30 : 22,
      paddingTop: isVerySmallScreen ? 18 : 22,
      paddingBottom: isVerySmallScreen ? 14 : 18,
      justifyContent: "flex-start",
      shadowColor: COLORS.grayText,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === "android" ? 0.06 : 0.09,
      shadowRadius: 4,
      elevation: 2,
    },

    stepTwoTopRows: {
      width: "100%",
      gap: isVerySmallScreen ? 6 : 8,
      marginBottom: isVerySmallScreen ? 8 : 10,
    },

    secondInstructionOffset: {
      marginTop: isVerySmallScreen ? 3 : 5,
    },

    thirdInstructionOffset: {
      width: "100%",
      marginTop: isVerySmallScreen ? -2 : -4,
    },

    instructionRow: {
      width: "100%",
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "flex-start",
    },

    numberCircle: {
      width: isVerySmallScreen ? 33 : 36,
      height: isVerySmallScreen ? 33 : 36,
      borderRadius: isVerySmallScreen ? 16.5 : 18,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 10,
      backgroundColor: COLORS.softGray,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
    },

    numberText: {
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 16 : 17,
      fontWeight: "900",
      includeFontPadding: false,
    },

    instructionText: {
      flex: 1,
      fontSize: isVerySmallScreen ? 15 : isTablet ? 18 : 16,
      fontWeight: "900",
      color: COLORS.textDark,
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 23 : 25,
      includeFontPadding: false,
    },

    animationBox: {
      width: "100%",
      height: isVerySmallScreen ? 168 : isSmallScreen ? 195 : 225,
      justifyContent: "center",
      alignItems: "center",
      marginVertical: isVerySmallScreen ? 4 : 8,
    },

    carIconCircle: {
      width: isVerySmallScreen ? 145 : 165,
      height: isVerySmallScreen ? 145 : 165,
      borderRadius: isVerySmallScreen ? 72.5 : 82.5,
      backgroundColor: "rgba(154,33,28,0.06)",
      borderWidth: 1,
      borderColor: "rgba(154,33,28,0.12)",
      justifyContent: "center",
      alignItems: "center",
    },

    bluetoothCard: {
      width: "100%",
      flex: 1,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
      backgroundColor: COLORS.white,
      paddingHorizontal: isVerySmallScreen ? 16 : isTablet ? 26 : 20,
      paddingTop: isVerySmallScreen ? 16 : 20,
      paddingBottom: isVerySmallScreen ? 12 : 16,
      shadowColor: COLORS.grayText,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === "android" ? 0.06 : 0.09,
      shadowRadius: 4,
      elevation: 2,
    },

    inputLabel: {
      fontSize: isVerySmallScreen ? 13 : 13.5,
      color: COLORS.grayText,
      fontWeight: "800",
      textAlign: "right",
      marginBottom: 8,
      includeFontPadding: false,
    },

    deviceSelectBox: {
      width: "100%",
      height: isVerySmallScreen ? 48 : 52,
      borderRadius: 16,
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },

    deviceSelectText: {
      flex: 1,
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
      color: COLORS.textDark,
      fontWeight: "900",
      textAlign: "right",
      marginHorizontal: 8,
      includeFontPadding: false,
    },

    dropdownBox: {
      width: "100%",
      maxHeight: bluetoothListMaxHeight,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
      backgroundColor: "#FFFFFF",
      marginBottom: 12,
      overflow: "hidden",
    },

    dropdownHeader: {
      minHeight: 42,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F0F0",
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#FFFFFF",
    },

    dropdownTitle: {
      color: COLORS.textDark,
      fontSize: 13,
      fontWeight: "900",
      textAlign: "right",
      includeFontPadding: false,
    },

    refreshButton: {
      minHeight: 30,
      borderRadius: 15,
      paddingHorizontal: 10,
      backgroundColor: "rgba(154,33,28,0.06)",
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },

    refreshText: {
      color: COLORS.primary,
      fontSize: 12,
      fontWeight: "900",
      includeFontPadding: false,
    },

    loadingRow: {
      minHeight: 54,
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 12,
    },
lottie: {
  width: isVerySmallScreen ? 195 : isTablet ? 265 : 240,
  height: isVerySmallScreen ? 195 : isTablet ? 265 : 240,
},
    loadingText: {
      color: COLORS.grayText,
      fontSize: 13,
      fontWeight: "800",
      includeFontPadding: false,
    },

    emptyBox: {
      minHeight: 72,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 14,
    },

    emptyText: {
      color: "#777777",
      fontSize: 13,
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "700",
      includeFontPadding: false,
    },

    deviceList: {
      maxHeight: bluetoothListMaxHeight - 42,
    },

    deviceListContent: {
      paddingBottom: 4,
    },

    deviceItem: {
      minHeight: isVerySmallScreen ? 56 : 60,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F0F0",
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 10,
    },

    deviceItemSelected: {
      backgroundColor: "rgba(154,33,28,0.06)",
    },

    deviceIconBox: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(154,33,28,0.06)",
      borderWidth: 1,
      borderColor: "rgba(154,33,28,0.12)",
    },

    deviceInfo: {
      flex: 1,
      alignItems: "flex-end",
    },

    deviceNameRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 8,
    },

    deviceName: {
      flexShrink: 1,
      fontSize: 14.5,
      color: COLORS.textDark,
      fontWeight: "900",
      textAlign: "right",
      includeFontPadding: false,
    },

    obdBadge: {
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
      backgroundColor: "rgba(154,33,28,0.08)",
      borderWidth: 1,
      borderColor: "rgba(154,33,28,0.13)",
    },

    obdBadgeText: {
      color: COLORS.primary,
      fontSize: 10,
      fontWeight: "900",
      includeFontPadding: false,
    },

    deviceId: {
      marginTop: 4,
      fontSize: 10.5,
      color: "#A0A0A0",
      textAlign: "right",
      includeFontPadding: false,
    },

    passwordBox: {
      width: "100%",
      height: isVerySmallScreen ? 48 : 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 16,
      flexDirection: "row-reverse",
      alignItems: "center",
      marginBottom: 8,
    },

    passwordInput: {
      flex: 1,
      fontSize: isVerySmallScreen ? 14 : 14.5,
      color: COLORS.textDark,
      fontWeight: "700",
      paddingVertical: 0,
      marginRight: 10,
      includeFontPadding: false,
    },

    noteText: {
      color: "#777777",
      fontSize: isVerySmallScreen ? 11.8 : 12.2,
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 18 : 19,
      marginBottom: 7,
      fontWeight: "700",
      includeFontPadding: false,
    },

    messageBox: {
      width: "100%",
      minHeight: isVerySmallScreen ? 40 : 44,
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 16,
      backgroundColor: "rgba(154,33,28,0.07)",
      borderWidth: 1,
      borderColor: "rgba(154,33,28,0.14)",
      gap: 8,
    },

    messageText: {
      flex: 1,
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 12.5 : 13,
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 18 : 20,
      fontWeight: "800",
      includeFontPadding: false,
    },

    messagePlaceholder: {
      minHeight: isVerySmallScreen ? 40 : 44,
    },

    footerArea: {
      width: "100%",
      paddingTop: isVerySmallScreen ? 8 : 10,
    },

    startButtonWrapper: {
      width: "100%",
      height: buttonHeight,
      borderRadius: buttonRadius,
      overflow: "hidden",
      shadowColor: COLORS.primaryDark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
      shadowRadius: 14,
      elevation: 6,
      backgroundColor: COLORS.primary,
    },

    disabledButton: {
      opacity: 0.55,
    },

    startGradient: {
      flex: 1,
      borderRadius: buttonRadius,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    connectingRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },

    startButtonText: {
      color: COLORS.white,
      textAlign: "center",
      fontSize: isVerySmallScreen ? 18 : 19.5,
      fontWeight: "900",
      includeFontPadding: false,
    },
  });
}
