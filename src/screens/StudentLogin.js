// src/screens/StudentLogin.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { saveToken, saveUser } from '../utils/auth';

const BACKEND_URL = 'https://rydy-backend.onrender.com/api/students/login';

const StudentLogin = ({ navigation }) => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!studentId.trim() || !password.trim()) { Alert.alert('Validation', 'Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universityId: studentId, password }),
      });
      const data = await response.json().catch(() => null);
      setLoading(false);
      if (!response.ok) { Alert.alert('Login Failed', data?.message || 'Invalid credentials'); return; }

      if (data.token) {
        await saveToken(data.token);
        await saveUser(data.student);
      }

      Alert.alert('Welcome', `Hello ${data.student.name}!`);
      navigation.replace('StudentHome');
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      Alert.alert('Network Error', 'Unable to reach the server. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/rydy_logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Student Login</Text>
        <Text style={styles.subtitle}>Sign in with your University ID</Text>

        <View style={styles.form}>
          <Text style={styles.label}>University ID</Text>
          <TextInput value={studentId} onChangeText={setStudentId} placeholder="e.g. 2021-ABC-123" placeholderTextColor="#a68bc6" style={styles.input} autoCapitalize="none" />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor="#a68bc6" style={styles.input} secureTextEntry autoCapitalize="none" />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StudentSignup')}>
              <Text style={styles.signupLink}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default StudentLogin;

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f7f0ff' },
  container: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  logo: { width: 180, height: 180, marginTop: 8, marginBottom: 8 },
  title: { color: '#6A1B9A', fontSize: 28, fontWeight: '800', marginTop: 6 },
  subtitle: { color: '#6A1B9A', fontSize: 14, marginTop: 6, marginBottom: 18, textAlign: 'center' },
  form: { width: '100%', marginTop: 8 },
  label: { color: '#6A1B9A', fontSize: 13, marginBottom: 6, marginLeft: 4, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#ead9ff', shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
  loginButton: { backgroundColor: '#6A1B9A', paddingVertical: 14, borderRadius: 30, marginTop: 28, alignItems: 'center' },
  loginButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  signupText: { color: '#6A1B9A', fontSize: 14 },
  signupLink: { color: '#6A1B9A', fontSize: 14, fontWeight: '700' },
});
