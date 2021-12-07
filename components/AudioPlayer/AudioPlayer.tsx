import { Feather } from '@expo/vector-icons'
import { Audio, AVPlaybackStatus } from 'expo-av';
import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

const AudioPlayer = ({ soundURI }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [pause, setPause] = useState(true);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  useEffect(() => {
    loadSound();
    () => {
      //unload sound
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [soundURI])

  const loadSound = async () => {
    if (!soundURI) {
      return;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: soundURI },
      {},
      onPlaybackStatusUpdate);
    setSound(sound);
  }

  // Audio
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }
    setAudioProgress(status.positionMillis / (status.durationMillis || 1));
    setPause(!status.isPlaying);
    setAudioDuration(status.durationMillis || 0);
  };

  const playPauseSound = async () => {
    if (!sound) {
      return;
    }
    if (pause) {
      await sound.playFromPositionAsync(0);
    } else {
      await sound.pauseAsync();
    }
  };
  // ↓getDurationを分秒に換算 Math.floorを忘れずに
  const getDuration = () => {
    const minutes = Math.floor(audioDuration / (60 * 1000));
    const seconds = Math.floor((audioDuration % (60 * 1000)) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }
  return (
    <View style={styles.sendAudioContainer}>
      <Pressable onPress={playPauseSound}>
        <Feather name={pause ? "play" : "pause"} size={24} color="grey" />
      </Pressable>

      <View style={styles.audioProgressBG}>
        <View
          style={[
            styles.audioProgressFG,
            {
              left: `${audioProgress * 100}%`
            }]
          }
        />
      </View>

      <Text>{getDuration()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sendAudioContainer: {
    marginVertical: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "lightgrey",
    borderRadius: 10,
    backgroundColor: 'white',
  },

  audioProgressBG: {
    height: 3,
    flex: 1,
    backgroundColor: "lightgrey",
    borderRadius: 5,
    margin: 10,
  },
  audioProgressFG: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#3777f0',
    position: 'absolute',
    top: -3,
  }
});

export default AudioPlayer
