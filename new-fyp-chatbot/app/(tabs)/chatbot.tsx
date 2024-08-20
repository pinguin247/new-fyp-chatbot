import React, { useState } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { Image, LogBox } from 'react-native';
import { fetchResponse } from '@/lib/fetchResponse';

LogBox.ignoreLogs([
  'Warning: Avatar: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

export default function Chatbot() {
  const [messages, setMessages] = useState<IMessage[]>([
    {
      _id: 1,
      text: 'Hello! I am your chatbot. How can I help you?',
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Chatbot',
        avatar: 'https://placekitten.com/200/300',
      },
    },
  ]);

  const handleSend = async (newMessages: IMessage[] = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages),
    );

    const userMessage = newMessages[0].text;
    const botResponse = await fetchResponse(userMessage);

    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, [
        {
          _id: Math.round(Math.random() * 1000000),
          text: botResponse,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'Chatbot',
            avatar: 'https://placekitten.com/200/300',
          },
        },
      ]),
    );
  };

  const renderAvatar = (props: any) => {
    // Only render avatar for the chatbot
    if (props.currentMessage.user._id === 2) {
      return (
        <Image
          source={require('../../assets/images/icon.png')}
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
      );
    }
    return null;
  };

  return (
    <GiftedChat
      messages={messages}
      onSend={(newMessages) => handleSend(newMessages)}
      user={{ _id: 1, name: 'User' }}
      renderAvatar={renderAvatar}
    />
  );
}
