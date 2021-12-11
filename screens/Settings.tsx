import { Auth, DataStore } from 'aws-amplify';
import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, Alert } from 'react-native';
import { generateKeyPair } from '../utils/crypt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatRoomUser, User as UserModel } from '../src/models';
import { AdMobBanner } from "expo-ads-admob";
import { Platform } from "react-native";
import StripeApp from './StripeApp';
import Modal from "react-native-modal";
// ↑npm ではなく yarnでインストール、本来混ぜるのは非推奨なので注意!!
import Advertisement from '../components/Advertisement';
import { AntDesign } from '@expo/vector-icons';
import { ChatRoom } from '../src/models';
import { FlatList } from 'react-native-gesture-handler';
import ChatRoomItemRoot from '../components/ChatRoomItem/ChatRoomItemRoot';

export const PRIVATE_KEY = "PRIVATE_KEY";

const Settings = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    const fetchChatRooms = async () => {
      const userData = await (await Auth.currentAuthenticatedUser());
      // ↑二重Awaitしないとデータを取得に時間がかかり再度ログインが必要になる、、、おそらくAuthのデフォ問題？？？

      //Consoleで出力をこまめに確認して、filiterで所有者のChatRoomを、mapでChatRoom単体を取り出す

      const chatRooms = (await DataStore.query(ChatRoomUser))
        .filter(chatRoomUser => chatRoomUser.user.id === userData.attributes.sub)
        .map(chatRoomUser => chatRoomUser.chatroom);
      // console.log(chatRooms);
      setChatRooms(chatRooms);
    };
    fetchChatRooms();
  }, []);

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

  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <View>
      <Advertisement />

      <Pressable onPress={updateKeyPair} style={{ backgroundColor: '#ba55d3', height: 50, margin: 10, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white' }}>Update Keypair</Text>
      </Pressable>

      <Pressable onPress={toggleModal} style={{ backgroundColor: 'green', height: 50, margin: 10, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white' }}>Become Premium</Text>
      </Pressable>

      <Pressable onPress={logOut} style={{ backgroundColor: '#8a2be2', height: 50, margin: 10, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white' }}>Logout</Text>
      </Pressable>

      <Modal isVisible={isModalVisible}>
        <StripeApp />
        <View style={{ flex: 0.2 }}>
          <Pressable style={{ alignItems: 'center', justifyContent: 'center' }}>
            <AntDesign
              onPress={toggleModal}
              name='close'
              size={25}
              color="white"
              style={{ margin: 10, alignItems: 'center', justifyContent: 'center' }}
            />
          </Pressable>
        </View>
      </Modal>

      <FlatList
        data={chatRooms}
        renderItem={({ item }) => <ChatRoomItemRoot chatRoom={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default Settings
