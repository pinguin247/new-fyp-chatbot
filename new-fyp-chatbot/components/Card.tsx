import React from 'react';
import { View, Image, Text } from 'react-native';
import * as Progress from 'react-native-progress';
import next from '../assets/images/next.png';

interface CardProps {
  data: any;
  index: number;
}

const Card: React.FC<CardProps> = ({ data, index }) => {
  return (
    <View
      style={{
        flex: 1,
        height: index === 1 ? 180 : 150,
        padding: 10,
        alignSelf: 'center',
        backgroundColor: data.color || '#f0f0f0',
        justifyContent: 'space-between',
        marginHorizontal: 8,
        borderRadius: 10,
        shadowColor: 'lightgrey',
        shadowOffset: { width: -5, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      }}
    >
      {/* Conditionally render the image only if a valid source exists */}
      {data.image ? (
        <Image source={data.image} style={{ height: 25, width: 25 }} />
      ) : (
        <Image
          source={require('../assets/images/BG.png')}
          style={{ height: 25, width: 25 }}
        />
      )}
      <View style={{ alignSelf: 'center', margin: 5 }}>
        <Progress.Circle
          size={50}
          progress={(data.status || 0) / 100}
          showsText
          unfilledColor="#ededed"
          borderColor="#ededed"
          color={data.darkColor || '#000'}
          direction="counter-clockwise"
          fill="white"
          strokeCap="round"
          thickness={5}
        />
      </View>
      <View>
        <Text style={{ fontSize: 10, fontFamily: 'Poppins-Light' }}>Day 1</Text>
        <Text style={{ fontSize: 10, fontFamily: 'Poppins-Light' }}>
          Time 20 min
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontFamily: 'Poppins-Regular' }}>
          {data.name || 'Unnamed Activity'}
        </Text>
        <View
          style={{
            backgroundColor: data.lightColor || '#ccc',
            padding: 2,
            borderRadius: 10,
          }}
        >
          <Image
            source={next}
            style={{ height: 12, width: 12, resizeMode: 'contain' }}
          />
        </View>
      </View>
    </View>
  );
};

export default Card;
