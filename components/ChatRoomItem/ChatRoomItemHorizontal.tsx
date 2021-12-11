import React, { useState, useEffect } from 'react';
import { Text, Image, View, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { DataStore } from '@aws-amplify/datastore';
import { ChatRoomUser, User, Message } from '../../src/models';
import styles from './styles';
import { Auth } from 'aws-amplify';
import moment from 'moment';

export default function ChatRoomItemHorizontal({ chatRoom }) {
  // Array of User -> "<User[]>' それをinitializeする([])
  // const [users, setUsers] = useState<User[]>([]); // このChatRoomのすべてのUser
  const [user, setUser] = useState<User | null>(null); //user"S"ではなく「displayUser」であることに注意
  const [lastMessage, setLastMessage] = useState<Message | undefined>();
  const [isLoading, setIsLoading] = useState(true);

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
    <Pressable onPress={onPress} style={styles.verticalcontainer}>
      <Image
        source={{ uri: chatRoom.imageUri || user?.imageUri }}
        style={styles.image}
      />
      {!!chatRoom.newMessages && <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{chatRoom.newMessages}</Text>
      </View>}
      <Text style={styles.smallname}>{chatRoom.name || user?.name}</Text>
    </Pressable >
  );
}
