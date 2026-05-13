import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  ScrollView,
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

const COLORS = {
  screenBackground: "#FFFFFF",

  primary: "#9A211C",
  primaryDark: "#761713",
  title: "#7B1714",

  textDark: "#2C2C2C",
  textMuted: "#6C5B58",

  grayText: "#8E8E8E",
  borderGray: "rgba(210,210,210,0.95)",
  softGray: "#EFEFEF",

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
    title: "ابدئي ربط القطعة",
    subtitle:
      "اتّبعي الخطوات التالية لتجهيز القطعة وربطها بالتطبيق بطريقة سهلة وآمنة.",
    icon: "cellphone-cog" as keyof typeof MaterialCommunityIcons.glyphMap,
    instructions: ["جهّزي القطعة والسيارة", "اختاري اتصال البلوتوث"],
    buttonText: "التالي",
  },

  2: {
    title: "جهّزي القطعة",
    subtitle:
      "ابدئي بتجهيز السيارة والقطعة حتى يتمكن التطبيق من التعرف عليها قبل اختيار طريقة الاتصال.",
    icon: "car-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
    instructions: [
      "شغّلي السيارة",
      "ركّبي القطعة في مدخل OBD",
      "انتظري حتى تضيء لمبة القطعة",
    ],
    buttonText: "تم توصيل القطعة",
  },

  3: {
    title: "اختاري اتصال البلوتوث",
    subtitle:
      "اختاري جهاز OBD من الأجهزة المتاحة. بعد نجاح الربط، ينقلك تنبّه للصفحة الرئيسية ويبدأ سحب بيانات السيارة.",
    icon: "bluetooth" as keyof typeof MaterialCommunityIcons.glyphMap,
    buttonText: "ربط الجهاز",
  },
};

function isElmLikeDevice(name: string) {
  const n = name.toLowerCase();

  return (
    n.includes("elm") ||
    n.includes("obd") ||
    n.includes("vlink") ||
    n.includes("veepeak") ||
    n.includes("carista") ||
    n.includes("konnwei") ||
    n.includes("vgate")
  );
}

export default function ConnectionIntroScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const manager = elmBluetoothService.manager;
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const cardAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(1)).current;

  const stepOneAnim = useRef(new Animated.Value(0)).current;
  const stepTwoAnim = useRef(new Animated.Value(0)).current;
  const stepThreeAnim = useRef(new Animated.Value(0)).current;

  const firstLineAnim = useRef(new Animated.Value(0)).current;
  const secondLineAnim = useRef(new Animated.Value(0)).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;

  const horizontalPadding = clamp(width * 0.055, 18, 24);

  const backButtonSize = isVerySmallScreen ? 44 : 48;
  const backButtonRadius = backButtonSize / 2;

  const stepSize = isVerySmallScreen ? 46 : 50;
  const activeStepSize = isVerySmallScreen ? 54 : 58;

  const lineWidth = clamp(width * 0.14, 46, 68);

  const styles = useMemo(
    () =>
      createStyles({
        width,
        height,
        safeTop: insets.top,
        horizontalPadding,
        backButtonSize,
        backButtonRadius,
        stepSize,
        activeStepSize,
        lineWidth,
        isSmallScreen,
        isVerySmallScreen,
        currentStep,
      }),
    [
      width,
      height,
      insets.top,
      horizontalPadding,
      backButtonSize,
      backButtonRadius,
      stepSize,
      activeStepSize,
      lineWidth,
      isSmallScreen,
      isVerySmallScreen,
      currentStep,
    ]
  );

  const getBluetoothStateMessage = (state: State) => {
    if (state === State.PoweredOff) {
      return "البلوتوث مقفل. فعّليه من إعدادات الجوال ثم أعيدي المحاولة.";
    }

    if (state === State.Unauthorized) {
      return "التطبيق لا يملك صلاحية البلوتوث. فعّلي صلاحية البلوتوث للتطبيق.";
    }

    if (state === State.Unsupported) {
      return "هذا الجهاز لا يدعم نوع البلوتوث المطلوب.";
    }

    if (state === State.Resetting) {
      return "البلوتوث يعيد التشغيل الآن. انتظري ثواني ثم أعيدي المحاولة.";
    }

    return "البلوتوث غير جاهز الآن. انتظري ثواني ثم أعيدي المحاولة.";
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  };

  const startScan = async () => {
    try {
      setErrorMessage("");
      setDevices([]);
      setSelectedDevice(null);
      setShowDeviceList(true);

      const state = await manager.state();

      if (state !== State.PoweredOn) {
        setErrorMessage(getBluetoothStateMessage(state));
        return;
      }

      stopScan();
      setIsScanning(true);

      manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            setErrorMessage(
              error.message || "صار خطأ أثناء البحث عن أجهزة البلوتوث."
            );
            stopScan();
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

            const item: DeviceItem = {
              id: device.id,
              name: deviceName,
              raw: device,
            };

            if (isElmLikeDevice(deviceName)) {
              return [item, ...prev];
            }

            return [...prev, item];
          });
        }
      );

      scanTimeoutRef.current = setTimeout(stopScan, 12000);
    } catch (error: any) {
      setErrorMessage(error?.message || "تعذر تشغيل البحث عن البلوتوث.");
      stopScan();
    }
  };

  const handleSkip = () => {
    stopScan();
    router.replace("/(tabs)/home" as any);
  };

  const handleConnectDevice = async () => {
    if (!selectedDevice) {
      setErrorMessage("اختاري جهاز البلوتوث أولًا");
      return;
    }

    try {
      setIsConnecting(true);
      setErrorMessage("");
      stopScan();

      const readyDevice = await elmBluetoothService.connect(selectedDevice.id);

      console.log(
        "Connected to ELM:",
        readyDevice.name || readyDevice.localName || readyDevice.id
      );

      router.replace("/(tabs)/home" as any);

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
          "تعذر الاتصال بالقطعة. لو قطعتك ELM قديمة Bluetooth Classic فلن تظهر هنا، ولازم مكتبة Classic Bluetooth."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    cardAnim.setValue(0);
    stepOneAnim.setValue(0);
    stepTwoAnim.setValue(0);
    stepThreeAnim.setValue(0);

    Animated.parallel([
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.stagger(90, [
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
      ]),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
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
  }, [cardAnim, stepOneAnim, stepTwoAnim, stepThreeAnim, pulseAnim]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 100,
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
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.timing(secondLineAnim, {
      toValue: currentStep >= 3 ? 1 : 0,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (currentStep !== 3) {
      setShowDeviceList(false);
      setErrorMessage("");
      stopScan();
    }
  }, [currentStep, contentAnim, firstLineAnim, secondLineAnim]);

  useEffect(() => {
  const subscription = manager.onStateChange((state) => {
    if (currentStep === 3 && state === State.PoweredOn) {
      startScan();
    }

    if (currentStep === 3 && state !== State.PoweredOn) {
      setErrorMessage(getBluetoothStateMessage(state));
    }
  }, true);

  return () => {
    stopScan();
    subscription.remove();
  };
}, [currentStep]);

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

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
      router.replace("/login" as any);
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(1);
      return;
    }

    if (currentStep === 3) {
      stopScan();
      setCurrentStep(2);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.screenContent}>
          <View style={styles.backArea}>
            <TouchableOpacity
              style={styles.backButtonWrapper}
              activeOpacity={0.85}
              onPress={handleBack}
              disabled={isConnecting}
            >
              <Ionicons
                name="chevron-back"
                size={isVerySmallScreen ? 21 : 23}
                color={COLORS.grayText}
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
            ) : null}
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
                            outputRange: [0.86, 1],
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
                            outputRange: [0.86, 1],
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
                            outputRange: [0.86, 1],
                          }),
                  },
                ],
              }}
            >
              <StepItem
                label="ابدأ"
                iconName="cellphone-cog"
                active={currentStep === 1}
                completed={currentStep > 1}
                styles={styles}
              />
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: cardAnim,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,1)",
                "rgba(247,247,247,1)",
                "rgba(238,238,238,1)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.cardScrollContent}
              >
                <Animated.View
                  style={{
                    opacity: contentAnim,
                    transform: [{ translateY: contentTranslateY }],
                  }}
                >
                  <View style={styles.cardHeader}>
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,1)",
                        "rgba(232,232,232,1)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardIconCircle}
                    >
                      <MaterialCommunityIcons
                        name={stepData.icon}
                        size={isVerySmallScreen ? 29 : 32}
                        color={COLORS.primary}
                      />
                    </LinearGradient>

                    <View style={styles.headerTextBox}>
                      <Text style={styles.title}>{stepData.title}</Text>
                      <Text style={styles.subtitle}>{stepData.subtitle}</Text>
                    </View>
                  </View>

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

                <TouchableOpacity
                  style={[
                    styles.startButtonWrapper,
                    currentStep === 3 &&
                      (!selectedDevice || isConnecting) &&
                      styles.disabledButton,
                  ]}
                  activeOpacity={0.9}
                  onPress={goNext}
                  disabled={currentStep === 3 && (!selectedDevice || isConnecting)}
                >
                  <LinearGradient
                    colors={[
                      "rgba(154,33,28,0.98)",
                      "rgba(118,23,19,0.98)",
                    ]}
                    start={{ x: 0.15, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={styles.startGradient}
                  >
                    <View style={styles.startGlassTop} />

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
              </ScrollView>
            </LinearGradient>
          </Animated.View>
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
    <View style={styles.instructionsBox}>
      <InstructionRow number="1" text="جهّزي القطعة والسيارة" styles={styles} />
      <InstructionRow number="2" text="اختاري اتصال البلوتوث" styles={styles} />
    </View>
  );
}

function StepTwoContent({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <>
      <View style={styles.instructionsBox}>
        <InstructionRow number="1" text="شغّلي السيارة" styles={styles} />
        <InstructionRow number="2" text="ركّبي القطعة في مدخل OBD" styles={styles} />
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

      <View style={styles.lastInstructionBox}>
        <InstructionRow
          number="3"
          text="انتظري حتى تضيء لمبة القطعة"
          styles={styles}
        />
      </View>
    </>
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
    <View style={styles.bluetoothArea}>
      <Text style={styles.inputLabel}>الأجهزة المتاحة</Text>

      <TouchableOpacity
        style={styles.deviceSelectBox}
        activeOpacity={0.85}
        onPress={startScan}
        disabled={isConnecting}
      >
        <Ionicons name="chevron-down" size={23} color={COLORS.grayText} />

        <Text style={styles.deviceSelectText}>
          {isScanning
            ? "جاري البحث..."
            : selectedDevice
            ? selectedDevice.name
            : "اختاري الجهاز"}
        </Text>
      </TouchableOpacity>

      {showDeviceList ? (
        <View style={styles.dropdownBox}>
          {isScanning ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>جاري البحث عن الأجهزة...</Text>
            </View>
          ) : null}

          {devices.length === 0 && !isScanning ? (
            <TouchableOpacity
              style={styles.emptyBox}
              onPress={startScan}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyText}>
                ما ظهرت أجهزة. لو قطعتك ELM قديمة Bluetooth Classic فهي قد لا تظهر
                هنا بمكتبة BLE.
              </Text>
            </TouchableOpacity>
          ) : (
            devices.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.deviceItem,
                  selectedDevice?.id === item.id && styles.deviceItemSelected,
                ]}
                disabled={isConnecting}
                onPress={() => {
                  setSelectedDevice(item);
                  setShowDeviceList(false);
                  setErrorMessage("");
                }}
              >
                <Ionicons name="bluetooth" size={21} color={COLORS.primary} />

                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{item.name}</Text>
                  <Text style={styles.deviceId}>ID: {item.id}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : null}

      <Text style={styles.inputLabel}>كلمة مرور القطعة</Text>

      <View style={styles.passwordBox}>
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={COLORS.grayText}
        />

        <TextInput
          style={styles.passwordInput}
          placeholder="اختياري: 1234 أو 0000"
          placeholderTextColor="#B0B0B0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textAlign="right"
          editable={!isConnecting}
          selectionColor={COLORS.primary}
        />
      </View>

      <Text style={styles.noteText}>
        تقدرين تتخطين الصفحة. وقتها الهوم يفتح عادي، وراح يبان إن قطعة OBD غير
        متصلة.
      </Text>

      {!!errorMessage ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={COLORS.primary} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
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
  const isRed = active || completed;

  return (
    <View style={styles.stepItem}>
      <LinearGradient
        colors={
          active
            ? ["rgba(154,33,28,0.98)", "rgba(118,23,19,0.98)"]
            : completed
            ? ["rgba(154,33,28,0.14)", "rgba(154,33,28,0.08)"]
            : ["rgba(255,255,255,1)", "rgba(235,235,235,1)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.stepCircle,
          active && styles.stepCircleActive,
          completed && styles.stepCircleCompleted,
        ]}
      >
        <MaterialCommunityIcons
          name={completed ? "check" : iconName}
          size={active ? 25 : 23}
          color={active ? COLORS.white : isRed ? COLORS.primary : COLORS.grayText}
        />
      </LinearGradient>

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
      <LinearGradient
        colors={["rgba(255,255,255,1)", "rgba(235,235,235,1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.numberCircle}
      >
        <Text style={styles.numberText}>{number}</Text>
      </LinearGradient>

      <Text style={styles.instructionText}>{text}</Text>
    </View>
  );
}

function createStyles({
  width,
  height,
  safeTop,
  horizontalPadding,
  backButtonSize,
  backButtonRadius,
  stepSize,
  activeStepSize,
  lineWidth,
  isSmallScreen,
  isVerySmallScreen,
  currentStep,
}: {
  width: number;
  height: number;
  safeTop: number;
  horizontalPadding: number;
  backButtonSize: number;
  backButtonRadius: number;
  stepSize: number;
  activeStepSize: number;
  lineWidth: number;
  isSmallScreen: boolean;
  isVerySmallScreen: boolean;
  currentStep: StepNumber;
}) {
  const isStepOne = currentStep === 1;
  const isLongStep = currentStep === 2 || currentStep === 3;

  const longCardMaxHeight = isVerySmallScreen
    ? height * 0.56
    : isSmallScreen
    ? height * 0.58
    : height * 0.61;

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

    screenContent: {
      flex: 1,
      minHeight: height,
      backgroundColor: COLORS.screenBackground,
      paddingHorizontal: horizontalPadding,
      paddingTop: safeTop + 2,
      paddingBottom: isVerySmallScreen ? 22 : 30,
    },

    backArea: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isVerySmallScreen ? 22 : 28,
    },

    backButtonWrapper: {
      width: backButtonSize,
      height: backButtonSize,
      borderRadius: backButtonRadius,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.white,
      borderWidth: 1.7,
      borderColor: COLORS.borderGray,
      shadowColor: COLORS.grayText,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === "android" ? 0.16 : 0.22,
      shadowRadius: 4,
      elevation: 3,
    },

    skipButton: {
      minWidth: 64,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(154,33,28,0.07)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: "rgba(154,33,28,0.10)",
    },

    skipText: {
      color: COLORS.primary,
      fontSize: 13,
      fontWeight: "900",
    },

    stepsContainer: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "center",
      marginBottom: isVerySmallScreen ? 22 : isSmallScreen ? 26 : 30,
    },

    stepItem: {
      width: activeStepSize,
      alignItems: "center",
      justifyContent: "flex-start",
    },

    stepCircle: {
      width: stepSize,
      height: stepSize,
      borderRadius: stepSize / 2,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1.4,
      borderColor: "rgba(205,205,205,0.90)",
      shadowColor: COLORS.grayText,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: Platform.OS === "android" ? 0.10 : 0.13,
      shadowRadius: 6,
      elevation: 2,
    },

    stepCircleActive: {
      width: activeStepSize,
      height: activeStepSize,
      borderRadius: activeStepSize / 2,
      borderWidth: 0,
      shadowColor: COLORS.primaryDark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
      shadowRadius: 14,
      elevation: 6,
    },

    stepCircleCompleted: {
      borderColor: "rgba(154,33,28,0.20)",
    },

    stepLabel: {
      marginTop: 8,
      fontSize: isVerySmallScreen ? 11.5 : 12.5,
      color: COLORS.grayText,
      fontWeight: "800",
      textAlign: "center",
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
      height: 2.6,
      marginTop: stepSize / 2,
      borderRadius: 3,
      backgroundColor: "rgba(205,205,205,0.88)",
      overflow: "hidden",
      alignItems: "flex-end",
    },

    activeLineFill: {
      height: 2.6,
      borderRadius: 3,
      backgroundColor: COLORS.primary,
    },

    cardWrapper: {
      width: "100%",
      marginBottom: isLongStep ? 34 : isVerySmallScreen ? 6 : 10,
      maxHeight: isLongStep ? longCardMaxHeight : undefined,
    },

    card: {
      width: "100%",
      maxHeight: isLongStep ? longCardMaxHeight : undefined,
      borderRadius: 30,

      borderWidth: 1.4,
      borderColor: COLORS.borderGray,

      overflow: "hidden",
      shadowColor: COLORS.grayText,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.12 : 0.16,
      shadowRadius: 18,
      elevation: 4,
    },

    cardScrollContent: {
      paddingHorizontal: isVerySmallScreen ? 17 : 19,
      paddingTop: isVerySmallScreen ? 24 : 28,
      paddingBottom: isLongStep
        ? isVerySmallScreen
          ? 34
          : 42
        : isVerySmallScreen
        ? 22
        : 26,
    },

    cardHeader: {
      width: "100%",
      flexDirection: "row-reverse",
      alignItems: "flex-start",
      zIndex: 2,
    },

    cardIconCircle: {
      width: isVerySmallScreen ? 56 : 60,
      height: isVerySmallScreen ? 56 : 60,
      borderRadius: isVerySmallScreen ? 28 : 30,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 12,
      borderWidth: 1.2,
      borderColor: "rgba(205,205,205,0.95)",
      shadowColor: COLORS.grayText,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: Platform.OS === "android" ? 0.08 : 0.12,
      shadowRadius: 6,
      elevation: 2,
    },

    headerTextBox: {
      flex: 1,
      alignItems: "flex-end",
      paddingTop: 2,
    },

    title: {
      fontSize: isVerySmallScreen ? 18.5 : 20,
      fontWeight: "900",
      color: COLORS.title,
      textAlign: "right",
      marginBottom: 10,
      letterSpacing: -0.2,
    },

    subtitle: {
      fontSize: isVerySmallScreen ? 13.8 : 14.8,
      color: COLORS.textMuted,
      fontWeight: "700",
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 23 : 25,
    },

    instructionsBox: {
      width: "100%",
      alignItems: "flex-end",
      marginTop: isStepOne ? 22 : isVerySmallScreen ? 22 : 28,
      gap: isVerySmallScreen ? 12 : 15,
      zIndex: 2,
    },

    instructionRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "100%",
      paddingRight: 4,
    },

    numberCircle: {
      width: isVerySmallScreen ? 34 : 36,
      height: isVerySmallScreen ? 34 : 36,
      borderRadius: isVerySmallScreen ? 17 : 18,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 10,
      borderWidth: 1.2,
      borderColor: "rgba(205,205,205,0.95)",
      shadowColor: COLORS.grayText,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === "android" ? 0.08 : 0.12,
      shadowRadius: 5,
      elevation: 2,
    },

    numberText: {
      color: COLORS.primary,
      fontSize: isVerySmallScreen ? 16 : 17,
      fontWeight: "900",
    },

    instructionText: {
      flex: 1,
      fontSize: isVerySmallScreen ? 15.5 : 16.5,
      fontWeight: "900",
      color: COLORS.textDark,
      textAlign: "right",
      lineHeight: isVerySmallScreen ? 23 : 25,
    },

    animationBox: {
      width: "100%",
      height: isVerySmallScreen ? 170 : 215,
      justifyContent: "center",
      alignItems: "center",
      marginTop: isVerySmallScreen ? 8 : 12,
      zIndex: 2,
    },

    lottie: {
      width: isVerySmallScreen ? 185 : 225,
      height: isVerySmallScreen ? 185 : 225,
    },

    lastInstructionBox: {
      width: "100%",
      alignItems: "flex-end",
      marginTop: isVerySmallScreen ? 4 : 8,
      marginBottom: isVerySmallScreen ? 20 : 28,
      zIndex: 2,
    },

    bluetoothArea: {
      width: "100%",
      marginTop: isVerySmallScreen ? 24 : 30,
    },

    inputLabel: {
      fontSize: isVerySmallScreen ? 13 : 13.5,
      color: COLORS.grayText,
      fontWeight: "800",
      textAlign: "right",
      marginBottom: 8,
    },

    deviceSelectBox: {
      width: "100%",
      height: isVerySmallScreen ? 54 : 58,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,1)",
      borderWidth: 1.3,
      borderColor: COLORS.borderGray,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },

    deviceSelectText: {
      flex: 1,
      fontSize: isVerySmallScreen ? 15.5 : 16.5,
      color: COLORS.textDark,
      fontWeight: "900",
      textAlign: "right",
    },

    dropdownBox: {
      width: "100%",
      maxHeight: isVerySmallScreen ? 145 : 165,
      borderRadius: 18,
      borderWidth: 1.3,
      borderColor: COLORS.borderGray,
      backgroundColor: "#FFFFFF",
      marginTop: -5,
      marginBottom: 16,
      overflow: "hidden",
    },

    loadingRow: {
      minHeight: 46,
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    loadingText: {
      color: COLORS.grayText,
      fontSize: 13,
      fontWeight: "800",
    },

    emptyBox: {
      minHeight: 68,
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
    },

    deviceItem: {
      minHeight: 58,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F0F0",
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 10,
    },

    deviceItemSelected: {
      backgroundColor: "rgba(154,33,28,0.06)",
    },

    deviceInfo: {
      flex: 1,
    },

    deviceName: {
      fontSize: 14.5,
      color: COLORS.textDark,
      fontWeight: "900",
      textAlign: "right",
    },

    deviceId: {
      marginTop: 3,
      fontSize: 10.5,
      color: "#A0A0A0",
      textAlign: "right",
    },

    passwordBox: {
      width: "100%",
      height: isVerySmallScreen ? 50 : 54,
      borderRadius: 18,
      borderWidth: 1.3,
      borderColor: COLORS.borderGray,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 16,
      flexDirection: "row-reverse",
      alignItems: "center",
      marginBottom: 12,
    },

    passwordInput: {
      flex: 1,
      fontSize: 14.5,
      color: COLORS.textDark,
      fontWeight: "700",
      paddingVertical: 0,
      marginRight: 10,
    },

    noteText: {
      color: "#777777",
      fontSize: 12.5,
      textAlign: "right",
      lineHeight: 20,
      marginBottom: 10,
      fontWeight: "700",
    },

    errorBox: {
      width: "100%",
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      backgroundColor: "rgba(154,33,28,0.07)",
      borderWidth: 1,
      borderColor: "rgba(154,33,28,0.14)",
      gap: 8,
      marginTop: 4,
    },

    errorText: {
      flex: 1,
      color: COLORS.primary,
      fontSize: 13,
      textAlign: "right",
      lineHeight: 20,
      fontWeight: "800",
    },

    startButtonWrapper: {
      width: "100%",
      height: isVerySmallScreen ? 60 : 66,
      borderRadius: 33,
      overflow: "hidden",
      marginTop: isStepOne ? 24 : isVerySmallScreen ? 24 : 30,
      shadowColor: COLORS.primaryDark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === "android" ? 0.18 : 0.24,
      shadowRadius: 14,
      elevation: 6,
      backgroundColor: COLORS.primary,
      zIndex: 2,
    },

    disabledButton: {
      opacity: 0.55,
    },

    startGradient: {
      flex: 1,
      borderRadius: 33,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    startGlassTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "46%",
      borderTopLeftRadius: 33,
      borderTopRightRadius: 33,
      backgroundColor: "rgba(255,255,255,0.10)",
      zIndex: 1,
    },

    connectingRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      zIndex: 5,
    },

    startButtonText: {
      color: COLORS.white,
      textAlign: "center",
      fontSize: isVerySmallScreen ? 19 : 20.5,
      fontWeight: "900",
      zIndex: 5,
    },
  });
}