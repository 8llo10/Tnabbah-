import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BURGUNDY = "#871B17";

export default function ConnectionIntroScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="car-sport-outline" size={48} color={BURGUNDY} />
          </View>

          <Text style={styles.title}>تجهيز الاتصال بالقطعة</Text>

          <Text style={styles.subtitle}>
            قبل البدء، تأكدي أن قطعة OBD مركّبة في السيارة وأن البلوتوث مفعّل في جوالك.
          </Text>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={() => router.push("/bluetooth-setup" as any)}
          >
            <Text style={styles.buttonText}>البدء بالاتصال</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: "#E0D0D0",
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  iconBox: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: "#F8E8E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1F1F1F",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 14,
    fontSize: 15,
    color: "#777",
    lineHeight: 24,
    textAlign: "center",
  },
  button: {
    marginTop: 34,
    width: "100%",
    height: 54,
    borderRadius: 18,
    backgroundColor: BURGUNDY,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
});
