import React, { useState, useEffect } from 'react';

import { View, StyleSheet, FlatList, Pressable, Text, SafeAreaView } from 'react-native';
import UserItem from '../components/UserItem';
import NewGroupButton from '../components/NewGroupButton';
import { useNavigation } from '@react-navigation/native';
import { Auth, DataStore } from 'aws-amplify';
import { ChatRoom, User, ChatRoomUser } from '../src/models';

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isNewGroup, setIsNewGroup] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    DataStore.query(User).then(setUsers);
  }, [])

  // useEffect(() => {
  //   // query users
  //   const fetchUsers = async () => {
  //     const fetchedUsers = await DataStore.query(User);
  //     setUsers(fetchedUsers);
  //   };
  //   fetchUsers();
  // }, [])

  const addUserToChatRoom = async (user, chatroom) => {
    DataStore.save(
      new ChatRoomUser({ user, chatroom })
    )
  }

  const createChatRoom = async (users) => {
    // TODO if there is already a chat room between these 2 users
    // Then redirect to the existing chat room
    // otherwise, create a new chatroom with these users

    // チャットルームに紐付けられた認証済みのUserをつなげる
    const authUser = await Auth.currentAuthenticatedUser();
    const dbUser = await DataStore.query(User, authUser.attributes.sub);

    // Create a chat room
    const newChatRoomData = {
      newMessages: 0,
      Admin: dbUser,
    };
    if (users.length > 1) {
      newChatRoomData.name = "Group";
      newChatRoomData.imageUri = "https://64.media.tumblr.com/8d5b2654dd80b4e16017b960117a3e1a/8c79d50e0fe4e9b2-b1/s1280x1920/03a0058c1576d078275edbfd0cb6b9d708fb41bc.png";
    }
    const newChatRoom = await DataStore.save(new ChatRoom(newChatRoomData));
    // const newChatRoom = await DataStore.save(new ChatRoom({ newMessages: 0 }));

    if (dbUser) {
      await addUserToChatRoom(dbUser, newChatRoom);
    }

    // クリックした認証済みのUserをつなげる
    await Promise.all(
      users.map((user) => addUserToChatRoom(user, newChatRoom))
    );
    navigation.navigate('ChatRoom', { id: newChatRoom.id });
  };

  const isUserSelected = (user) => {
    return selectedUsers.some((selectedUser) => selectedUser.id === user.id);
    // someメソッドは配列が一つでも条件を満たしている場Trueを返す
  }

  const onUserPress = async (user) => {
    if (isNewGroup) {
      if (isUserSelected(user)) {
        // 選択を外す
        setSelectedUsers(
          selectedUsers.filter(selectedUser => selectedUser.id !== user.id)
        );
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    } else {
      await createChatRoom([user]);
    }
  }

  const saveGroup = async () => {
    await createChatRoom(selectedUsers);
  }

  return (
    <SafeAreaView style={styles.page}>
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <UserItem
            user={item}
            onPress={() => onUserPress(item)}
            isSelected={isNewGroup ? isUserSelected(item) : undefined}
          // ↑isSelectedをUserItem.tsxに送り、trueになったユーザーを選択していることを示す
          />
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <NewGroupButton onPress={() => setIsNewGroup(!isNewGroup)} />
        )}
      />
      {isNewGroup && (
        <Pressable style={styles.button} onPress={saveGroup}>
          <Text style={styles.buttonText}>
            Save Group ({selectedUsers.length})
          </Text>
        </Pressable>
      )}
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: 'white',
    flex: 1
  },
  button: {
    backgroundColor: 'blueviolet',
    marginHorizontal: 10,
    marginBottom: 20,
    padding: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
