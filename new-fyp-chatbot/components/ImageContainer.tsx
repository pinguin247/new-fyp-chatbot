import React from 'react';
import { View, Image, ViewStyle, StyleProp } from 'react-native';

interface ImageContainerProps {
  image: any;
  height?: number;
  width?: number;
  style?: StyleProp<ViewStyle>;
}

const ImageContainer: React.FC<ImageContainerProps> = ({
  image,
  height = 50,
  width = 50,
  style,
}) => (
  <View
    style={[
      {
        height,
        width,
        borderRadius: 25,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
      },
      style,
    ]}
  >
    {/* Conditionally render the image */}
    {image ? (
      <Image source={image} style={{ height, width }} />
    ) : (
      <Image
        source={require('../assets/images/BG.png')}
        style={{ height, width }}
      />
    )}
  </View>
);

export default ImageContainer;
