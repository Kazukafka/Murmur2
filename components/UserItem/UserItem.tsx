import React from 'react';
import { Text, Image, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import styles from './styles';
import { Feather } from '@expo/vector-icons';

export default function UserItem({
  user,
  onPress,
  onLongPress,
  isSelected,
  isAdmin = false
}) { // null \ false | true
  const navigation = useNavigation();

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.container}>
      <Image source={{ uri: user.imageUri }} style={styles.image} />

      <View style={styles.rightContainer}>
        <Text style={styles.name}>{user.name}</Text>
        {isAdmin && <Text>admin</Text>}
      </View>

      {/* <Feather name={isSelected ? 'check-circle' : 'circle'} size={20} color="#4f4f4f" /> */}
      {/* 上だと１−１のチャットルーム作成と区別できない、よってisSelected=nullをisSelectedのまま残し、↓で調整 */}
      {isSelected !== undefined && (
        <Feather name={isSelected ? 'check-circle' : 'circle'} size={20} color="#4f4f4f" />
      )}
      {/* ↑null は何かを返すべきですが、返すものがない場合。 意図的に使われる。 
      undefined はただ何もない状態。 何も return しない関数の返り値などは全て undefined です */}
    </Pressable>
  );
}
