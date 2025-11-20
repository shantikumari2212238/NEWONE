import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome6";

const StudentHome = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f7f0ff" barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <FontAwesome name="bus" size={28} color="#6A1B9A" />
          <Text style={styles.logoText}>Rydy</Text>
        </View>
        <FontAwesome name="bell" size={22} color="#6A1B9A" />
      </View>

      <Text style={styles.welcomeText}>Welcome Back to Rydy!</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search for vans or driver"
        placeholderTextColor="#888"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.mainButton, styles.activeButton]}>
          <Text style={styles.mainButtonTextActive}>Daily Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mainButton}>
          <Text style={styles.mainButtonText}>Daily Rides</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate("BookRide")}
        >
          <FontAwesome name="location-dot" size={16} color="#6A1B9A" />
          <Text style={styles.optionText}>Book a Ride</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton}>
          <FontAwesome name="bus" size={16} color="#6A1B9A" />
          <Text style={styles.optionText}>Track my Van</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.optionButton}>
          <FontAwesome name="credit-card" size={16} color="#6A1B9A" />
          <Text style={styles.optionText}>My subscriptions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton}>
          <FontAwesome name="comments" size={16} color="#6A1B9A" />
          <Text style={styles.optionText}>Chat with Driver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity>
          <FontAwesome name="house" size={22} color="#6A1B9A" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <FontAwesome name="clipboard-list" size={22} color="#6A1B9A" />
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <FontAwesome name="user" size={22} color="#6A1B9A" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StudentHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f0ff",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    color: "#6A1B9A",
    fontSize: 24,
    fontWeight: "800",
    marginLeft: 8,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#6A1B9A",
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: "#e0d6eb",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#333",
    marginBottom: 25,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  mainButton: {
    flex: 1,
    backgroundColor: "#e5d4f8",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 4,
  },
  activeButton: {
    backgroundColor: "#6A1B9A",
  },
  mainButtonText: {
    color: "#6A1B9A",
    fontWeight: "700",
  },
  mainButtonTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1e4ff",
    paddingVertical: 12,
    justifyContent: "center",
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
  },
  optionText: {
    color: "#6A1B9A",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#f1e4ff",
    borderTopWidth: 1,
    borderColor: "#e0d6eb",
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navTextActive: {
    fontSize: 12,
    color: "#6A1B9A",
    fontWeight: "700",
    marginTop: 2,
  },
  navText: {
    fontSize: 12,
    color: "#6A1B9A",
    marginTop: 2,
  },
});
