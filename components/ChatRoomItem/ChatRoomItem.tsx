import React, { useState, useEffect } from 'react';
import { Text, Image, View, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { DataStore } from '@aws-amplify/datastore';
import { ChatRoomUser, User, Message } from '../../src/models';
import styles from './styles';
import { Auth } from 'aws-amplify';
import moment from 'moment';

export default function ChatRoomItem({ chatRoom }) {
  // Array of User -> "<User[]>' それをinitializeする([])
  // const [users, setUsers] = useState<User[]>([]); // このChatRoomのすべてのUser
  const [user, setUser] = useState<User | null>(null); //user"S"ではなく「displayUser」であることに注意
  const [lastMessage, setLastMessage] = useState<Message | undefined>();

  const navigation = useNavigation();

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = (await DataStore.query(ChatRoomUser))
        .filter(chatRoomUser => chatRoomUser.chatroom.id === chatRoom.id)
        .map(chatRoomUser => chatRoomUser.user);

      const authUser = await Auth.currentAuthenticatedUser();
      // user => user.id !== authUser.attributes.subが===だと自分の画像になる
      // 個別のチャットをつなげてグループチャットにするのではなく、人数が二人なのが個別のチャットだと考える
      setUser(fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null);
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

  if (!user) {
    return <ActivityIndicator />
  }

  const time = moment(lastMessage?.createdAt).from(moment());

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Image
        source={{ uri: chatRoom.imageUri || user.imageUri }}
        style={styles.image}
      />

      {!!chatRoom.newMessages && <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{chatRoom.newMessages}</Text>
      </View>}

      <View style={styles.rightContainer}>
        <View style={styles.row}>
          <Text style={styles.name}>{chatRoom.name || user.name}</Text>
          <Text style={styles.text}>{time}</Text>
        </View>
        <Text numberOfLines={1} style={styles.text}>{lastMessage?.content}</Text>
      </View>
    </Pressable>
  );
}
