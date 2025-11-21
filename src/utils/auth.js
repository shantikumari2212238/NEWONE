// src/utils/auth.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKEN_KEY = "rydy_token";
export const USER_KEY = "rydy_user";

/**
 * Save JWT token (string)
 */
export async function saveToken(token) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (err) {
    console.error("saveToken error:", err);
    return false;
  }
}

/**
 * Get JWT token (string) or null
 */
export async function getToken() {
  try {
    const t = await AsyncStorage.getItem(TOKEN_KEY);
    return t || null;
  } catch (err) {
    console.error("getToken error:", err);
    return null;
  }
}

/**
 * Remove token + user
 */
export async function removeToken() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    return true;
  } catch (err) {
    console.error("removeToken error:", err);
    return false;
  }
}

/**
 * Save logged-in user object (small)
 */
export async function saveUser(user) {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user || {}));
    return true;
  } catch (err) {
    console.error("saveUser error:", err);
    return false;
  }
}

/**
 * Get user object or null
 */
export async function getUser() {
  try {
    const s = await AsyncStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch (err) {
    console.error("getUser error:", err);
    return null;
  }
}

/**
 * Return headers object for authenticated requests.
 * If no token found, returns {} (empty).
 */
export async function getAuthHeader() {
  try {
    const token = await getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  } catch (err) {
    console.error("getAuthHeader error:", err);
    return {};
  }
}
