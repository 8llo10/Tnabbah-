import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ConnectionSuccessScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>تم الاتصال بنجاح</Text>
        <Text style={styles.subtitle}>
          تم ربط قطعة OBD بالتطبيق، ويمكن الآن متابعة بيانات السيارة.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)/home" as any)}
        >
          <Text style={styles.buttonText}>الانتقال للرئيسية</Text>
        </TouchableOpacity>
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
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    color: "#871B17",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    color: "#777",
  },
  button: {
    marginTop: 32,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#871B17",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
});