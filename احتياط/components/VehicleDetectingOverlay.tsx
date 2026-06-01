/* import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const BURGUNDY = "#871B17";

type Props = {
  visible: boolean;
  logoSource?: any;
  carSource?: any;
};

export function VehicleDetectingOverlay({
  visible,
  logoSource,
  carSource,
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const scanY = useRef(new Animated.Value(0)).current;
  const barX = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: 1,
          duration: 1150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 1150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const barLoop = Animated.loop(
      Animated.timing(barX, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.025,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    scanLoop.start();
    barLoop.start();
    pulseLoop.start();

    return () => {
      scanLoop.stop();
      barLoop.stop();
      pulseLoop.stop();
    };
  }, [visible]);

  if (!visible) return null;

  const scanTranslateY = scanY.interpolate({
    inputRange: [0, 1],
    outputRange: [-72, 72],
  });

  const barTranslateX = barX.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]}>
      <View style={styles.topSpace}>
        {logoSource ? (
          <Image source={logoSource} style={styles.logo} resizeMode="contain" />
        ) : null}
      </View>

      <View style={styles.center}>
        <View style={styles.ringOuter} />
        <View style={styles.ringMiddle} />
        <View style={styles.ringInner} />

        <Animated.View style={[styles.carWrap, { transform: [{ scale: pulse }] }]}>
          {carSource ? (
            <Image source={carSource} style={styles.carImage} resizeMode="contain" />
          ) : (
            <View style={styles.fakeCar}>
              <View style={styles.fakeCarTop} />
              <View style={styles.fakeWindow} />
              <View style={styles.fakeCarBottom} />
            </View>
          )}

          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanTranslateY }] },
            ]}
          />
        </Animated.View>
      </View>

      <View style={styles.loaderBox}>
        <View style={styles.loaderTrack}>
          <Animated.View
            style={[
              styles.loaderGlow,
              { transform: [{ translateX: barTranslateX }] },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const carWidth = width * 0.46;
const carHeight = height * 0.36;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: height * 0.075,
    paddingBottom: height * 0.18,
  },

  topSpace: {
    height: 86,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 150,
    height: 70,
  },

  center: {
    width: width,
    height: height * 0.55,
    alignItems: "center",
    justifyContent: "center",
  },

  ringOuter: {
    position: "absolute",
    width: width * 0.78,
    height: width * 0.78,
    borderRadius: width,
    borderWidth: 1,
    borderColor: "rgba(135,27,23,0.13)",
  },

  ringMiddle: {
    position: "absolute",
    width: width * 0.58,
    height: width * 0.58,
    borderRadius: width,
    borderWidth: 1,
    borderColor: "rgba(135,27,23,0.22)",
  },

  ringInner: {
    position: "absolute",
    width: width * 0.38,
    height: width * 0.38,
    borderRadius: width,
    borderWidth: 1,
    borderColor: "rgba(135,27,23,0.30)",
  },

  carWrap: {
    width: carWidth,
    height: carHeight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  carImage: {
    width: carWidth,
    height: carHeight,
  },

  fakeCar: {
    width: carWidth * 0.72,
    height: carHeight * 0.94,
    borderRadius: 80,
    backgroundColor: "#F1F1F1",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  fakeCarTop: {
    width: "62%",
    height: "19%",
    marginTop: 20,
    borderRadius: 999,
    backgroundColor: "#E3E3E3",
  },

  fakeWindow: {
    width: "72%",
    height: "50%",
    marginTop: 11,
    borderRadius: 34,
    backgroundColor: "#111111",
  },

  fakeCarBottom: {
    width: "66%",
    height: "16%",
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: "#E0E0E0",
  },

  scanLine: {
    position: "absolute",
    width: carWidth * 0.72,
    height: 5,
    borderRadius: 999,
    backgroundColor: BURGUNDY,
    shadowColor: BURGUNDY,
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },

  loaderBox: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  loaderTrack: {
    width: width * 0.52,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(135,27,23,0.25)",
    overflow: "hidden",
  },

  loaderGlow: {
    width: 95,
    height: 4,
    borderRadius: 999,
    backgroundColor: BURGUNDY,
    shadowColor: BURGUNDY,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
}); */


import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    StyleSheet,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const BURGUNDY = "#871B17";

type Props = {
    visible: boolean;
    logoSource?: any;
    carSource: any;
};

export function VehicleDetectingOverlay({
    visible,
    logoSource,
    carSource,
}: Props) {
    const fade = useRef(new Animated.Value(0)).current;
    const scanY = useRef(new Animated.Value(0)).current;
    const loaderX = useRef(new Animated.Value(0)).current;

    const ring1 = useRef(new Animated.Value(0)).current;
    const ring2 = useRef(new Animated.Value(0)).current;
    const ring3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fade, {
            toValue: visible ? 1 : 0,
            duration: 180,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    useEffect(() => {
        if (!visible) return;

        const scanLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(scanY, {
                    toValue: 1,
                    duration: 1250,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scanY, {
                    toValue: 0,
                    duration: 1250,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const loaderLoop = Animated.loop(
            Animated.timing(loaderX, {
                toValue: 1,
                duration: 1400,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            })
        );

        const makeRingLoop = (anim: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 1800,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );

        const r1 = makeRingLoop(ring1, 0);
        const r2 = makeRingLoop(ring2, 550);
        const r3 = makeRingLoop(ring3, 1100);

        scanLoop.start();
        loaderLoop.start();
        r1.start();
        r2.start();
        r3.start();

        return () => {
            scanLoop.stop();
            loaderLoop.stop();
            r1.stop();
            r2.stop();
            r3.stop();
        };
    }, [visible]);

    if (!visible) return null;

    const scanTranslateY = scanY.interpolate({
        inputRange: [0, 1],
        outputRange: [-82, 82],
    });

    const loaderTranslateX = loaderX.interpolate({
        inputRange: [0, 1],
        outputRange: [-115, 115],
    });

    const ringStyle = (anim: Animated.Value) => ({
        opacity: anim.interpolate({
            inputRange: [0, 0.15, 0.75, 1],
            outputRange: [0, 0.65, 0.22, 0],
        }),
        transform: [
            {
                scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.25, 1.55],
                }),
            },
        ],
    });

    return (
        <Animated.View style={[styles.overlay, { opacity: fade }]}>
            <View style={styles.logoArea}>
                {logoSource ? (
                    <Image source={logoSource} style={styles.logo} resizeMode="contain" />
                ) : null}
            </View>

            <View style={styles.scanArea}>
                <Animated.View style={[styles.ring, ringStyle(ring1)]} />
                <Animated.View style={[styles.ring, ringStyle(ring2)]} />
                <Animated.View style={[styles.ring, ringStyle(ring3)]} />

                <View style={styles.carBox}>
                    <Image source={carSource} style={styles.carImage} resizeMode="contain" />

                    <Animated.View
                        style={[
                            styles.scanLine,
                            { transform: [{ translateY: scanTranslateY }] },
                        ]}
                    />
                </View>
            </View>

            <View style={styles.loaderTrack}>
                <Animated.View
                    style={[
                        styles.loaderGlow,
                        { transform: [{ translateX: loaderTranslateX }] },
                    ]}
                />
            </View>
        </Animated.View>
    );
}

const carWidth = width * 0.80;
const carHeight = height * 0.62;

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 99999,
        elevation: 99999,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        paddingTop: height * 0.075,
    },

    logoArea: {
        height: 90,
        alignItems: "center",
        justifyContent: "center",
    },

    logo: {
        width: 155,
        height: 70,
    },

    scanArea: {
        width: "100%",
        height: height * 0.58,
        alignItems: "center",
        justifyContent: "center",
    },

    ring: {
        position: "absolute",
        bottom: height * 0.13,
        width: width * 0.72,
        height: width * 0.72,
        borderRadius: width,
        borderWidth: 1.4,
        borderColor: "rgba(135,27,23,0.34)",
    },

    carBox: {
        width: carWidth,
        height: carHeight,
        alignItems: "center",
        justifyContent: "center",
    },

    carImage: {
        width: carWidth,
        height: carHeight,
    },

    scanLine: {
        position: "absolute",
        width: carWidth * 0.30,
        height: 4,
        borderRadius: 999,
        backgroundColor: BURGUNDY,
        shadowColor: BURGUNDY,
        shadowOpacity: 1,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
    },

    loaderTrack: {
        marginTop: 18,
        width: width * 0.56,
        height: 4,
        borderRadius: 999,
        backgroundColor: "rgba(135,27,23,0.22)",
        overflow: "hidden",
    },

    loaderGlow: {
        width: 100,
        height: 4,
        borderRadius: 999,
        backgroundColor: BURGUNDY,
        shadowColor: BURGUNDY,
        shadowOpacity: 1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
    },
});