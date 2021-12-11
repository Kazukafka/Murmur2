import React, { useState, useEffect } from 'react';
import { Text, Image, View, Pressable, ActivityIndicator, AsyncStorage, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { DataStore } from '@aws-amplify/datastore';
import { ChatRoomUser, Message, User, User as UserModel } from '../../src/models';
import styles from './styles';
import { Auth } from 'aws-amplify';
import moment from 'moment';
import { generateKeyPair } from '../../utils/crypt';

export const PRIVATE_KEY = "PRIVATE_KEY"

export default function ChatRoomItem({ chatRoom }) {
  // Array of User -> "<User[]>' それをinitializeする([])
  // const [users, setUsers] = useState<User[]>([]); // このChatRoomのすべてのUser
  const [user, setUser] = useState<User | null>(null); //user"S"ではなく「displayUser」であることに注意
  const [lastMessage, setLastMessage] = useState<Message | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();

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

  // useEffect(() => {
  //   updateKeyPair();
  // })

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = (await DataStore.query(ChatRoomUser))
        .filter(chatRoomUser => chatRoomUser.chatroom.id === chatRoom.id)
        .map(chatRoomUser => chatRoomUser.user);

      const authUser = await Auth.currentAuthenticatedUser();
      // user => user.id !== authUser.attributes.subが===だと自分の画像になる
      // 個別のチャットをつなげてグループチャットにするのではなく、人数が二人なのが個別のチャットだと考える

      setUser(fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null);
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!chatRoom.chatRoomLastMessageId) { return }
    DataStore.query(Message, chatRoom.chatRoomLastMessageId).then(setLastMessage);
  }, [])

  const onPress = () => {
    navigation.navigate('ChatRoom', { id: chatRoom.id });
  }

  if (isLoading) {
    return <ActivityIndicator />
  }

  const time = moment(lastMessage?.createdAt).from(moment());

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Image
        source={{ uri: chatRoom.imageUri || user?.imageUri }}
        style={styles.image}
      />

      {!!chatRoom.newMessages && <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{chatRoom.newMessages}</Text>
      </View>}

      <View style={styles.rightContainer}>
        <View style={styles.column}>
          <Text style={styles.name}>{chatRoom.name || user?.name}</Text>
          <Text style={styles.text}>{time}</Text>
        </View>
        <Text numberOfLines={1} style={styles.text}>{lastMessage?.content}</Text>
      </View>
    </Pressable>
  );
}
