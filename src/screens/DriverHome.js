// src/screens/DriverHome.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome6";
import { getAuthHeader, getToken, removeToken, getUser } from "../utils/auth";

const BACKEND_BASE = "https://rydy-backend.onrender.com";

const DriverHome = ({ navigation }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [driverName, setDriverName] = useState(null);

  const loadLocalUser = useCallback(async () => {
    try {
      const u = await getUser();
      if (u && u.name) setDriverName(u.name);
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        // no token -> go to login
        await removeToken();
        Alert.alert("Not authenticated", "Please login as driver.");
        navigation.replace("DriverLogin");
        return;
      }

      const headers = await getAuthHeader();
      console.log("[DriverHome] fetching rides with headers:", headers);

      const res = await fetch(`${BACKEND_BASE}/api/rides?driver=true`, {
        method: "GET",
        headers,
      });

      // if token invalid or expired (401/403) — sign out
      if (res.status === 401 || res.status === 403) {
        await removeToken();
        Alert.alert("Session expired", "Please login again.");
        navigation.replace("DriverLogin");
        return;
      }

      const data = await res.json().catch(() => null);
      if (res.ok) {
        setRides(Array.isArray(data) ? data : []);
      } else {
        console.warn("[DriverHome] fetch rides failed:", res.status, data);
        Alert.alert("Error", data?.message || "Failed to fetch rides");
      }
    } catch (err) {
      console.error("[DriverHome] error fetching rides:", err);
      Alert.alert("Error", "Failed to fetch rides from server. Check connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    loadLocalUser();
    const unsub = navigation.addListener("focus", () => {
      fetchRides();
      loadLocalUser();
    });
    return unsub;
  }, [navigation, fetchRides, loadLocalUser]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  const handleLogout = async () => {
    await removeToken();
    Alert.alert("Logged out", "You have been logged out.");
    navigation.replace("DriverLogin");
  };

  const renderRide = ({ item }) => {
    const bookedCount = Array.isArray(item.bookedStudents) ? item.bookedStudents.length : 0;
    const totalSeats = item.totalSeats ?? 0;
    const seatsAvail = typeof item.seatsAvailable === "number" ? item.seatsAvailable : Math.max(0, totalSeats - bookedCount);

    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => navigation.navigate("EditRide", { rideId: item._id })}
      >
        <Text style={styles.rideRoute}>
          {item.routeFrom || "Unknown"} ➜ {item.routeTo || "Unknown"}
        </Text>
        <Text style={styles.rideTime}>🕒 {item.time || "Not specified"}</Text>
        <Text style={styles.rideSeats}>🚗 {bookedCount}/{totalSeats} seats booked</Text>
        <Text style={styles.rideSeats}>🔢 Available: {seatsAvail}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#6A1B9A" barStyle="light-content" />
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Driver Home{driverName ? ` — ${driverName}` : ""}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <FontAwesome name="right-from-bracket" size={18} color="#6A1B9A" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.createRideCard}
        onPress={() => navigation.navigate("CreateRide")}
      >
        <FontAwesome name="car" size={36} color="#d8b9ff" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.createRideTitle}>Create a Ride</Text>
          <Text style={styles.createRideSubtitle}>Schedule your ride details</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <FontAwesome name="calendar-days" size={20} color="#6A1B9A" />
        <Text style={styles.sectionTitle}>My Rides</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6A1B9A" style={{ marginTop: 40 }} />
      ) : rides.length === 0 ? (
        <Text style={styles.noRidesText}>
          No rides created yet. Tap “Create a Ride” to get started.
        </Text>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={renderRide}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => {}}>
          <FontAwesome name="house" size={22} color="#6A1B9A" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("MyRides")}>
          <FontAwesome name="clipboard-list" size={22} color="#999" />
          <Text style={[styles.navText, { color: "#999" }]}>My Rides</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("DriverProfile")}>
          <FontAwesome name="user" size={22} color="#999" />
          <Text style={[styles.navText, { color: "#999" }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DriverHome;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f0ff", paddingHorizontal: 16, paddingTop: 50 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingHorizontal: 4 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#6A1B9A" },
  logoutBtn: { flexDirection: "row", alignItems: "center" },
  logoutText: { color: "#6A1B9A", marginLeft: 6, fontWeight: "600" },
  createRideCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#6A1B9A", padding: 20, borderRadius: 20, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  createRideTitle: { color: "#fff", fontWeight: "700", fontSize: 18 },
  createRideSubtitle: { color: "#d8b9ff", fontSize: 14, marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionTitle: { color: "#000", fontWeight: "700", fontSize: 17, marginLeft: 8 },
  noRidesText: { textAlign: "center", color: "#6A1B9A", marginTop: 40, fontSize: 14 },
  rideCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  rideRoute: { color: "#333", fontWeight: "600", fontSize: 15, marginBottom: 6 },
  rideTime: { color: "#6A1B9A", fontSize: 13, marginBottom: 4 },
  rideSeats: { color: "#6A1B9A", fontSize: 13, marginBottom: 4 },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#eee", paddingVertical: 10, position: "absolute", bottom: 0, width: "100%" },
  navText: { fontSize: 12, fontWeight: "600", color: "#6A1B9A", marginTop: 2 },
});
