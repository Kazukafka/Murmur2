import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Amplify, { DataStore, Hub, Auth } from 'aws-amplify';
// @ts-ignore  ↓aws-amplify-react-nativeのエラー無視(yarnでも同じ) from 'https://stackoverflow.com/questions/62512237/how-to-use-aws-amplify-in-react-native-with-typescript-project'
import { withAuthenticator } from 'aws-amplify-react-native';
import config from './src/aws-exports';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';
import { Message, User } from './src/models';
import moment from 'moment';
import { box } from "tweetnacl";
import { generateKeyPair, encrypt, decrypt } from './utils/crypt';

Amplify.configure(config);
// ↓https://github.com/dchest/tweetnacl-js/wiki/Examples
const obj = { hello: 'world' };
const pairA = generateKeyPair();
const pairB = generateKeyPair();

const sharedA = box.before(pairB.publicKey, pairA.secretKey);
const encrypted = encrypt(sharedA, obj);

const sharedB = box.before(pairA.publicKey, pairB.secretKey);
const decrypted = decrypt(sharedB, encrypted);
console.log(obj, encrypted, decrypted);

function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const listener = Hub.listen('datastore', async hubData => {
      const { event, data } = hubData.payload;

      if (event === 'networkStatus') {
        console.log(`User has a network connection: ${data.active}`);
      }
      if (event === 'outboxMutationProcessed' &&
        data.model === Message
        && !(["DELIVERED", "READ"].includes(data.element.status))) {
        // set the message status to delivered
        DataStore.save(
          Message.copyOf(data.element, (updated) => {
            updated.status = "DELIVERED";
          })
        )
      }
    });

    // Remove listener
    return () => listener();
  }, []);

  useEffect(() => {
    if (!user) { return }
    const subscription = DataStore.observe(User, user?.id).subscribe(msg => {
      if (msg.model === User && msg.opType === 'UPDATE') {
        setUser((curUser) => ({ ...curUser, ...msg.element }));
        //↑はsetMessage(msg.elemnt)でも対応可能だが、応答時間が長い
      }
    });
    // not to forget unsubscribe
    return () => subscription.unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    fetchUser();
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      await updateLastOnline();
    }, 1 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user])

  const fetchUser = async () => {
    const userData = await Auth.currentAuthenticatedUser();
    const user = await DataStore.query(User, userData.attributes.sub);
    if (user) {
      setUser(user);
    }
  }

  const updateLastOnline = async () => {
    if (!user) {
      return;
    }

    const response = await DataStore.save(
      User.copyOf(user, (upload) => {
        upload.lastOnlineAt = +(new Date());
        //↑new Date()ではなくmoment().seconds()でも良い
      })
    );
    setUser(response);
  }

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <ActionSheetProvider>
          <Navigation colorScheme={"light"} />
        </ActionSheetProvider>
        <StatusBar />
      </SafeAreaProvider>
    );
  }
}

export default withAuthenticator(App);
