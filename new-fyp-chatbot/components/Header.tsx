import React from 'react';
import { View } from 'react-native';
import notification from '../assets/images/Notification.png';
import ImageContainer from './ImageContainer';
import HeaderTitle from './HeaderTitle';

interface HeaderProps {
  avatarUrl: string | null;
  userName: string;
}

const Header: React.FC<HeaderProps> = ({ avatarUrl, userName }) => {
  return (
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
      {avatarUrl ? (
        <ImageContainer image={{ uri: avatarUrl }} height={50} width={50} />
      ) : (
        <ImageContainer
          image={require('../assets/images/header.jpg')}
          height={50}
          width={50}
        />
      )}
      {/* Pass the userName prop to HeaderTitle */}
      <HeaderTitle name={userName} />
      <ImageContainer image={notification} height={30} width={30} />
    </View>
  );
};

export default Header;
