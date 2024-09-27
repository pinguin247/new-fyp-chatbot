import React from 'react';
import { View } from 'react-native';
import headerImage from '../assets/images/header.jpg';
import notification from '../assets/images/Notification.png';
import ImageContainer from './ImageContainer';
import HeaderTitle from './HeaderTitle';

const Header: React.FC = () => (
  <View
    style={{
      paddingHorizontal: 5,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: '15%',
      justifyContent: 'space-between',
      height: 70, // Explicitly set height to control the size
    }}
  >
    <ImageContainer image={headerImage} height={50} width={50} />
    <HeaderTitle />
    <ImageContainer image={notification} height={30} width={30} />
  </View>
);

export default Header;
