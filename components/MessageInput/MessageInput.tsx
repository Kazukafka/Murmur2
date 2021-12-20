import React, { useState, useEffect } from 'react';
import {
  Image,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SimpleLineIcons, Feather, MaterialCommunityIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import { DataStore } from '@aws-amplify/datastore';
import { ChatRoom, Message } from '../../src/models';
import { Auth, Storage } from 'aws-amplify';
import EmojiSelector from 'react-native-emoji-selector';
import * as ImagePicker from 'expo-image-picker';
// ↓　UUIDより前にramdom-valuesをImport　Ediさんの解決策　https://stackoverflow.com/questions/61169746/crypto-getrandomvalues-not-supported
import 'react-native-get-random-values';
// ↓だけだと「Unhandled promise rejection: Error: crypto.getRandomValues() not supported.」エラーが起きる
import { v4 as uuidv4 } from 'uuid';
import { Audio } from 'expo-av';
import AudioPlayer from '../AudioPlayer';
import MessageComponent from '../Message';
import { ChatRoomUser } from '../../src/models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/core';
import { box } from 'tweetnacl';
import { encrypt, getMySecretKey, stringToUint8Array } from '../../utils/crypt';

const MessageInput = ({ chatRoom, messageReplyTo, removeMessageReplyTo }) => {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [soundURI, setSoundURI] = useState<string | null>(null);

  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const libraryResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const photoResponse = await ImagePicker.requestCameraPermissionsAsync();
        await Audio.requestPermissionsAsync();

        if (libraryResponse.status !== 'granted' || photoResponse.status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const sendMessageToUser = async (user, fromUserId) => {
    // send message
    const ourSecretKey = await getMySecretKey();

    if (!ourSecretKey) {
      return;
    }

    if (!user.publicKey) {
      Alert.alert(
        "The user have not set your keypair yet",
        "Until the user generate the keypair, you cannot secure message",
      );
      return;
    }

    console.log('privateKey is ', ourSecretKey);

    const sharedKey = box.before(
      stringToUint8Array(user.publicKey),
      ourSecretKey,
    );

    const encryptedMessage = encrypt(sharedKey, { message });
    // console.log("encrypted message", encryptedMessage);

    const newMessage = await DataStore.save(
      new Message({
        content: encryptedMessage, // <-ここが暗号化される
        userID: fromUserId,
        forUserId: user.id,
        // ChatRoomScreen.tsxから受け取ったchatRoomId↓ chatRoomという大きめの配列を受け取りupdateLastMessageに使う
        chatroomID: chatRoom.id,
        status: "SENT",
        replyToMessageID: messageReplyTo?.id
      })
    );
  }

  const sendMessage = async () => {
    // get all users of this chatroom
    const authUser = await Auth.currentAuthenticatedUser();

    const users = (await DataStore.query(ChatRoomUser))
      .filter((cru) => cru.chatroom.id === chatRoom.id)
      .map((cru) => cru.user);

    // console.log("users", users);

    // for each user, encrypt the 'content'
    await Promise.all(users.map((user) => sendMessageToUser(user, authUser.attributes.sub)));

    resetFields();
    //　↑メッセージを送信後にリフレッシュしている
  }

  const updateLastMessage = async (newMessage) => {
    // chatRoom.lastMessage = newMessageでは機能しない、データソースからはmutable
    DataStore.save(ChatRoom.copyOf(chatRoom, updatedChatRoom => {
      updatedChatRoom.LastMessage = newMessage;
    }))
  }

  const onPlusClicked = () => {
    console.warn("On plus clicked");
  }

  const onPress = () => {
    if (image) {
      sendImage();
    } else if (soundURI) {
      sendAudio();
    } else if (message) {
      sendMessage();
    } else {
      onPlusClicked();
    }
  };

  const resetFields = () => {
    setMessage('');
    setIsEmojiPickerOpen(false);
    setImage(null);
    setProgress(0);
    setSoundURI(null);
    removeMessageReplyTo();
  }

  // Image Picker
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Be carefull of the image size, amplify has storage limit. OR use MediaConvert
    });

    console.log(result);

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
    });

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  const progressCallback = (progress) => {
    // console.log(`Upload: ${progress.loaded}/${progress.total}`);
    setProgress(progress.loaded / progress.total);
  }

  const sendImage = async () => {
    if (!image) {
      return;
    }
    const blob = await getBlob(image);//awaitをつけないと壊れたファイルで保存される（データ量が大きいため）
    // ↓{}なしでuuidを保持できないからつける、用があるのはObject内のKeyのみ
    const { key } = await Storage.put(`${uuidv4()}.png`, blob, { progressCallback }); //uuidでランダムなファイル名で保存することで上書きをしない

    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        image: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
        replyToMessageID: messageReplyTo?.id
      })
    );

    updateLastMessage(newMessage);

    resetFields();
  };

  const getBlob = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  }

  //Audio
  async function startRecording() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    if (!recording) {
      return;
    }

    setRecording(null);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    if (!uri) {
      return;
    }
    setSoundURI(uri);
  }

  const sendAudio = async () => {
    if (!soundURI) {
      return;
    }
    const uriParts = soundURI.split(".");
    const extention = uriParts[uriParts.length - 1];
    const blob = await getBlob(soundURI); // awaitを忘れずに（ファイル破損の可能性）
    const { key } = await Storage.put(`${uuidv4()}.${extention}`, blob, { progressCallback });

    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        audio: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
        replyToMessageID: messageReplyTo?.id
      })
    );

    updateLastMessage(newMessage);

    resetFields();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { height: isEmojiPickerOpen ? "50%" : "auto" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      {messageReplyTo && (
        <View style={{
          backgroundColor: "#f2f2f2",
          padding: 5,
          flexDirection: 'row',
          alignSelf: "stretch",
          justifyContent: "space-between",
        }}>
          <View style={{ flex: 1 }}>
            <Text>Reply to</Text>
            <MessageComponent message={messageReplyTo} />
          </View>
          <Pressable onPress={() => removeMessageReplyTo()}>
            <AntDesign
              name="close"
              size={24}
              color="black"
              style={{ margin: 5 }}
            />
          </Pressable>
        </View>
      )}
      {image && (
        <View style={styles.sendImageContainer}>
          <Image
            source={{ uri: image }}
            style={{ width: 100, height: 100, borderRadius: 10 }}
          />

          <View
            style={{
              flex: 1,
              justifyContent: "flex-start",
              alignSelf: "flex-end"
            }}
          >
            <View
              style={{
                height: 5,
                borderRadius: 5,
                backgroundColor: '#8a2be2',
                width: `${progress * 100}%`,
                // marginLeft: "auto",
                // ↑だとsendImageContainerがあるので左にならないため、も一つ大きなViewで包む
              }}
            />
          </View>

          <Pressable onPress={() => setImage(null)}>
            <AntDesign
              name="close"
              size={24}
              color="black"
              style={{ margin: 5 }}
            />
          </Pressable>
        </View>
      )}

      {soundURI && (<AudioPlayer soundURI={soundURI} />)}

      <View style={styles.row}>
        <View style={styles.inputContainer}>
          {/* () => setIsEmojiPickerOpen(true)だと閉じれないので、押したら今の値と真逆の値（trueとFalse）を入れ替える */}
          <Pressable onPress={() => setIsEmojiPickerOpen((currentValue) => !currentValue)}>
            <SimpleLineIcons
              name="emotsmile"
              size={24} color="#595959"
              style={styles.icon}
            />
          </Pressable>

          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Murmur message..."
          />

          <Pressable onPress={pickImage}>
            <Feather
              name="image"
              size={24}
              color="#595959"
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPress={takePhoto}>
            <Feather
              name="camera"
              size={24}
              color="#595959"
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPressIn={startRecording} onPressOut={stopRecording}>
            <MaterialCommunityIcons
              name={recording ? "microphone" : "microphone-outline"}
              size={24}
              color={recording ? 'red' : "#595959"}
              style={styles.icon}
            />
          </Pressable>
        </View>
        <Pressable onPress={onPress} style={styles.buttonContainer}>
          {message || image || soundURI ? (
            <Ionicons name="send" size={18} color="white" />
          ) : (
            <AntDesign name="plus" size={24} color="white" />
          )}
        </Pressable>
      </View>

      {isEmojiPickerOpen && (
        <EmojiSelector
          // emoj=>の跡が送信知る部分
          onEmojiSelected={(emoji) => setMessage(currentMessage => currentMessage + emoji)}
          columns={8}
        />
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    padding: 10,
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    backgroundColor: '#f2f2f2',
    flex: 1,
    marginRight: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#dedede',
    alignItems: 'center',
    flexDirection: 'row',
    padding: 5,
  },
  input: {
    flex: 1,
    marginHorizontal: 5,
  },
  icon: {
    marginHorizontal: 5,
  },
  buttonContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#8a2be2',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 35,
  },

  sendImageContainer: {
    flexDirection: "row",
    marginVertical: 10,
    alignSelf: "stretch",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "lightgrey",
    borderRadius: 10,
  },
});

export default MessageInput
