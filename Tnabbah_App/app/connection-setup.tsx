import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

const BURGUNDY = "#971B1B";
const BURGUNDY_LIGHT = "#9A3A33";
const BURGUNDY_DARK = "#5F130F";

const DARK_TEXT = "#111111";
const GRAY_TEXT = "#9A9A9A";
const LIGHT_GRAY = "#EFEFEF";
const LINE_GRAY = "#E3E3E3";

export default function ConnectionSetupScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* زر الرجوع */}
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color={BURGUNDY} />
        </TouchableOpacity>

        {/* الخطوات العلوية */}
        <View style={styles.stepsContainer}>
          <StepItem label="اختر" iconName="bluetooth" active={false} />

          <View style={styles.lineInactive} />

          <StepItem label="جهّز" iconName="car-outline" active={true} />

          <View style={styles.lineActive} />

          <StepItem label="ابدأ" iconName="cellphone-cog" active={true} />
        </View>

        {/* الكارد الكبير فقط هو اللي فيه سكرول */}
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardScrollContent}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconCircle}>
                <MaterialCommunityIcons
                  name="car-outline"
                  size={34}
                  color="#9B6B6B"
                />
              </View>

              <View style={styles.headerTextBox}>
                <Text style={styles.title}>جهّزي القطعة</Text>

                <Text style={styles.subtitle}>
                  ابدئي بتجهيز السيارة والقطعة حتى يتمكن التطبيق من التعرف
                  عليها قبل اختيار طريقة الاتصال.
                </Text>
              </View>
            </View>

            <View style={styles.instructionsBox}>
              <InstructionRow number="1" text="شغّلي السيارة" />
              <InstructionRow number="2" text="ركّبي القطعة في مدخل OBD" />
            </View>

            {/* الأنيميشن بدون تحديد وبدون كتابة */}
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
              <InstructionRow number="3" text="انتظري حتى تضيء لمبة القطعة" />
            </View>

            <TouchableOpacity
              style={styles.nextButton}
              activeOpacity={0.9}
              onPress={() => router.push("/bluetooth-setup" as any)}
            >
              <LinearGradient
                colors={[BURGUNDY_LIGHT, BURGUNDY_DARK]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.nextGradient}
              >
                <View style={styles.buttonHighlight} />
                <Text style={styles.nextButtonText}>تم توصيل القطعة</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function StepItem({
  label,
  iconName,
  active,
}: {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
}) {
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
        <MaterialCommunityIcons
          name={iconName}
          size={25}
          color={active ? "#FFFFFF" : "#9B6B6B"}
        />
      </View>

      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
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
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: height * 0.055,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 28,
  },

  stepsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 30,
  },

  stepItem: {
    width: 58,
    alignItems: "center",
  },

  stepCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
  },

  stepCircleActive: {
    backgroundColor: BURGUNDY,
  },

  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#B0B0B0",
    fontWeight: "700",
    includeFontPadding: false,
  },

  stepLabelActive: {
    color: BURGUNDY,
    fontWeight: "900",
  },

  lineInactive: {
    width: 72,
    height: 1.5,
    backgroundColor: LINE_GRAY,
    marginTop: 23,
  },

  lineActive: {
    width: 72,
    height: 1.5,
    backgroundColor: BURGUNDY,
    marginTop: 23,
  },

  card: {
    flex: 1,
    width: "100%",
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    marginBottom: 18,
  },

  cardScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 28,
    paddingBottom: 24,
  },

  cardHeader: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },

  cardIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  headerTextBox: {
    flex: 1,
    alignItems: "flex-end",
    paddingTop: 2,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: DARK_TEXT,
    textAlign: "right",
    marginBottom: 8,
    includeFontPadding: false,
  },

  subtitle: {
    fontSize: 14,
    color: GRAY_TEXT,
    fontWeight: "500",
    textAlign: "right",
    lineHeight: 24,
    includeFontPadding: false,
  },

  instructionsBox: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 34,
    gap: 18,
  },

  instructionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    paddingRight: 8,
  },

  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BURGUNDY,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  numberText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    includeFontPadding: false,
  },

  instructionText: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: "700",
    color: "#4A4A4A",
    textAlign: "right",
    includeFontPadding: false,
  },

  animationBox: {
    width: "100%",
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  lottie: {
    width: 250,
    height: 250,
  },

  lastInstructionBox: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 8,
    marginBottom: 26,
  },

  nextButton: {
    width: "100%",
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
    shadowColor: "#5F130F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },

  nextGradient: {
    flex: 1,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  buttonHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  nextButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    includeFontPadding: false,
  },
});