import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions, Pressable } from 'react-native';
import { DataStore } from '@aws-amplify/datastore';
import { User } from '../../src/models';
import { Auth, Storage } from 'aws-amplify';
import { S3Image } from 'aws-amplify-react-native';
import AudioPlayer from '../AudioPlayer';
import { AntDesign } from '@expo/vector-icons';
import { Message as MessageModel } from "../../src/models";
import MessageReply from '../MessageReply';

const blue = '#8a2be2'; // blueviolet
const grey = 'lightgrey';

const Message = (props) => {
  const { setAsMessageReply, message: propMessage } = props;

  const [message, setMessage] = useState<MessageModel>(propMessage);
  const [repliedTo, setRepliedTo] = useState<MessageModel | undefined>(undefined);
  const [user, setUser] = useState<User | undefined>();
  const [isMe, setIsMe] = useState<boolean | null>(null);
  const [soundURI, setSoundURI] = useState<any>(null);

  const { width } = useWindowDimensions();

  useEffect(() => {
    DataStore.query(User, message.userID).then(setUser);
  }, []);

  // 長押しでReplyが更新しないのは一度PropsをセットしたあとにsetAsMessageReplyで更新してないから
  useEffect(() => {
    setMessage(propMessage);
  }, [propMessage]);

  useEffect(() => {
    if (message?.replyToMessageID) {
      DataStore.query(MessageModel, message.replyToMessageID).then(setRepliedTo);
    }
  }, [message]);

  useEffect(() => {
    const subscription = DataStore.observe(MessageModel, message.id).subscribe(msg => {
      if (msg.model === MessageModel && msg.opType === 'UPDATE') {
        setMessage((message) => ({ ...message, ...msg.element }));
        //↑はsetMessage(msg.elemnt)でも対応可能だが、応答時間が長い
      }
    });
    // not to forget unsubscribe
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setAsRead();
  }, [isMe, message])

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

  const setAsRead = async () => {
    if (isMe === false && message.status !== "READ") {
      await DataStore.save(MessageModel.copyOf(message, (updated) => {
        updated.status = "READ"
      }));
    }
  }

  if (!user) {
    return <ActivityIndicator />
  }

  return (
    <Pressable
      onLongPress={setAsMessageReply}
      style={[
        styles.container,
        isMe ? styles.rightContainer : styles.leftContainer,
        { width: soundURI ? "75%" : "auto" },
      ]}
    >
      {repliedTo && (<MessageReply message={repliedTo} />)}

      <View style={styles.row}>
        {message.image && (
          <View style={{ marginBottom: message.content ? 10 : 0 }}>
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
    </Pressable>
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

export default Message;
