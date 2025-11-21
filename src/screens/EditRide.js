// src/screens/EditRide.js
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { getAuthHeader } from "../utils/auth";

const BACKEND_BASE = "https://rydy-backend.onrender.com";

export default function EditRide({ route, navigation }) {
  const rideId = route.params?.rideId;
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [titleFrom, setFrom] = useState("");
  const [titleTo, setTo] = useState("");
  const [time, setTime] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [seatsAvailable, setSeatsAvailable] = useState("");

  const fetchRide = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeader();
      if (!headers.Authorization) return Alert.alert("Not authenticated");
      const res = await fetch(`${BACKEND_BASE}/api/rides/${rideId}`, { headers });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setRide(data);
        setFrom(data.routeFrom);
        setTo(data.routeTo);
        setTime(data.time);
        setTotalSeats(String(data.totalSeats));
        setSeatsAvailable(String(data.seatsAvailable ?? (data.totalSeats - (data.bookedStudents?.length || 0))));
      } else {
        Alert.alert("Error", data?.message || "Could not fetch ride");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRide();
  }, []);

  const save = async () => {
    try {
      const headers = await getAuthHeader();
      if (!headers.Authorization) return Alert.alert("Not authenticated");
      const res = await fetch(`${BACKEND_BASE}/api/rides/${rideId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ routeFrom: titleFrom, routeTo: titleTo, time, totalSeats: Number(totalSeats) }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        Alert.alert("Saved");
        navigation.goBack();
      } else {
        Alert.alert("Error", data?.message || "Could not update");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network error");
    }
  };

  const changeSeats = async (action, amount = 1) => {
    try {
      const headers = await getAuthHeader();
      if (!headers.Authorization) return Alert.alert("Not authenticated");
      const res = await fetch(`${BACKEND_BASE}/api/rides/${rideId}/seats`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action, amount }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ride) {
        setSeatsAvailable(String(data.ride.seatsAvailable));
        // ALSO update totalSeats/state if backend changed it
        setTotalSeats(String(data.ride.totalSeats));
        Alert.alert("Seats updated");
      } else {
        Alert.alert("Error", data?.message || "Could not update seats");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network error");
    }
  };

  const deactivate = async () => {
    Alert.alert("Confirm", "Deactivate this ride?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: async () => {
          try {
            const headers = await getAuthHeader();
            if (!headers.Authorization) return Alert.alert("Not authenticated");
            const res = await fetch(`${BACKEND_BASE}/api/rides/${rideId}`, { method: "DELETE", headers });
            const data = await res.json().catch(() => null);
            if (res.ok) {
              Alert.alert("Ride deactivated");
              navigation.goBack();
            } else {
              Alert.alert("Error", data?.message || "Could not deactivate");
            }
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Network error");
          }
        },
      },
    ]);
  };

  if (loading || !ride) return <View style={{ padding: 16 }}><ActivityIndicator size="large" color="#6A1B9A" /></View>;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: "700", marginBottom: 6 }}>From</Text>
      <TextInput value={titleFrom} onChangeText={setFrom} style={styles.input} />

      <Text style={{ fontWeight: "700", marginBottom: 6 }}>To</Text>
      <TextInput value={titleTo} onChangeText={setTo} style={styles.input} />

      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Time</Text>
      <TextInput value={time} onChangeText={setTime} style={styles.input} />

      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Total Seats</Text>
      <TextInput value={totalSeats} onChangeText={setTotalSeats} style={styles.input} keyboardType="numeric" />

      <Text style={{ marginTop: 8 }}>Available Seats: {seatsAvailable}</Text>

      <View style={{ height: 12 }} />
      <Button title="Save changes" onPress={save} />
      <View style={{ height: 8 }} />
      <Button title="Decrease seats (-1)" onPress={() => changeSeats("decrement", 1)} />
      <View style={{ height: 8 }} />
      <Button title="Increase seats (+1)" onPress={() => changeSeats("increment", 1)} />
      <View style={{ height: 8 }} />
      <Button title="Deactivate ride" onPress={deactivate} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: "#ddd", padding: 8, marginBottom: 8, borderRadius: 8 },
});
