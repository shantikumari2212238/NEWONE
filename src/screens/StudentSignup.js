// src/screens/StudentSignup.js
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, PermissionsAndroid
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";

const BACKEND_URL = "https://rydy-backend.onrender.com/api/students/signup";

const StudentSignup = ({ navigation }) => {
  const [name, setName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [idImage, setIdImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: "Camera Permission",
        message: "App needs camera permission to take photos",
        buttonPositive: "OK",
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn("Camera permission error", err);
      return false;
    }
  };

  const openCamera = async () => {
    const ok = await requestCameraPermission();
    if (!ok) { Alert.alert("Permission required", "Camera permission is required to take a photo."); return; }
    const result = await launchCamera({ mediaType: "photo", quality: 0.8 });
    if (result.didCancel) return;
    if (result.assets?.[0]) setIdImage(result.assets[0]);
  };

  const openGallery = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", quality: 0.8 });
    if (result.didCancel) return;
    if (result.assets?.[0]) setIdImage(result.assets[0]);
  };

  const onChooseImage = () => {
    Alert.alert("Upload ID Card", "Choose image from", [
      { text: "Camera", onPress: openCamera },
      { text: "Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const validateAndSubmit = async () => {
    if (!name.trim() || !universityId.trim() || !universityName.trim() || !password) {
      Alert.alert("Validation", "Please fill out all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }
    if (!idImage) {
      Alert.alert("Validation", "Please upload your ID card.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("universityId", universityId.trim());
      formData.append("universityName", universityName.trim());
      formData.append("password", password);

      const uri = Platform.OS === "android" ? idImage.uri : idImage.uri.replace("file://", "");
      formData.append("idCard", {
        uri,
        name: idImage.fileName || `id_${Date.now()}.jpg`,
        type: idImage.type || "image/jpeg",
      });

      const response = await fetch(BACKEND_URL, { method: "POST", body: formData });
      const json = await response.json().catch(() => null);
      setLoading(false);

      if (response.ok) {
        Alert.alert("Signup Submitted", "Your account is pending admin approval.", [
          { text: "OK", onPress: () => navigation.navigate("StudentLogin") },
        ]);
      } else {
        const msg = (json && json.message) || "Something went wrong.";
        Alert.alert("Signup Failed", msg);
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
      <Text style={styles.title}>Student Sign Up</Text>
      <Text style={styles.subtitle}>Register — your account will be approved by admin</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" />

        <Text style={[styles.label, { marginTop: 12 }]}>University ID</Text>
        <TextInput style={styles.input} value={universityId} onChangeText={setUniversityId} placeholder="2021-ABC-123" autoCapitalize="characters" />

        <Text style={[styles.label, { marginTop: 12 }]}>University Name</Text>
        <TextInput style={styles.input} value={universityName} onChangeText={setUniversityName} placeholder="Your University Name" />

        <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
        <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} placeholder="Enter password" />

        <Text style={[styles.label, { marginTop: 12 }]}>Confirm Password</Text>
        <TextInput style={styles.input} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" />

        <Text style={[styles.label, { marginTop: 12 }]}>ID Card Picture</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={onChooseImage}>
          {idImage ? <Image source={{ uri: idImage.uri }} style={styles.idPreview} resizeMode="cover" /> : <Text style={styles.uploadText}>Tap to upload ID card (front)</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={validateAndSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Signup</Text>}
        </TouchableOpacity>

        <View style={styles.noteRow}>
          <Text style={styles.noteText}>After submission, your account will be pending admin approval.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default StudentSignup;

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
  idPreview: { width: "100%", height: "100%" },
  submitButton: { backgroundColor: "#6A1B9A", paddingVertical: 14, borderRadius: 30, marginTop: 20, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  noteRow: { marginTop: 12, alignItems: "center" },
  noteText: { color: "#6A1B9A", fontSize: 12, textAlign: "center" },
});
