import React from "react";
import {
    View,
    Text,
    Modal,
    Pressable,
    TextInput,
    ActivityIndicator,
} from "react-native";

import { Feather } from "@expo/vector-icons";

const COLORS = {
    primary: "#871B17",
};

export function EditCarNameModal({
    visible,
    value,
    onChangeText,
    onCancel,
    onSave,
    saving,
    theme,
    isRTL,
    styles,
}: {
    visible: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onCancel: () => void;
    onSave: () => void;
    saving: boolean;
    theme: any;
    isRTL: boolean;
    styles: any;
}) {
    const textAlign = isRTL ? "right" : "left";
    const rowDirection = isRTL ? "row-reverse" : "row";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View
                style={[
                    styles.modalOverlay,
                    { backgroundColor: theme.modalOverlay },
                ]}
            >
                <View
                    style={[
                        styles.confirmModal,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.cardBorder,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.confirmIconCircle,
                            { backgroundColor: theme.iconBg },
                        ]}
                    >
                        <Feather
                            name="truck"
                            size={28}
                            color={theme.iconColor}
                        />
                    </View>

                    <Text
                        style={[
                            styles.confirmTitle,
                            { color: theme.textPrimary },
                        ]}
                    >
                        {isRTL ? "تسمية السيارة" : "Rename Car"}
                    </Text>

                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={isRTL ? "اسم السيارة" : "Car name"}
                        placeholderTextColor={theme.textSecondary}
                        style={[
                            styles.nameInput,
                            {
                                color: theme.textPrimary,
                                borderColor: theme.cardBorder,
                                backgroundColor: theme.subtle,
                                textAlign,
                            },
                        ]}
                    />

                    <View
                        style={[
                            styles.confirmButtons,
                            { flexDirection: rowDirection },
                        ]}
                    >
                        <Pressable
                            style={[
                                styles.confirmSecondaryButton,
                                {
                                    backgroundColor: theme.iconBg,
                                    borderColor: theme.cardBorder,
                                },
                            ]}
                            onPress={onCancel}
                            disabled={saving}
                        >
                            <Text
                                style={[
                                    styles.confirmSecondaryText,
                                    { color: theme.textPrimary },
                                ]}
                            >
                                {isRTL ? "إلغاء" : "Cancel"}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.confirmPrimaryButton,
                                { backgroundColor: COLORS.primary },
                                saving && { opacity: 0.7 },
                            ]}
                            onPress={onSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                />
                            ) : (
                                <Text style={styles.confirmPrimaryText}>
                                    {isRTL ? "حفظ" : "Save"}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}