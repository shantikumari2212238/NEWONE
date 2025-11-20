import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome6";

const BACKEND_URL = "https://rydy-backend.onrender.com/api/rides";

const DriverHome = ({ navigation }) => {
  const [rides, setRides] = useState([]);

  const fetchRides = async () => {
    try {
      const res = await fetch(BACKEND_URL);
      const data = await res.json();
      setRides(data || []);
    } catch (err) {
      console.error("❌ Error fetching rides:", err);
      Alert.alert("Error", "Failed to fetch rides from server");
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#6A1B9A" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Home</Text>
      </View>

      <TouchableOpacity
        style={styles.createRideCard}
        onPress={() => navigation.navigate("CreateRide")}
      >
        <FontAwesome name="car" size={36} color="#d8b9ff" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.createRideTitle}>Create a Ride</Text>
          <Text style={styles.createRideSubtitle}>
            Schedule your ride details
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <FontAwesome name="calendar-days" size={20} color="#6A1B9A" />
        <Text style={styles.sectionTitle}>Today's Rides</Text>
      </View>

      {rides.length === 0 ? (
        <Text style={styles.noRidesText}>
          No rides created yet. Tap “Create a Ride” to get started.
        </Text>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.rideCard}>
              <Text style={styles.rideRoute}>
                {item.routeFrom} ➜ {item.routeTo}
              </Text>
              <Text style={styles.rideTime}>
                🕒 {item.time || "Not specified"}
              </Text>
              <Text style={styles.rideSeats}>
                🚗 {item.bookedSeats || 0}/{item.totalSeats} seats booked
              </Text>
              {item.bookedStudents?.length > 0 && (
                <Text style={styles.studentsList}>
                  👥 {item.bookedStudents.join(", ")}
                </Text>
              )}
              <TouchableOpacity style={styles.startButton}>
                <Text style={styles.startButtonText}>Start Ride</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: "#f7f0ff",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#6A1B9A",
  },
  createRideCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6A1B9A",
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  createRideTitle: { color: "#fff", fontWeight: "700", fontSize: 18 },
  createRideSubtitle: { color: "#d8b9ff", fontSize: 14, marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionTitle: { color: "#000", fontWeight: "700", fontSize: 17, marginLeft: 8 },
  noRidesText: {
    textAlign: "center",
    color: "#6A1B9A",
    marginTop: 40,
    fontSize: 14,
  },
  rideCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  rideRoute: { color: "#333", fontWeight: "600", fontSize: 15, marginBottom: 6 },
  rideTime: { color: "#6A1B9A", fontSize: 13, marginBottom: 4 },
  rideSeats: { color: "#6A1B9A", fontSize: 13, marginBottom: 4 },
  studentsList: { color: "#555", fontSize: 13, marginBottom: 10 },
  startButton: {
    backgroundColor: "#6A1B9A",
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  startButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6A1B9A",
    marginTop: 2,
  },
});
