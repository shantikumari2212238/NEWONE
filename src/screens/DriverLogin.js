// src/screens/DriverLogin.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { saveToken, saveUser } from "../utils/auth";

const BACKEND_LOGIN = "https://rydy-backend.onrender.com/api/drivers/login";

const DriverLogin = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Validation", "Please enter username and password.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(BACKEND_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const json = await resp.json().catch(() => null);
      setLoading(false);

      if (resp.ok && json) {
        // save token and user
        if (json.token) {
          const ok = await saveToken(json.token);
          if (!ok) {
            Alert.alert("Warning", "Logged in but could not save session locally.");
          }
        }
        if (json.driver) {
          await saveUser(json.driver);
        }

        navigation.replace("DriverHome", { driver: json.driver });
      } else {
        const msg = json?.message || "Login failed";
        Alert.alert("Login Failed", msg);
      }
    } catch (err) {
      setLoading(false);
      console.error("❌ Login network error:", err);
      Alert.alert("Network Error", "Could not reach server. Check your connection.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Image source={require("../../assets/rydy_logo.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Driver Login</Text>
      <Text style={styles.subtitle}>Sign in with your username to continue</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="your username"
          placeholderTextColor="#a68bc6"
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter password"
          placeholderTextColor="#a68bc6"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.small}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("DriverSignup")}>
            <Text style={styles.link}> Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default DriverLogin;

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40, backgroundColor: "#f7f0ff", minHeight: "100%" },
  logo: { width: 120, height: 120, marginBottom: 8 },
  title: { color: "#6A1B9A", fontSize: 24, fontWeight: "800", marginTop: 6 },
  subtitle: { color: "#6A1B9A", fontSize: 13, marginTop: 6, marginBottom: 12, textAlign: "center" },
  form: { width: "100%", marginTop: 6 },
  label: { color: "#6A1B9A", fontSize: 13, marginLeft: 4, fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ead9ff",
    marginTop: 6,
  },
  submitButton: { backgroundColor: "#6A1B9A", paddingVertical: 14, borderRadius: 30, marginTop: 20, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14 },
  small: { color: "#6A1B9A", fontSize: 13 },
  link: { color: "#4a148c", fontWeight: "700", marginLeft: 6 },
});
