import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/core';
import { DataStore } from '@aws-amplify/datastore';
import { ChatRoom, Message as MessageModel } from '../src/models';
import Message from '../components/Message';
import MessageInput from '../components/MessageInput';
import { SortDirection } from 'aws-amplify';
// ↑は@aws-amplify/databaseからではなく＠なしaws-amplifyからのimport

export default function ChatRoomScreen() {
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);

  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    fetchChatRoom();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [chatRoom]);

  // reloadを自動で（realtimeにする）from amplify docs -> search "real time"
  useEffect(() => {
    const subscription = DataStore.observe(MessageModel).subscribe(msg => {
      // console.log(msg.model, msg.opType, msg.element);
      if (msg.model === MessageModel && msg.opType === 'INSERT') {
        setMessages((existingMessage) => [msg.element, ...existingMessage])
      }
    });
    // not to forget unsubscribe
    return () => subscription.unsubscribe();
  }, []);

  const fetchChatRoom = async () => {
    if (!route.params?.id) {
      console.warn("No chatRoom is provided");
      return;
    }
    const chatRoom = await DataStore.query(ChatRoom, route.params.id);
    if (!chatRoom) {
      console.error("Could not find a chat room with this ID");
    } else {
      setChatRoom(chatRoom);
    }
  };

  const fetchMessages = async () => {
    if (!chatRoom) {
      return;
    }
    // ↓このmessageはデータベースレイヤー、だからchatroomIDが自動で表示される, ep=equal
    const fetchedMessages = await DataStore.query(
      MessageModel,
      message => message.chatroomID("eq", chatRoom?.id),
      {
        sort: message => message.createdAt(SortDirection.DESCENDING)
      }
      // ↑Amplify DocからSortのやり方を真似る
    );
    //console.log(fetchedMessages); // 出力が空のArray[]だったので、直す ←の確認はチャットの送信でも使う
    setMessages(fetchedMessages);
  };

  if (!chatRoom) {
    return <ActivityIndicator />
  }

  return (
    <SafeAreaView style={styles.page}>
      <FlatList
        // data={chatRoomData.messages}
        data={messages}
        renderItem={({ item }) => <Message message={item} />}
        inverted
      />
      {/* ↓MessageInput.tsxにChatRoomIdを送る */}
      {/* updateLastMessageに使うためchatRoomを送る */}
      <MessageInput chatRoom={chatRoom} />
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: 'white',
    flex: 1,
  }
})
