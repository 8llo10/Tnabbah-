import React, { useEffect, useMemo, useRef, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { Image as ExpoImage } from "expo-image";
import * as Notifications from "expo-notifications";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  FlatList,
  Image as RNImage,
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
import {
  Alexandria_400Regular,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/alexandria";
import { Device, State } from "react-native-ble-plx";
import { elmBluetoothService } from "@/services/elmBluetoothService";
import { vehicleScannerService } from "@/services/vehicleScannerService";
import { useLanguage } from "../providers/LanguageProvider";
import { useAppSettings } from "../providers/AppSettingsProvider";

const START_IMAGE_LIGHT = require("../assets/images/obd-connection-start-light.png");
const START_IMAGE_DARK = require("../assets/images/obd-connection-start-dark.png");

const LIGHT_COLORS = {
  screenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  title: "#9A211C",

  textDark: "#111111",
  textMuted: "#737373",

  grayText: "#8E8E8E",
  borderGray: "#E8E8E8",
  softGray: "#F4F4F4",
  card: "#FFFFFF",
  dropdown: "#FFFFFF",
  lineTrack: "#E4E4E4",
  subtleBorder: "#F0F0F0",
  placeholder: "#B6B6B6",
  mutedBoxText: "#777777",
  primarySoft: "rgba(154,33,28,0.06)",
  primarySoftStrong: "rgba(154,33,28,0.08)",
  primarySoftBorder: "rgba(154,33,28,0.14)",
  primarySoftBorderLight: "rgba(154,33,28,0.12)",
  white: "#FFFFFF",
  statusBar: "dark-content" as const,
};

const DARK_COLORS = {
  screenBackground: "#151515",

  primary: "#B63A34",
  primaryDark: "#871B17",
  title: "#B63A34",

  textDark: "#FFFFFF",
  textMuted: "#C7C7C7",

  grayText: "#B8B8B8",
  borderGray: "#383838",
  softGray: "#292929",
  card: "#202020",
  dropdown: "#202020",
  lineTrack: "#3A3A3A",
  subtleBorder: "#333333",
  placeholder: "#8E8E8E",
  mutedBoxText: "#C7C7C7",
  primarySoft: "rgba(182,58,52,0.16)",
  primarySoftStrong: "rgba(182,58,52,0.20)",
  primarySoftBorder: "rgba(182,58,52,0.28)",
  primarySoftBorderLight: "rgba(182,58,52,0.22)",

  error: "#EF7676",
  errorSoft: "rgba(239,118,118,0.10)",
  errorBorder: "rgba(239,118,118,0.45)",

  white: "#FFFFFF",
  statusBar: "light-content" as const,
};

type AppColors = typeof LIGHT_COLORS | typeof DARK_COLORS;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const FONT_REGULAR = "Alexandria_400Regular";
const FONT_SEMIBOLD = "Alexandria_600SemiBold";
const FONT_BOLD = "Alexandria_700Bold";
const FONT_EXTRABOLD = "Alexandria_800ExtraBold";

type StepNumber = 1 | 2 | 3;

type DeviceItem = {
  id: string;
  name: string;
  raw: Device;
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
  const { t, isArabic } = useLanguage();
  const { darkModeEnabled } = useAppSettings();
  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    Alexandria_800ExtraBold,
  });

  const COLORS = darkModeEnabled ? DARK_COLORS : LIGHT_COLORS;

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

  const steps = useMemo(
    () => ({
      1: {
        title: t.connectionStep1Title,
        subtitle: t.connectionStep1Subtitle,
        icon: "cellphone-cog" as keyof typeof MaterialCommunityIcons.glyphMap,
        buttonText: t.connectionStep1Button,
      },
      2: {
        title: t.connectionStep2Title,
        subtitle: t.connectionStep2Subtitle,
        icon: "car-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
        buttonText: t.connectionStep2Button,
      },
      3: {
        title: t.connectionStep3Title,
        subtitle: t.connectionStep3Subtitle,
        icon: "bluetooth" as keyof typeof MaterialCommunityIcons.glyphMap,
        buttonText: t.connectionStep3Button,
      },
    }),
    [t]
  );

  const styles = useMemo(
    () =>
      createStyles({
        COLORS,
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
        isArabic,
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
      isArabic,
      darkModeEnabled,
    ]
  );

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const getBluetoothStateMessage = (state: State) => {
    if (state === State.PoweredOff) {
      return t.connectionBluetoothOff;
    }

    if (state === State.Unauthorized) {
      return t.connectionBluetoothUnauthorized;
    }

    if (state === State.Unsupported) {
      return t.connectionBluetoothUnsupported;
    }

    if (state === State.Resetting) {
      return t.connectionBluetoothResetting;
    }

    return t.connectionBluetoothNotReady;
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
      setErrorMessage(t.connectionNoBluetoothDevices);
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
        setErrorMessage(t.connectionBluetoothPermission);
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
            setErrorMessage(error.message || t.connectionScanError);
            stopScan(false);
            return;
          }

          if (!device) return;

          const deviceName =
            device.name ||
            device.localName ||
            `${t.connectionBluetoothDeviceFallback} ${device.id.slice(-5)}`;

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
      setErrorMessage(error?.message || t.connectionScanStartError);
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
      setErrorMessage(t.connectionSelectDeviceFirst);
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
      } catch { }

      setErrorMessage(error?.message || t.connectionConnectError);
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
    // تحميل الصورتين من البداية عشان ما يكون فيه تأخير عند تبديل الوضع
    RNImage.resolveAssetSource(START_IMAGE_LIGHT);
    RNImage.resolveAssetSource(START_IMAGE_DARK);
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
    outputRange: ["0%", "100%"],
  });

  const secondLineWidth = secondLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const stepData = steps[currentStep];

  const isButtonDisabled =
    currentStep === 3 && (!selectedDevice || isConnecting);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: false }} />

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={COLORS.statusBar}
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
                  name={isArabic ? "arrow-forward-outline" : "arrow-back-outline"}
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
                  <Text style={styles.skipText} allowFontScaling={false}>{t.connectionSkip}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.skipPlaceholder} />
              )}
            </View>

            <View style={styles.stepsContainer}>
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
                  label={t.connectionStepStartLabel}
                  iconName="cellphone-cog"
                  active={currentStep === 1}
                  completed={currentStep > 1}
                  styles={styles}
                  COLORS={COLORS}
                />
              </Animated.View>

              <View style={styles.activeLineTrack}>
                <Animated.View
                  style={[styles.activeLineFill, { width: firstLineWidth }]}
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
                  label={t.connectionStepPrepareLabel}
                  iconName="car-outline"
                  active={currentStep === 2}
                  completed={currentStep > 2}
                  styles={styles}
                  COLORS={COLORS}
                />
              </Animated.View>

              <View style={styles.activeLineTrack}>
                <Animated.View
                  style={[styles.activeLineFill, { width: secondLineWidth }]}
                />
              </View>

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
                  label={t.connectionStepChooseLabel}
                  iconName="bluetooth"
                  active={currentStep === 3}
                  completed={false}
                  styles={styles}
                  COLORS={COLORS}
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
              <Text style={styles.title} allowFontScaling={false}>{stepData.title}</Text>
              <Text style={styles.subtitle} allowFontScaling={false}>{stepData.subtitle}</Text>

              {currentStep === 1 ? (
                <StepOneContent styles={styles} darkModeEnabled={darkModeEnabled} />
              ) : currentStep === 2 ? (
                <StepTwoContent styles={styles} t={t} COLORS={COLORS} />
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
                  t={t}
                  COLORS={COLORS}
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
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={styles.startGradient}
                >
                  <View style={styles.startButtonShine} />

                  {currentStep === 3 && isConnecting ? (
                    <View style={styles.connectingRow}>
                      <ActivityIndicator color={COLORS.white} />
                      <Text style={styles.startButtonText} allowFontScaling={false}>
                        {t.connectionConnecting}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.startButtonText} allowFontScaling={false}>
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
  darkModeEnabled,
}: {
  styles: ReturnType<typeof createStyles>;
  darkModeEnabled: boolean;
}) {
  return (
    <View style={styles.stepOneBody}>
      <View style={styles.startImageFrame}>
        <ExpoImage
          source={START_IMAGE_LIGHT}
          style={[
            styles.startImage,
            styles.startImageLayer,
            styles.startImageLightAdjust,
            { opacity: darkModeEnabled ? 0 : 1 },
          ]}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
        />

        <ExpoImage
          source={START_IMAGE_DARK}
          style={[
            styles.startImage,
            styles.startImageLayer,
            styles.startImageDarkAdjust,
            {
              opacity: darkModeEnabled ? 1 : 0,
            },
          ]}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
        />
      </View>
    </View>
  );
}

function StepTwoContent({
  styles,
  t,
  COLORS,
}: {
  styles: ReturnType<typeof createStyles>;
  t: any;
  COLORS: AppColors;
}) {
  return (
    <View style={styles.prepareCard}>
      <View style={styles.stepTwoTopRows}>
        <InstructionRow
          number="1"
          text={t.connectionInstructionStartCar}
          styles={styles}
          COLORS={COLORS}
        />

        <View style={styles.secondInstructionOffset}>
          <InstructionRow
            number="2"
            text={t.connectionInstructionPlugObd}
            styles={styles}
            COLORS={COLORS}
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
          text={t.connectionInstructionWaitLight}
          styles={styles}
          COLORS={COLORS}
        />
      </View>
    </View>
  );
}

function BluetoothContent({
  styles,
  COLORS,
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
  t,
}: {
  styles: ReturnType<typeof createStyles>;
  COLORS: AppColors;
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
  t: any;
}) {
  return (
    <View style={styles.bluetoothCard}>
      <Text style={styles.inputLabel} allowFontScaling={false}>{t.connectionAvailableDevices}</Text>

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

        <Text style={styles.deviceSelectText} allowFontScaling={false}>
          {isScanning
            ? t.connectionSearching
            : selectedDevice
              ? selectedDevice.name
              : t.connectionSelectObdDevice}
        </Text>
      </TouchableOpacity>

      {showDeviceList ? (
        <View style={styles.dropdownBox}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle} allowFontScaling={false}>
              {devices.length > 0
                ? `${t.connectionDiscoveredDevices} (${devices.length})`
                : t.connectionDeviceList}
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

              <Text style={styles.refreshText} allowFontScaling={false}>
                {isScanning
                  ? t.connectionRefreshSearching
                  : t.connectionRefresh}
              </Text>
            </TouchableOpacity>
          </View>

          {isScanning && devices.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText} allowFontScaling={false}>
                {t.connectionSearchingNearby}
              </Text>
            </View>
          ) : null}

          {!isScanning && devices.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyBox}
              onPress={startScan}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyText} allowFontScaling={false}>{t.connectionNoDevicesFound}</Text>
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
                            <Text style={styles.obdBadgeText} allowFontScaling={false}>OBD</Text>
                          </View>
                        ) : null}

                        <Text style={styles.deviceName} allowFontScaling={false}>{item.name}</Text>
                      </View>

                      <Text style={styles.deviceId} allowFontScaling={false}>
                        {t.connectionDeviceId}: {item.id}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      ) : null}

      <Text style={styles.inputLabel} allowFontScaling={false}>{t.connectionObdPassword}</Text>

      <View style={styles.passwordBox}>
        <Feather name="lock" size={20} color={COLORS.grayText} />

        <TextInput
          allowFontScaling={false}
          style={styles.passwordInput}
          placeholder={t.connectionObdPasswordPlaceholder}
          placeholderTextColor={COLORS.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textAlign="right"
          editable={!isConnecting}
          selectionColor={COLORS.primary}
        />
      </View>

      <Text style={styles.noteText} allowFontScaling={false}>{t.connectionObdPasswordNote}</Text>

      {!!errorMessage ? (
        <View style={styles.messageBox}>
          <Feather name="alert-circle" size={18} color={"error" in COLORS ? COLORS.error : COLORS.primary} />
          <Text style={styles.messageText} allowFontScaling={false}>{errorMessage}</Text>
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
  COLORS,
}: {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
  completed: boolean;
  styles: ReturnType<typeof createStyles>;
  COLORS: AppColors;
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
        allowFontScaling={false}>
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
  COLORS: AppColors;
}) {
  return (
    <View style={styles.instructionRow}>
      <View style={styles.numberCircle}>
        <Text style={styles.numberText} allowFontScaling={false}>{number}</Text>
      </View>

      <Text style={styles.instructionText} allowFontScaling={false}>{text}</Text>
    </View>
  );
}

function createStyles({
  COLORS,
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
  isArabic,
}: {
  COLORS: AppColors;
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
  isArabic: boolean;
}) {
  const stepSize = isVerySmallScreen ? 35 : 38;
  const stepItemWidth = isVerySmallScreen ? 50 : 54;

  const buttonHeight = isVerySmallScreen ? 54 : 58;
  const buttonRadius = 34;

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
    ? clamp(width * 0.72, 500, 680)
    : clamp(width * 1.18, 420, 590);

  const firstImageHeight = isTablet
    ? clamp(height * 0.56, 430, 600)
    : clamp(height * 0.52, 390, 550);

  // صورة اللايت مود أصلها داخل الملف نازلة أكثر من الدارك مود،
  // لذلك نرفعها فقط بدون ما نغير مكان صورة الدارك.
  const lightImageTranslateY = isTablet
    ? -34
    : isVerySmallScreen
      ? -24
      : isSmallScreen
        ? -28
        : -32;

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
      height: isVerySmallScreen ? 34 : 38,
      width: "100%",
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 0,
    },

    backButton: {
      width: 44,
      height: 34,
      justifyContent: "center",
      alignItems: isArabic ? "flex-end" : "flex-start",
    },

    skipButton: {
      minWidth: 72,
      height: 34,
      borderRadius: 17,
      backgroundColor: COLORS.softGray,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "ios" ? 1 : 0,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
    },

    skipText: {
      color: COLORS.primary,
      fontSize: 12.5,
      lineHeight: 22,
      fontFamily: FONT_EXTRABOLD,
      includeFontPadding: true,
      textAlign: "center",
      textAlignVertical: "center",
      paddingBottom: Platform.OS === "ios" ? 1 : 0,
    },

    skipPlaceholder: {
      width: 72,
      height: 34,
    },

    stepsContainer: {
      width: "100%",
      height: isVerySmallScreen ? 54 : 60,
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginTop: isVerySmallScreen ? 10 : 14,
      marginBottom: isVerySmallScreen ? 18 : 24,
      paddingHorizontal: 0,
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
      fontFamily: FONT_SEMIBOLD,
      textAlign: "center",
      includeFontPadding: false,
    },

    stepLabelActive: {
      color: COLORS.primary,
      fontFamily: FONT_EXTRABOLD,
    },

    stepLabelCompleted: {
      color: COLORS.primary,
      fontFamily: FONT_EXTRABOLD,
    },

    activeLineTrack: {
      flex: 1,
      height: 2,
      marginTop: stepSize / 2,
      marginHorizontal: isVerySmallScreen ? 2 : 4,
      borderRadius: 2,
      backgroundColor: COLORS.lineTrack,
      overflow: "hidden",
      // Arabic: fill from right to left. English: fill from left to right.
      alignItems: isArabic ? "flex-end" : "flex-start",
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
      paddingTop: currentStep === 1 ? 24 : currentStep === 3 ? 26 : 24,
    },

    title: {
      fontSize: isVerySmallScreen ? 19.5 : isTablet ? 25 : 22,
      fontFamily: FONT_EXTRABOLD,
      color: COLORS.title,
      textAlign: "center",
      marginTop: 0,
      marginBottom: 8,
      letterSpacing: -0.2,
      lineHeight: isVerySmallScreen ? 28 : isTablet ? 35 : 31,
      includeFontPadding: true,
      paddingTop: 2,
      paddingBottom: 2,
    },

    subtitle: {
      width: "100%",
      fontSize: isVerySmallScreen ? 13 : isTablet ? 15.4 : 14.2,
      color: COLORS.textMuted,
      fontFamily: FONT_SEMIBOLD,
      textAlign: "center",
      lineHeight: isVerySmallScreen ? 25 : isTablet ? 31 : 28,
      paddingHorizontal: currentStep === 3 ? 2 : 14,
      paddingTop: 3,
      paddingBottom: 10,
      marginBottom: currentStep === 1 ? 4 : currentStep === 3 ? 14 : 10,
      includeFontPadding: true,
    },

    stepOneBody: {
      flex: 1,
      width: "100%",
      justifyContent: "flex-start",
      alignItems: "center",
      paddingTop: isVerySmallScreen ? 0 : 4,
      paddingBottom: isVerySmallScreen ? 0 : 4,
    },

    startImageFrame: {
      width: firstImageWidth,
      height: firstImageHeight,
      alignItems: "center",
      justifyContent: "center",
    },

    startImage: {
      width: firstImageWidth,
      height: firstImageHeight,
    },

    startImageLayer: {
      position: "absolute",
      top: 0,
      left: 0,
    },

    startImageLightAdjust: {
      transform: [
        { translateY: lightImageTranslateY },
        { scale: isTablet ? 0.9 : 0.86 },
      ],
    },

    startImageDarkAdjust: {
      transform: [{ scale: isTablet ? 1.06 : 1.08 }],
    },

    prepareCard: {
      width: "100%",
      flex: 1,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
      backgroundColor: COLORS.card,
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
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "flex-start",
    },

    numberCircle: {
      width: isVerySmallScreen ? 33 : 36,
      height: isVerySmallScreen ? 33 : 36,
      borderRadius: isVerySmallScreen ? 16.5 : 18,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: isArabic ? 10 : 0,
      marginRight: isArabic ? 0 : 10,
      backgroundColor: COLORS.softGray,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
    },

    numberText: {
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 16 : 17,
      fontFamily: FONT_EXTRABOLD,
      includeFontPadding: false,
    },

    instructionText: {
      flex: 1,
      fontSize: isVerySmallScreen ? 15 : isTablet ? 18 : 16,
      fontFamily: FONT_EXTRABOLD,
      color: COLORS.textDark,
      textAlign: isArabic ? "right" : "left",
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

    lottie: {
      width: isVerySmallScreen ? 195 : isTablet ? 265 : 240,
      height: isVerySmallScreen ? 195 : isTablet ? 265 : 240,
    },

    bluetoothCard: {
      width: "100%",
      flex: 1,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
      backgroundColor: COLORS.card,
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
      fontFamily: FONT_SEMIBOLD,
      textAlign: isArabic ? "right" : "left",
      marginBottom: 8,
      includeFontPadding: false,
    },

    deviceSelectBox: {
      width: "100%",
      height: isVerySmallScreen ? 48 : 52,
      borderRadius: 16,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
      paddingHorizontal: 16,
      flexDirection: isArabic ? "row" : "row-reverse",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },

    deviceSelectText: {
      flex: 1,
      fontSize: isVerySmallScreen ? 14.5 : 15.5,
      color: COLORS.textDark,
      fontFamily: FONT_EXTRABOLD,
      textAlign: isArabic ? "right" : "left",
      marginHorizontal: 8,
      includeFontPadding: false,
    },

    dropdownBox: {
      width: "100%",
      maxHeight: bluetoothListMaxHeight,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
      backgroundColor: COLORS.dropdown,
      marginBottom: 12,
      overflow: "hidden",
    },

    dropdownHeader: {
      minHeight: 42,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.subtleBorder,
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: COLORS.dropdown,
    },

    dropdownTitle: {
      color: COLORS.textDark,
      fontSize: 13,
      fontFamily: FONT_EXTRABOLD,
      textAlign: isArabic ? "right" : "left",
      includeFontPadding: false,
    },

    refreshButton: {
      minHeight: 30,
      borderRadius: 15,
      paddingHorizontal: 10,
      backgroundColor: COLORS.primarySoft,
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },

    refreshText: {
      color: COLORS.primary,
      fontSize: 12,
      fontFamily: FONT_EXTRABOLD,
      includeFontPadding: false,
    },

    loadingRow: {
      minHeight: 54,
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 12,
    },

    loadingText: {
      color: COLORS.grayText,
      fontSize: 13,
      fontFamily: FONT_SEMIBOLD,
      includeFontPadding: false,
    },

    emptyBox: {
      minHeight: 72,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 14,
    },

    emptyText: {
      color: COLORS.mutedBoxText,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 20,
      fontFamily: FONT_SEMIBOLD,
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
      borderBottomColor: COLORS.subtleBorder,
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "center",
      gap: 10,
    },

    deviceItemSelected: {
      backgroundColor: COLORS.primarySoft,
    },

    deviceIconBox: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.primarySoft,
      borderWidth: 1,
      borderColor: COLORS.primarySoftBorderLight,
    },

    deviceInfo: {
      flex: 1,
      alignItems: isArabic ? "flex-end" : "flex-start",
    },

    deviceNameRow: {
      width: "100%",
      flexDirection: isArabic ? "row" : "row-reverse",
      alignItems: "center",
      justifyContent: isArabic ? "flex-end" : "flex-start",
      gap: 8,
    },

    deviceName: {
      flexShrink: 1,
      fontSize: 14.5,
      color: COLORS.textDark,
      fontFamily: FONT_EXTRABOLD,
      textAlign: isArabic ? "right" : "left",
      includeFontPadding: false,
    },

    obdBadge: {
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
      backgroundColor: COLORS.primarySoftStrong,
      borderWidth: 1,
      borderColor: COLORS.primarySoftBorderLight,
    },

    obdBadgeText: {
      color: COLORS.primary,
      fontSize: 10,
      fontFamily: FONT_EXTRABOLD,
      includeFontPadding: false,
    },

    deviceId: {
      marginTop: 4,
      fontSize: 10.5,
      color: "#A0A0A0",
      textAlign: isArabic ? "right" : "left",
      includeFontPadding: false,
    },

    passwordBox: {
      width: "100%",
      height: isVerySmallScreen ? 48 : 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.borderGray,
      backgroundColor: COLORS.dropdown,
      paddingHorizontal: 16,
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 8,
    },

    passwordInput: {
      flex: 1,
      fontSize: isVerySmallScreen ? 14 : 14.5,
      color: COLORS.textDark,
      fontFamily: FONT_SEMIBOLD,
      paddingVertical: 0,
      marginRight: isArabic ? 10 : 0,
      marginLeft: isArabic ? 0 : 10,
      includeFontPadding: false,
    },

    noteText: {
      color: COLORS.mutedBoxText,
      fontSize: isVerySmallScreen ? 11.8 : 12.2,
      textAlign: isArabic ? "right" : "left",
      lineHeight: isVerySmallScreen ? 18 : 19,
      marginBottom: 7,
      fontFamily: FONT_SEMIBOLD,
      includeFontPadding: false,
    },

    messageBox: {
      width: "100%",
      minHeight: isVerySmallScreen ? 40 : 44,
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 16,
      backgroundColor: "errorSoft" in COLORS ? COLORS.errorSoft : COLORS.primarySoft,
      borderWidth: 1,
      borderColor: "errorBorder" in COLORS ? COLORS.errorBorder : COLORS.primarySoftBorder,
      gap: 8,
    },

    messageText: {
      flex: 1,
      color: "error" in COLORS ? COLORS.error : COLORS.primary,
      fontSize: isVerySmallScreen ? 12.5 : 13,
      textAlign: isArabic ? "right" : "left",
      lineHeight: isVerySmallScreen ? 18 : 20,
      fontFamily: FONT_SEMIBOLD,
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

    startButtonShine: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "48%",
      borderTopLeftRadius: buttonRadius,
      borderTopRightRadius: buttonRadius,
      backgroundColor: "rgba(255,255,255,0.10)",
      zIndex: 1,
    },

    connectingRow: {
      flexDirection: isArabic ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      zIndex: 5,
    },

    startButtonText: {
      fontFamily: FONT_EXTRABOLD,
      color: COLORS.white,
      textAlign: "center",
      fontSize: isVerySmallScreen ? 17.4 : 18.4,
      lineHeight: isVerySmallScreen ? 28 : 30,
      letterSpacing: -0.15,
      textAlignVertical: "center",
      includeFontPadding: false,
      paddingTop: Platform.OS === "ios" ? 1 : 0,
      paddingBottom: Platform.OS === "ios" ? 1 : 0,
      zIndex: 5,
    },
  });
}