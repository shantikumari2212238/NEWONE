import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topCircle} />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Rydy</Text>
        <Text style={styles.subtitle}>Hop in and ride with ease!</Text>
        <Text style={styles.tagline}>
          your daily and monthly campus transit partner
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.studentButton}
            onPress={() => navigation.navigate('StudentLogin')}
          >
            <Text style={styles.buttonText}>Student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.driverButton}
            onPress={() => navigation.navigate('DriverLogin')}
          >
            <Text style={styles.buttonText}>Driver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.3,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: '#f3d9ff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5e2a84',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5e2a84',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#5e2a84',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 40,
  },
  studentButton: {
    backgroundColor: '#6A1B9A',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  driverButton: {
    backgroundColor: '#6A1B9A',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
