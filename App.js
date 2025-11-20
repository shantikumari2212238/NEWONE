// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// import screens from src/screens (consistent)
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import StudentLogin from './src/screens/StudentLogin';
import StudentSignup from './src/screens/StudentSignup';
import StudentHome from './src/screens/StudentHome';
import DriverLogin from './src/screens/DriverLogin';
import DriverSignup from './src/screens/DriverSignup';
import DriverHome from './src/screens/DriverHome';
import CreateRide from './src/screens/CreateRide';
import BookRide from './src/screens/BookRide';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />

        {/* Student Flow */}
        <Stack.Screen name="StudentLogin" component={StudentLogin} />
        <Stack.Screen name="StudentSignup" component={StudentSignup} />
        <Stack.Screen name="StudentHome" component={StudentHome} />
        <Stack.Screen name="BookRide" component={BookRide} />

        {/* Driver Flow */}
        <Stack.Screen name="DriverLogin" component={DriverLogin} />
        <Stack.Screen name="DriverSignup" component={DriverSignup} />
        <Stack.Screen name="DriverHome" component={DriverHome} />
        <Stack.Screen name="CreateRide" component={CreateRide} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
