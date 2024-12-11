import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import notification from '../assets/images/Notification.png';
import ImageContainer from './ImageContainer';
import HeaderTitle from './HeaderTitle';
import { Notifier, Easing } from 'react-native-notifier';

interface HeaderProps {
  avatarUrl: string | null;
  userName: string;
}

const Header: React.FC<HeaderProps> = ({ avatarUrl, userName }) => {
  const showInAppNotification = () => {
    Notifier.showNotification({
      title: 'Exercise Time!',
      description:
        "Click on me to find out something exciting to do. Get up and let's get moving!",
      duration: 4000,
      showAnimationDuration: 800,
      hideOnPress: true,
      onHidden: () => console.log('Notification hidden'),
      easing: Easing.bounce,
      containerStyle: {
        height: 80, // Increase the height
        justifyContent: 'center', // Center content vertically
        paddingHorizontal: 5, // Add padding
        marginTop: 30,
      },
    });
  };

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
      <TouchableOpacity onPress={showInAppNotification}>
        <ImageContainer image={notification} height={30} width={30} />
      </TouchableOpacity>
    </View>
  );
};

export default Header;
