import { Auth, DataStore } from 'aws-amplify';
import React from 'react'
import { View, Text, Pressable, Alert } from 'react-native';
import { generateKeyPair } from '../utils/crypt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as UserModel } from '../src/models';

export const PRIVATE_KEY = "PRIVATE_KEY";

const Settings = () => {
  const logOut = async () => {
    //await DataStore.clear(); <-まじで注意
    Auth.signOut();
  };

  const updateKeyPair = async () => {
    // generate private/public Key
    const { publicKey, secretKey } = generateKeyPair();
    console.log(publicKey, secretKey);
    // save private key to Async storage
    await AsyncStorage.setItem(PRIVATE_KEY, secretKey.toString());
    // save public key to UserModel in DataStore
    const userData = await Auth.currentAuthenticatedUser();
    const dbUser = await DataStore.query(UserModel, userData.attributes.sub);

    if (!dbUser) {
      Alert.alert("User not found");
      return;
    }

    await DataStore.save(
      UserModel.copyOf(dbUser, (updated) => {
        updated.publicKey = publicKey.toString();
      })
    );

    console.log(dbUser);

    Alert.alert("Successfully updated the Keypair");
  };

  return (
    <View>
      <Text>Settings</Text>

      <Pressable onPress={updateKeyPair} style={{ backgroundColor: 'blue', height: 50, margin: 10, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white' }}>Update Keypair</Text>
      </Pressable>

      <Pressable onPress={logOut} style={{ backgroundColor: '#8a2be2', height: 50, margin: 10, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white' }}>Logout</Text>
      </Pressable>
    </View>
  )
}

export default Settings
