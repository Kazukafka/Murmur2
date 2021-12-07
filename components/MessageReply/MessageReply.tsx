import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions, Pressable } from 'react-native';
import { DataStore } from '@aws-amplify/datastore';
import { User } from '../../src/models';
import { Auth, Storage } from 'aws-amplify';
import { S3Image } from 'aws-amplify-react-native';
import AudioPlayer from '../AudioPlayer';
import { AntDesign } from '@expo/vector-icons';
import { Message as MessageModel } from "../../src/models";

const blue = '#8a2be2'; // blueviolet
const grey = 'lightgrey';

const MessageReply = (props) => {
  const { message: propMessage } = props;

  const [message, setMessage] = useState<MessageModel>(propMessage);
  const [user, setUser] = useState<User | undefined>();
  const [isMe, setIsMe] = useState<boolean | null>(null);
  const [soundURI, setSoundURI] = useState<any>(null);

  const { width } = useWindowDimensions();

  useEffect(() => {
    DataStore.query(User, message.userID).then(setUser);
  }, []);

  useEffect(() => {
    if (message.audio) {
      Storage.get(message.audio).then(setSoundURI);
    }
  }, [message])

  useEffect(() => {
    const checkIfMe = async () => {
      if (!user) {
        return;
      }
      const authUser = await Auth.currentAuthenticatedUser();
      setIsMe(user.id === authUser.attributes.sub);
    }
    checkIfMe();
  }, [user]);

  if (!user) {
    return <ActivityIndicator />
  }

  return (
    <View
      style={[
        styles.container,
        isMe ? styles.rightContainer : styles.leftContainer,
        { width: soundURI ? "75%" : "auto" },
      ]}
    >

      <View style={styles.row}>
        {message.image && (
          <View style={{ marginBottom: message.content ? 20 : 0 }}>
            {/* 写真送信時の不自然な下の余白を消す↓ 上のmarginBottomも調整 */}
            <S3Image
              imgKey={message.image}
              style={{ width: width * 0.65, aspectRatio: 4 / 3 }}
              resizeMode="contain"
            />
          </View>
        )}

        {soundURI && <AudioPlayer soundURI={soundURI} />}
        {!!message.content && (
          <Text style={{ color: isMe ? 'black' : 'white' }}>
            {message.content}
          </Text>
        )}

        {isMe && message.status && message.status !== 'SENT' && (
          <AntDesign
            name={message.status === 'DELIVERED' ? "checkcircleo" : "checkcircle"}
            size={16}
            color="grey"
            style={{ marginHorizontal: 5 }}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    margin: 10,
    borderRadius: 10,
    maxWidth: '75%',
  },
  row: {
    flexDirection: 'row',
  },
  messageReply: {
    backgroundColor: "grey",
    padding: 5,
    borderRadius: 5,
  },
  leftContainer: {
    backgroundColor: blue,
    marginLeft: 10,
    marginRight: 'auto'
  },
  rightContainer: {
    backgroundColor: grey,
    marginLeft: 'auto',
    marginRight: 10,
    alignItems: 'flex-end',
  }
});

export default MessageReply;
