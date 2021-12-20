/**
 * If you are not familiar with React Navigation, check out the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { ColorSchemeName, View, Text, Image, useWindowDimensions, Pressable, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';

import NotFoundScreen from '../screens/NotFoundScreen';
import { RootStackParamList } from '../types';
import LinkingConfiguration from './LinkingConfiguration';

import ChatRoomScreen from '../screens/ChatRoomScreen';
import HomeScreen from '../screens/HomeScreen';
import UsersScreen from '../screens/UsersScreen';
import Settings from '../screens/Settings';
import Camera from '../screens/Camera';

import ChatRoomHeader from './ChatRoomHeader';
import GroupInfoScreen from '../screens/GroupInfoScreen';

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

// A root stack navigator is often used for displaying modals on top of all other content
// Read more here: https://reactnavigation.org/docs/modal
const Stack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerTitle: HomeHeader }}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={({ route }) => ({
          headerTitle: () => <ChatRoomHeader id={route.params?.id} />,
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="GroupInfoScreen"
        component={GroupInfoScreen}
        options={{
          title: "Group Members",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
      />
      <Stack.Screen
        name="Camera"
        component={Camera}
      />
      <Stack.Screen
        name="UsersScreen"
        component={UsersScreen}
        options={{
          title: "Users",
        }}
      />
      {/* <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} /> */}
    </Stack.Navigator>
  );
}

const HomeHeader = (props) => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      width,
      padding: 10,
      alignItems: 'center',
    }}>
      <Pressable onPress={() => navigation.navigate('Settings')}>
        <Feather name="settings" size={25} color="blueviolet" style={{ marginHorizontal: 10 }} />
      </Pressable>
      <Text style={{ flex: 1, textAlign: 'center', marginLeft: 35, fontWeight: 'bold' }}>Murmur</Text>
      <Pressable onPress={() => navigation.navigate('Camera')}>
        <Feather name="camera" size={25} color="blueviolet" style={{ marginHorizontal: 10 }} />
      </Pressable>
      <Pressable onPress={() => navigation.navigate('UsersScreen')}>
        <Feather name="edit-3" size={25} color="blueviolet" style={{ marginHorizontal: 10 }} />
      </Pressable>
    </View>
  )
};

