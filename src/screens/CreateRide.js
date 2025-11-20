import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome6";

const BACKEND_URL = "https://rydy-backend.onrender.com/api/rides";

const CreateRide = ({ navigation }) => {
  const [formData, setFormData] = useState({
    routeFrom: "",
    routeTo: "",
    time: "",
    totalSeats: "",
  });

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleCreateRide = async () => {
    const { routeFrom, routeTo, time, totalSeats } = formData;

    if (!routeFrom || !routeTo || !time || !totalSeats) {
      Alert.alert("Missing Fields", "Please fill out all ride details.");
      return;
    }

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeFrom,
          routeTo,
          time,
          totalSeats: Number(totalSeats),
        }),
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("❌ Invalid JSON from backend:", text);
        Alert.alert("Server Error", "Unexpected server response. Please try again.");
        return;
      }

      if (response.ok) {
        Alert.alert("✅ Ride Created", "Your ride has been added successfully!", [
          { text: "OK", onPress: () => navigation.navigate("DriverHome") },
        ]);
      } else {
        console.log("❌ Server error:", data);
        Alert.alert("Error", data.message || "Failed to create ride.");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      Alert.alert("Error", "Could not connect to server.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Create a Ride</Text>

      <View style={styles.inputContainer}>
        <FontAwesome name="location-dot" size={18} color="#6A1B9A" />
        <TextInput
          placeholder="From (e.g. Campus)"
          style={styles.input}
          value={formData.routeFrom}
          onChangeText={(text) => handleChange("routeFrom", text)}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="location-arrow" size={18} color="#6A1B9A" />
        <TextInput
          placeholder="To (e.g. Central Station)"
          style={styles.input}
          value={formData.routeTo}
          onChangeText={(text) => handleChange("routeTo", text)}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="clock" size={18} color="#6A1B9A" />
        <TextInput
          placeholder="Time (e.g. 8:30 AM)"
          style={styles.input}
          value={formData.time}
          onChangeText={(text) => handleChange("time", text)}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="users" size={18} color="#6A1B9A" />
        <TextInput
          placeholder="Total Seats"
          keyboardType="numeric"
          style={styles.input}
          value={formData.totalSeats}
          onChangeText={(text) => handleChange("totalSeats", text)}
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleCreateRide}>
        <Text style={styles.submitText}>Create Ride</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreateRide;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f7f0ff",
    padding: 20,
    justifyContent: "center",
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#6A1B9A",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "#333",
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: "#6A1B9A",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#6A1B9A",
    fontWeight: "600",
    fontSize: 15,
  },
});
