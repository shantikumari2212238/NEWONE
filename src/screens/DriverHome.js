// inside src/screens/DriverHome.js -> replace fetchRides() with:

import { getAuthHeader, getToken, removeToken } from "../utils/auth";

/* ... */

const fetchRides = async () => {
  setLoading(true);
  try {
    const token = await getToken();
    if (!token) {
      setLoading(false);
      Alert.alert("Not authenticated", "Please login as driver.");
      navigation.replace("DriverLogin");
      return;
    }

    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_BASE}/api/rides?driver=true`, { headers });
    // parse response
    if (res.status === 401) {
      await removeToken();
      Alert.alert("Session expired", "Please login again.");
      navigation.replace("DriverLogin");
      return;
    }
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setRides(Array.isArray(data) ? data : []);
    } else {
      console.log("Fetch rides error", data);
      Alert.alert("Error", data?.message || "Failed to fetch rides");
    }
  } catch (err) {
    console.error("Error fetching rides:", err);
    Alert.alert("Error", "Failed to fetch rides from server");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
