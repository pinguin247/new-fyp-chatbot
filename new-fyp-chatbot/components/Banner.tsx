import React from 'react';
import { Image, ImageBackground, Text, View } from 'react-native';
//import LinearGradient from 'react-native-linear-gradient';
import styles from '../constants/styles';

import banner from '../assets/images/BG.png';
import fire from '../assets/images/fire.png';
import model from '../assets/images/model.png';

const Banner: React.FC = () => (
  <>
    <ImageBackground style={styles.banner} source={banner}>
      <View style={styles.bannerContainer}>
        <View style={styles.rowLabel}>
          <View style={styles.fireContainer}>
            <Image
              source={fire}
              resizeMode="contain"
              style={styles.fireImage}
            />
          </View>
          <Text style={styles.offer}>limited offer</Text>
        </View>
        <Text style={styles.offerText}>30% Discount</Text>
        <Text style={styles.offerText}>Flash Sales</Text>
      </View>
    </ImageBackground>
    <Image source={model} style={styles.model} resizeMode="contain" />
  </>
);

export default Banner;
