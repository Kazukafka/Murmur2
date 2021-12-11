import React, { useEffect, useState } from "react";
import { Text, View, Image, useWindowDimensions, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Auth, DataStore } from "aws-amplify";
import { ChatRoom, ChatRoomUser, User } from "../src/models";
import moment from "moment";
import { useNavigation } from "@react-navigation/core";
// ({id, children})でWarning、理由はChildrenが使われてないから
const ChatRoomHeader = ({ id }) => {
  const { width } = useWindowDimensions();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | undefined>(undefined);

  const navigation = useNavigation();

  const fetchUsers = async () => {
    const fetchedUsers = (await DataStore.query(ChatRoomUser))
      .filter(chatRoomUser => chatRoomUser.chatroom.id === id)
      .map(chatRoomUser => chatRoomUser.user);

    setAllUsers(fetchedUsers);

    const authUser = await Auth.currentAuthenticatedUser();
    setUser(fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null);
  };

  const fetchChatRoom = async () => {
    DataStore.query(ChatRoom, id).then(setChatRoom);//nullではなくundefinedで定義
  }

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchUsers();
    fetchChatRoom();
  }, []);

  const getLastOnlineText = () => {
    if (!user?.lastOnlineAt) {
      return null;
    }
    //５分前でであればオンラインとして表示
    const lastOnlineDIffMS = moment().diff(moment(user?.lastOnlineAt));
    if (lastOnlineDIffMS < 5 * 60 * 1000) {
      return 'online'
    } else {
      return `Last seen online ${moment(user.lastOnlineAt).fromNow()}`;
    }
  };

  const getUsernames = () => {
    return allUsers.map(user => user.name).join(', ');
  };

  const openInfo = () => {
    // resirect to info page
    navigation.navigate("GroupInfoScreen", { id });
  }

  const isGroup = allUsers.length > 2;

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: width - 25,
      marginLeft: 25,
      padding: 10,
      alignItems: 'center',
    }}>
      <Image
        source={{
          uri: chatRoom?.imageUri || user?.imageUri
        }}
        style={{ width: 30, height: 30, borderRadius: 30 }}
      />
      <Pressable onPress={openInfo} style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontWeight: 'bold' }}>
          {chatRoom?.name || user?.name}
        </Text>
        <Text numberOfLines={1}>
          {isGroup ? getUsernames() : getLastOnlineText()}
        </Text>
      </Pressable>
      <Feather name="camera" size={24} color="blueviolet" style={{ marginHorizontal: 10 }} />
      <Feather name="edit-2" size={24} color="blueviolet" style={{ marginHorizontal: 10 }} />
    </View>
  );
};

export default ChatRoomHeader;
