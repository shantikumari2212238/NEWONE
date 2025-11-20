// src/screens/DriverSignup.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";

const BACKEND_URL = "https://rydy-backend.onrender.com/api/drivers/signup";

const DriverSignup = ({ navigation }) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [nic, setNic] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChoosePhoto = () => {
    Alert.alert("Upload Photo", "Choose image from", [
      { text: "Camera", onPress: openCamera },
      { text: "Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const result = await launchCamera({ mediaType: "photo", quality: 0.8 });
    const asset = result.assets && result.assets[0];
    if (asset?.uri) setPhoto(asset);
  };

  const openGallery = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", quality: 0.8 });
    const asset = result.assets && result.assets[0];
    if (asset?.uri) setPhoto(asset);
  };

  const validateAndSubmit = async () => {
    if (!name.trim() || !age.trim() || !nic.trim() || !username.trim() || !password.trim()) {
      Alert.alert("Validation", "Please fill all fields.");
      return;
    }
    if (isNaN(age) || age < 18 || age > 80) {
      Alert.alert("Validation", "Please enter a valid age between 18 and 80.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }
    if (!photo) {
      Alert.alert("Validation", "Please upload your photo.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("age", age);
      formData.append("nic", nic);
      formData.append("username", username);
      formData.append("password", password);
      formData.append("photo", {
        uri: Platform.OS === "android" ? photo.uri : photo.uri.replace("file://", ""),
        name: photo.fileName || `driver_${Date.now()}.jpg`,
        type: photo.type || "image/jpeg",
      });

      const response = await fetch(BACKEND_URL, { method: "POST", body: formData });
      const json = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert("Signup Submitted", "Your driver account is pending admin approval.", [
          { text: "OK", onPress: () => navigation.navigate("DriverLogin") },
        ]);
      } else {
        Alert.alert("Signup Failed", json.message || "Something went wrong.");
      }
    } catch (err) {
      setLoading(false);
      console.error("❌ Network Error:", err);
      Alert.alert("Network Error", "Could not connect to the server. Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Image source={require("../../assets/rydy_logo.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Driver Sign Up</Text>
      <Text style={styles.subtitle}>Register — admin approval required</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor="#a68bc6" />

        <Text style={[styles.label, { marginTop: 12 }]}>Age</Text>
        <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="e.g. 35" placeholderTextColor="#a68bc6" />

        <Text style={[styles.label, { marginTop: 12 }]}>NIC Number</Text>
        <TextInput style={styles.input} value={nic} onChangeText={setNic} placeholder="e.g. 42101-1234567-8" placeholderTextColor="#a68bc6" />

        <Text style={[styles.label, { marginTop: 12 }]}>Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="unique username (e.g. ali_driver)" placeholderTextColor="#a68bc6" autoCapitalize="none" />

        <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
        <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} placeholder="Enter password" placeholderTextColor="#a68bc6" />

        <Text style={[styles.label, { marginTop: 12 }]}>Confirm Password</Text>
        <TextInput style={styles.input} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor="#a68bc6" />

        <Text style={[styles.label, { marginTop: 12 }]}>Driver Photo</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={onChoosePhoto}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <Text style={styles.uploadText}>Tap to upload your photo</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={validateAndSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Signup</Text>}
        </TouchableOpacity>

        <View style={styles.noteRow}>
          <Text style={styles.noteText}>After submission your account will be pending admin approval.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default DriverSignup;

// styles (same as previous with slight adjustments)
const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, backgroundColor: "#f7f0ff" },
  logo: { width: 140, height: 140, marginTop: 8, marginBottom: 6 },
  title: { color: "#6A1B9A", fontSize: 24, fontWeight: "800", marginTop: 6 },
  subtitle: { color: "#6A1B9A", fontSize: 13, marginTop: 6, marginBottom: 12, textAlign: "center" },
  form: { width: "100%", marginTop: 6 },
  label: { color: "#6A1B9A", fontSize: 13, marginLeft: 4, fontWeight: "600" },
  input: { backgroundColor: "#fff", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 16, color: "#333", borderWidth: 1, borderColor: "#ead9ff", marginTop: 6 },
  uploadBox: { height: 150, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: "#d7bff5", alignItems: "center", justifyContent: "center", marginTop: 8, overflow: "hidden", backgroundColor: "#fff" },
  uploadText: { color: "#6A1B9A", textAlign: "center", paddingHorizontal: 8 },
  photoPreview: { width: "100%", height: "100%" },
  submitButton: { backgroundColor: "#6A1B9A", paddingVertical: 14, borderRadius: 30, marginTop: 20, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  noteRow: { marginTop: 12, alignItems: "center" },
  noteText: { color: "#6A1B9A", fontSize: 12, textAlign: "center" },
});
