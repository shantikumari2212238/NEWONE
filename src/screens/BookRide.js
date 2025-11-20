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

const BACKEND_URL = "https://rydy-backend.onrender.com/api/rides";

const BookRide = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const res = await fetch(BACKEND_URL);
      const data = await res.json();
      setRides(data);
    } catch (err) {
      console.error("❌ Error fetching rides:", err);
      Alert.alert("Error", "Failed to fetch rides from the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async (rideId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/${rideId}/book`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: "Test Student" }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("✅ Ride Booked", "You successfully booked this ride!");
        fetchRides();
      } else {
        Alert.alert("Error", data.message || "Could not book this ride.");
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
        <Text style={styles.noRidesText}>
          No rides available right now. Please check back later.
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
              <Text style={styles.rideInfo}>🕒 {item.time}</Text>
              <Text style={styles.rideInfo}>
                🚗 {item.bookedSeats || 0}/{item.totalSeats} seats booked
              </Text>
              {item.bookedStudents?.length > 0 && (
                <Text style={styles.studentsList}>
                  👥 {item.bookedStudents.join(", ")}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.bookButton,
                  item.bookedSeats >= item.totalSeats && { backgroundColor: "#bbb" },
                ]}
                disabled={item.bookedSeats >= item.totalSeats}
                onPress={() => handleBookRide(item._id)}
              >
                <Text style={styles.bookButtonText}>
                  {item.bookedSeats >= item.totalSeats ? "Full" : "Book Ride"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default BookRide;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f0ff",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#6A1B9A",
    textAlign: "center",
    marginBottom: 20,
  },
  noRidesText: {
    textAlign: "center",
    color: "#6A1B9A",
    marginTop: 40,
    fontSize: 16,
    fontWeight: "500",
  },
  rideCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  rideRoute: {
    color: "#333",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
  },
  rideInfo: {
    color: "#6A1B9A",
    fontSize: 14,
    marginBottom: 4,
  },
  studentsList: {
    color: "#555",
    fontSize: 13,
    marginBottom: 10,
  },
  bookButton: {
    backgroundColor: "#6A1B9A",
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
