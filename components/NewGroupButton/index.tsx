import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { FontAwesome } from '@expo/vector-icons';

const NewGroupButton = ({ onPress }) => {
  return (
    <Pressable onPress={onPress}>
      <View style={{ flexDirection: "row", padding: 10, alignItems: "center" }}>
        <FontAwesome name="group" size={24} color="#4f4f4f" />
        <Text style={{ marginLeft: 10, fontWeight: "bold" }}>NewGroup</Text>
      </View>
    </Pressable>
  )
}

export default NewGroupButton
