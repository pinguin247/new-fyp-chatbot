import React, { useState, useEffect } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { Image, LogBox } from 'react-native';
import { fetchResponse } from '@/lib/fetchResponse';
import { fetchHistory } from '@/lib/fetchHistory';
import { saveMessage } from '@/lib/saveMessage';

LogBox.ignoreLogs([
  'Warning: Avatar: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

export default function Chatbot() {
  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    const userId = '168c70af-f4ce-417c-aace-3c42fb7b5c00'; // Replace with the actual user ID

    // Declare the starting message
    const startingMessage = {
      _id: Math.round(Math.random() * 1000000),
      text: 'Hello! I am your chatbot. How can I help you?',
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Chatbot',
        avatar: 'https://placekitten.com/200/300',
      },
    };

    const loadChatHistory = async () => {
      const history = await fetchHistory(userId);

      const formattedHistory = history.map((message: any) => ({
        _id: message.id, // Assuming 'id' is the unique identifier in your chat history data
        text: message.content,
        createdAt: new Date(message.created_at),
        user: {
          _id: message.role === 'user' ? 1 : 2, // Map user IDs appropriately
          name: message.role === 'user' ? 'User' : 'Chatbot',
          avatar:
            message.role === 'user' ? null : 'https://placekitten.com/200/300',
        },
      }));

      // Sort the history by createdAt in descending order (newest messages first)
      formattedHistory.sort((a, b) => b.createdAt - a.createdAt);

      // Save the starting message to Supabase
      await saveMessage(userId, startingMessage.text, 'assistant');

      // Add the starting message to the existing history, and ensure the order is correct
      setMessages([startingMessage, ...formattedHistory]);
    };

    loadChatHistory();
  }, []);

  const handleSend = async (newMessages: IMessage[] = []) => {
    const userMessage = newMessages[0].text;

    // Save the user's message to Supabase
    await saveMessage(
      '168c70af-f4ce-417c-aace-3c42fb7b5c00',
      userMessage,
      'user',
    );

    const botResponse = await fetchResponse(userMessage);

    // Save the bot's response to Supabase
    await saveMessage(
      '168c70af-f4ce-417c-aace-3c42fb7b5c00',
      botResponse,
      'assistant',
    );

    // Create bot message object
    const botMessage = {
      _id: Math.round(Math.random() * 1000000),
      text: botResponse,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Chatbot',
        avatar: 'https://placekitten.com/200/300',
      },
    };

    // Append the new messages (user + bot) and sort all messages again by createdAt in descending order
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, [botMessage, ...newMessages]).sort(
        (a, b) => b.createdAt - a.createdAt,
      ),
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
