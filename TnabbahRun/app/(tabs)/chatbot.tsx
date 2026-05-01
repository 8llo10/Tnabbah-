import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";

export default function Chatbot() {
    const [messages, setMessages] = useState([
        { id: 1, from: "bot", text: "هلا غلوشي، كيف أقدر أساعدك اليوم؟ 🤖" },
        { id: 2, from: "user", text: "ولا شيء بس أبي شكل شات." },
    ]);

    const [input, setInput] = useState("");

    const sendMessage = () => {
        if (!input.trim()) return;

        setMessages([...messages, { id: Date.now(), from: "user", text: input }]);
        setInput("");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Chatbot</Text>

            <ScrollView style={styles.chatArea}>
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        style={[
                            styles.messageBubble,
                            msg.from === "user" ? styles.userBubble : styles.botBubble,
                        ]}
                    >
                        <Text style={styles.messageText}>{msg.text}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="اكتب رسالة..."
                    value={input}
                    onChangeText={setInput}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                    <Text style={styles.sendText}>إرسال</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 20,
    },
    chatArea: {
        flex: 1,
        marginBottom: 20,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        maxWidth: "80%",
    },
    botBubble: {
        backgroundColor: "#f1f1f1",
        alignSelf: "flex-start",
    },
    userBubble: {
        backgroundColor: "#7a0f1f",
        alignSelf: "flex-end",
    },
    messageText: {
        color: "#000",
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    input: {
        flex: 1,
        backgroundColor: "#eee",
        padding: 12,
        borderRadius: 10,
        marginRight: 10,
    },
    sendBtn: {
        backgroundColor: "#7a0f1f",
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10,
    },
    sendText: {
        color: "#fff",
        fontWeight: "700",
    },
});
