import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const RED = "#871B17";
const BG = "#F8EEEE";
const SOFT_PINK = "#EBD2D2";

function TnabbahBackground() {
    return (
        <View style={styles.container}>
            <View style={styles.topRightCircle} />
            <View style={styles.bottomLeftCircle} />

            <View style={styles.centerArea}>
                <Svg width={width} height={430} style={StyleSheet.absoluteFill}>
                    <Circle
                        cx={width / 2}
                        cy={215}
                        r={190}
                        stroke={RED}
                        strokeWidth={1.3}
                        strokeOpacity={0.22}
                        strokeDasharray="4 4"
                        fill="none"
                    />

                    <Circle
                        cx={width / 2}
                        cy={215}
                        r={145}
                        stroke={RED}
                        strokeWidth={1}
                        strokeOpacity={0.15}
                        fill="none"
                    />
                </Svg>
            </View>

            <View style={styles.bottomSoftBlock} />
        </View>
    );
}

export default TnabbahBackground;

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: BG,
        overflow: "hidden",
    },

    topRightCircle: {
        position: "absolute",
        width: width * 0.72,
        height: width * 0.72,
        borderRadius: width * 0.36,
        backgroundColor: SOFT_PINK,
        opacity: 0.55,
        top: -20,
        right: -125,
    },

    bottomLeftCircle: {
        position: "absolute",
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: width * 0.45,
        backgroundColor: SOFT_PINK,
        opacity: 0.55,
        left: -170,
        bottom: 40,
    },

    centerArea: {
        position: "absolute",
        width: width,
        height: 430,
        top: height * 0.35,
        left: 0,
    },

    bottomSoftBlock: {
        position: "absolute",
        width: width,
        height: height * 0.23,
        bottom: 0,
        backgroundColor: "#F3E4E4",
        opacity: 0.65,
    },
});