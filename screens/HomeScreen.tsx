import React, { useState, useEffect, useCallback } from 'react';

import { Text, View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Auth, DataStore } from 'aws-amplify';
import { ChatRoom, User, ChatRoomUser } from '../src/models';
import ChatRoomItem from '../components/ChatRoomItem';
import Advertisement from '../components/Advertisement';

import UserItem from '../components/UserItem';
import ChatRoomItemHorizontal from '../components/ChatRoomItem/ChatRoomItemHorizontal';
import { ScrollView } from 'react-native-gesture-handler';
import UsersScreen from './UsersScreen';

const sleep = (msec: number | undefined) => new Promise(resolve => setTimeout(resolve, msec));

export default function TabOneScreen() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    DataStore.query(User).then(setUsers);
  }, [])

  // const [text, setText] = useState('上に引っ張って更新');

  //======https://zenn.dev/nekoniki/articles/168433394ae394====を参考に引っ張って更新↓
  const [refreshing, setRefreshing] = useState(false);

  const anyFunction = useCallback(async () => {
    setRefreshing(true);
    // 非同期処理(実際にはここでデータの更新を行う)
    await sleep(1000);
    // setText('更新しました!');
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const fetchChatRooms = async () => {
      const userData = await (await Auth.currentAuthenticatedUser());
      // ↑二重Awaitしないとデータを取得に時間がかかり再度ログインが必要になる、、、おそらくAuthのデフォ問題？？？

      //Consoleで出力をこまめに確認して、filiterで所有者のChatRoomを、mapでChatRoom単体を取り出す

      const chatRooms = (await DataStore.query(ChatRoomUser))
        .filter(chatRoomUser => chatRoomUser.user.id === userData.attributes.sub)
        .map(chatRoomUser => chatRoomUser.chatroom);
      setChatRooms(chatRooms);
    };
    fetchChatRooms();
  }, []);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={anyFunction} />
      }
      style={styles.page}>
      <Advertisement />

      <FlatList
        data={users}
        renderItem={({ item }) => (
          <UserItem
            user={item}
          />
        )}
        showsVerticalScrollIndicator={false}
        horizontal
      />

      <FlatList
        data={chatRooms}
        renderItem={({ item }) => <ChatRoomItem chatRoom={item} />}
        showsVerticalScrollIndicator={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: 'white',
    flex: 1
  }
});
// function sleep(arg0: number) {
//   throw new Error('Function not implemented.');
// }

