import { Auth, DataStore } from 'aws-amplify';
import React from 'react'
import { View, Text, Pressable, Alert } from 'react-native';
import { generateKeyPair } from '../utils/crypt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as UserModel } from '../src/models';
import { AdMobBanner } from "expo-ads-admob";
import { Platform } from "react-native";

export const PRIVATE_KEY = "PRIVATE_KEY";

const Settings = () => {
  const logOut = async () => {
    //await DataStore.clear(); <-まじで注意
    Auth.signOut();
  };

  // テスト用のID
  // 実機テスト時に誤ってタップしたりすると、広告の配信停止をされたりするため、テスト時はこちらを設定する
  const testUnitID = Platform.select({
    // https://developers.google.com/admob/ios/test-ads
    ios: 'ca-app-pub-6500766760315589/8392796690',
  });

  // 実際に広告配信する際のID
  // 広告ユニット（バナー）を作成した際に表示されたものを設定する
  const adUnitID = Platform.select({
    ios: 'ca-app-pub-6500766760315589/8392796690',
  });

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

      <View style={{ alignItems: "center", }}>
        <AdMobBanner
          bannerSize="smartBannerPortrait"
          adUnitID={testUnitID}
          servePersonalizedAds // パーソナライズされた広告の可否。App Tracking Transparencyの対応時に使用。
        />
      </View>


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
