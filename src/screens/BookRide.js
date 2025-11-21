// src/screens/BookRide.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome6";
import { getAuthHeader, removeToken } from "../utils/auth";

const BACKEND_BASE = "https://rydy-backend.onrender.com";

const BookRide = ({ navigation }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${BACKEND_BASE}/api/rides`, {
        headers: { "Content-Type": "application/json", ...headers },
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        // not authenticated as student
        await removeToken();
        Alert.alert("Not authenticated", "Please login as a student to book rides.");
        navigation.replace("StudentLogin");
        return;
      }
      if (res.ok) {
        setRides(Array.isArray(data) ? data : []);
      } else {
        console.log("fetchRides error:", data);
        Alert.alert("Error", data?.message || "Could not load rides");
      }
    } catch (err) {
      console.error("❌ Error fetching rides:", err);
      Alert.alert("Error", "Failed to fetch rides from the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async (rideId) => {
    try {
      const headers = await getAuthHeader();
      if (!headers.Authorization) {
        Alert.alert("Not Authenticated", "Please login as a student to book.");
        navigation.replace("StudentLogin");
        return;
      }

      const res = await fetch(`${BACKEND_BASE}/api/rides/${rideId}/book`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        Alert.alert("✅ Ride Booked", "Ride booked successfully.");
        // refresh to show updated seats
        fetchRides();
      } else {
        // backend returns clear messages: already booked / no seats / etc
        Alert.alert("Booking failed", data?.message || "Could not book this ride.");
      }
    } catch (err) {
      console.error("❌ Booking error:", err);
      Alert.alert("Error", "Something went wrong while booking the ride.");
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Available Rides</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6A1B9A" style={{ marginTop: 40 }} />
      ) : rides.length === 0 ? (
        <Text style={styles.noRidesText}>No rides available right now. Please check back later.</Text>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const bookedCount = Array.isArray(item.bookedStudents) ? item.bookedStudents.length : 0;
            const seatsAvail = item.seatsAvailable ?? (item.totalSeats - bookedCount);
            const isFull = seatsAvail <= 0;
            return (
              <View style={styles.rideCard}>
                <Text style={styles.rideRoute}>{item.routeFrom} ➜ {item.routeTo}</Text>
                <Text style={styles.rideInfo}>🕒 {item.time}</Text>
                <Text style={styles.rideInfo}>🚗 {bookedCount}/{item.totalSeats} seats booked</Text>
                <Text style={styles.rideInfo}>🔢 Seats available: {seatsAvail}</Text>

                <TouchableOpacity
                  style={[styles.bookButton, isFull && { backgroundColor: "#bbb" }]}
                  disabled={isFull}
                  onPress={() => handleBookRide(item._id)}
                >
                  <Text style={styles.bookButtonText}>{isFull ? "Full" : "Book Ride"}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

export default BookRide;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f0ff", paddingHorizontal: 16, paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#6A1B9A", textAlign: "center", marginBottom: 20 },
  noRidesText: { textAlign: "center", color: "#6A1B9A", marginTop: 40, fontSize: 16, fontWeight: "500" },
  rideCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 15, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  rideRoute: { color: "#333", fontWeight: "700", fontSize: 16, marginBottom: 6 },
  rideInfo: { color: "#6A1B9A", fontSize: 14, marginBottom: 4 },
  bookButton: { backgroundColor: "#6A1B9A", paddingVertical: 10, borderRadius: 20, alignItems: "center" },
  bookButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
