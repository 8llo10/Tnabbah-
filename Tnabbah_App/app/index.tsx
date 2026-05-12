import { Redirect } from "expo-router";
import { ImageBackground, StyleSheet } from "react-native";

const BACKGROUND_IMAGE = require("../assets/images/start-background.png");

export default function IndexScreen() {
  return (
    <ImageBackground
      source={BACKGROUND_IMAGE}
      style={styles.container}
      resizeMode="cover"
    >
      <Redirect href="/start" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});