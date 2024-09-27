import React from 'react';
import { View, Image } from 'react-native';
import homeIcon from '../assets/images/Home.png';
import heart from '../assets/images/H.png';
import calendar from '../assets/images/Calender.png';
import profile from '../assets/images/User.png';
import plus from '../assets/images/Plus.png';

interface BottomButtonProps {
  image?: any;
  style?: object;
  imageStyle?: object;
}

const BottomTab: React.FC = () => (
  <View
    style={{
      position: 'absolute',
      bottom: 10,
      margin: 10,
      marginHorizontal: 25,
      borderRadius: 20,
      padding: 10,
      backgroundColor: '#EDEDED',
      flexDirection: 'row',
      alignItems: 'center',
    }}
  >
    <BottomButton image={homeIcon || require('../assets/images/BG.png')} />
    <BottomButton image={heart || require('../assets/images/BG.png')} />
    <BottomButton
      image={plus || require('../assets/images/BG.png')}
      style={{
        position: 'absolute',
        left: '43%',
        top: -25,
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 20,
      }}
    />
    <BottomButton />
    <BottomButton image={calendar || require('../assets/images/BG.png')} />
    <BottomButton image={profile || require('../assets/images/BG.png')} />
  </View>
);

const BottomButton: React.FC<BottomButtonProps> = ({
  image,
  style,
  imageStyle,
}) => (
  <View style={[{ flex: 1, alignSelf: 'center', alignItems: 'center' }, style]}>
    <Image
      source={image}
      style={[
        { height: image === plus ? 40 : 20, width: image === plus ? 40 : 20 },
        imageStyle,
      ]}
    />
  </View>
);

export default BottomTab;
