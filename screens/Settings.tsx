import { Auth, DataStore } from 'aws-amplify';
import React from 'react'
import { View, Text, Pressable } from 'react-native';
import { generateKeyPair } from '../utils/crypt';

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
    // save public key to UserModel in DataStore
  };

  return (
    <View>
      <Text>Settings</Text>

      <Pressable onPress={updateKeyPair} style={{ backgroundColor: '#8a2be2', height: 50, margin: 10, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white' }}>Logout</Text>
      </Pressable>

      <Pressable onPress={logOut} style={{ backgroundColor: '#8a2be2', height: 50, margin: 10, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white' }}>Logout</Text>
      </Pressable>
    </View>
  )
}

export default Settings
