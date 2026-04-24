import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function StartScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Logo */}
            <Image
                source={require('../assets/images/logo.png')} // غيري المسار حسب لوقو تطبيقك
                style={styles.logo}
                resizeMode="contain"
            />

            {/* Title */}
            <Text style={styles.title}>Welcome</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
                Create an account or log in to continue
            </Text>

            {/* Buttons */}
            <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/login')}
            >
                <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.registerButton}
                onPress={() => router.push('/register')}
            >
                <Text style={styles.registerText}>Create Account</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#fff',
    },
    logo: {
        width: 180,
        height: 180,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    loginButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#000',
        borderRadius: 10,
        marginBottom: 15,
    },
    loginText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
    registerButton: {
        width: '100%',
        padding: 15,
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: 10,
    },
    registerText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
});
