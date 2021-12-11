import { AdMobBanner } from 'expo-ads-admob'
import React from 'react'
import { Platform, View } from 'react-native'

const Advertisement = () => {
  // テスト用のID
  // 実機テスト時に誤ってタップしたりすると、広告の配信停止をされたりするため、テスト時はこちらを設定する
  const testUnitID = Platform.select({
    // https://developers.google.com/admob/ios/test-ads
    ios: 'ca-app-pub-3940256099942544/2934735716',
  });

  // 実際に広告配信する際のID
  // 広告ユニット（バナー）を作成した際に表示されたものを設定する
  const adUnitID = Platform.select({
    ios: 'ca-app-pub-6500766760315589/8392796690',
  });
  return (
    <View style={{ alignItems: "center", }}>
      <AdMobBanner
        bannerSize="smartBannerPortrait"
        adUnitID={testUnitID}
        servePersonalizedAds // パーソナライズされた広告の可否。App Tracking Transparencyの対応時に使用。
      />
    </View>
  )
}

export default Advertisement
