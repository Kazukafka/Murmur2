import { useRoute } from '@react-navigation/native';
import { DataStore, Auth } from 'aws-amplify';
import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet, Alert } from 'react-native'
import { FlatList } from 'react-native-gesture-handler';
import UserItem from '../../components/UserItem/UserItem';
import { ChatRoom, User, ChatRoomUser } from '../../src/models';

const GroupInfoScreen = () => {
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const route = useRoute();

  useEffect(() => {
    fetchChatRoom();
    fetchUsers();
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

  const fetchUsers = async () => {
    const fetchedUsers = (await DataStore.query(ChatRoomUser))
      .filter(chatRoomUser => chatRoomUser.chatroom.id === route.params?.id)
      .map(chatRoomUser => chatRoomUser.user);

    setAllUsers(fetchedUsers);
  };

  const confirmDelete = async (user) => {
    // AuthUserがアドミンかどうか？チェック
    const authData = await Auth.currentAuthenticatedUser();
    if (chatRoom?.Admin?.id !== authData.attributes.sub) {
      Alert.alert("You are NOT the admin of this group");
      return;
    }

    if (user.id === chatRoom?.Admin?.id) {
      Alert.alert("You are the admin, cannot delete youself");
      return;
    }

    Alert.alert(
      "Confirm delete",
      `Are you sure you wanna delete ${user.name} from the group`,
      [
        {
          text: "Delete",
          onPress: () => deleteUser(user),
          style: "destructive",
        },
        {
          text: "Cancel",
        }
      ]
    )
  }

  const deleteUser = async (user) => {
    const chatRoomUsersToDelete = await (
      await DataStore.query(ChatRoomUser)
    ).filter(
      (cru) => cru.chatroom.id === chatRoom.id && cru.user.id === user.id
    );

    if (chatRoomUsersToDelete.length > 0) {
      await DataStore.delete(chatRoomUsersToDelete[0]);

      setAllUsers(allUsers.filter((u) => u.id === user.id));
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{chatRoom?.name}</Text>

      <Text style={styles.title}>Users ({allUsers.length})</Text>
      <FlatList
        data={allUsers}
        renderItem={({ item }) => (
          <UserItem
            user={item}
            isAdmin={chatRoom?.Admin?.id === item.id}
            onLongPress={() => confirmDelete(item)}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'white',
    padding: 10,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 10,
  },
})

export default GroupInfoScreen;
