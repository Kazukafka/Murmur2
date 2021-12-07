import React, { useState, useEffect } from 'react';

import { View, StyleSheet, FlatList } from 'react-native';
import { Auth, DataStore } from 'aws-amplify';
import { ChatRoom, ChatRoomUser } from '../src/models';
import ChatRoomItem from '../components/ChatRoomItem';

// import chatRoomsData from '../assets/dummy-data/ChatRooms';

export default function TabOneScreen() {
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

  return (
    <View style={styles.page}>
      <FlatList
        data={chatRooms}
        renderItem={({ item }) => <ChatRoomItem chatRoom={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>

  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: 'white',
    flex: 1
  }
});
