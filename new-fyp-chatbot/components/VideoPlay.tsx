import React from 'react';
import { View, Image, ImageBackground, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import couple from '../assets/images/couple.jpg';
import star from '../assets/images/Star.png';
import play from '../assets/images/play.png';
import book from '../assets/images/Book.png';

const VideoPlay: React.FC = () => (
  <View
    style={{ borderRadius: 15, marginHorizontal: 12, backgroundColor: '#fff' }}
  >
    <View style={{ borderRadius: 10, overflow: 'hidden' }}>
      <ImageBackground
        source={couple || require('../assets/images/BG.png')}
        style={{ height: 150, width: 300 }}
      >
        <LinearGradient
          locations={[0, 1.0]}
          colors={['rgba(0,0,0,0.00)', 'rgba(0,0,0,0.60)']}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
      </ImageBackground>
      <Text
        style={{ position: 'absolute', bottom: 5, left: 10, color: '#fff' }}
      >
        Transformation
      </Text>
      {star && (
        <View
          style={{
            position: 'absolute',
            backgroundColor: '#fff',
            padding: 5,
            right: 10,
            top: 10,
            borderRadius: 5,
          }}
        >
          <Image source={star} style={{ height: 10, width: 10 }} />
        </View>
      )}
    </View>
    <View style={{ backgroundColor: 'white', padding: 10, borderRadius: 15 }}>
      <View
        style={{
          position: 'absolute',
          backgroundColor: '#8860a2',
          padding: 10,
          right: 25,
          top: -15,
          borderRadius: 15,
          zIndex: 3,
        }}
      >
        {play && <Image source={play} style={{ height: 10, width: 10 }} />}
      </View>
      <Text>2 Hour Bulking Trainer</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text>
          <Image source={book} style={{ height: 15, width: 15 }} /> Beginner
        </Text>
        <Text style={{ color: '#8860a2' }}>45 Min</Text>
      </View>
    </View>
  </View>
);

export default VideoPlay;
