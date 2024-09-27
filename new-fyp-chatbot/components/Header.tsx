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
      justifyContent: 'space-between',
      flex: 1,
    }}
  >
    <ImageContainer image={headerImage} />
    <HeaderTitle />
    <ImageContainer image={notification} style={{ flex: 0.5 }} />
  </View>
);

export default Header;
