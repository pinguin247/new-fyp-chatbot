import React, { useState, useEffect } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { Image, LogBox } from 'react-native';
import { fetchResponse } from '@/lib/fetchResponse';
import { fetchHistory } from '@/lib/fetchHistory';
import { fetchRandomExercise } from '@/lib/fetchRandomExercise';
import { saveMessage } from '@/lib/saveMessage';
import { supabase } from '@/lib/supabase';

LogBox.ignoreLogs([
  'Warning: Avatar: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

export default function Chatbot() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the current user from Supabase
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching user:', error);
      } else if (user) {
        setUserId(user.id); // Set the user ID in state
        console.log('User ID fetched from Supabase:', user.id); // Add this log to verify userId
      }
    };

    fetchUser();

    // Declare the starting message
    const startingMessage: IMessage = {
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
      if (!userId) return; // If user ID is not yet loaded, do nothing
      const history = await fetchHistory(userId);

      const formattedHistory: IMessage[] = history.map((message: any) => ({
        _id: message.id, // Assuming 'id' is the unique identifier in your chat history data
        text: message.content,
        createdAt: new Date(message.created_at),
        user: {
          _id: message.role === 'user' ? 1 : 2, // Map user IDs appropriately
          name: message.role === 'user' ? 'User' : 'Chatbot',
          avatar:
            message.role === 'user'
              ? undefined
              : 'https://placekitten.com/200/300',
        },
      }));

      // Sort the history by createdAt in descending order (newest messages first)
      formattedHistory.sort((a, b) => {
        const dateA =
          typeof a.createdAt === 'string' || typeof a.createdAt === 'number'
            ? new Date(a.createdAt)
            : a.createdAt;
        const dateB =
          typeof b.createdAt === 'string' || typeof b.createdAt === 'number'
            ? new Date(b.createdAt)
            : b.createdAt;
        return dateB.getTime() - dateA.getTime();
      });

      // Save the starting message to Supabase
      await saveMessage(userId, startingMessage.text, 'assistant');

      // Add the starting message to the existing history, and ensure the order is correct
      setMessages([startingMessage, ...formattedHistory]);

      // After sending the default message, recommend an exercise
      await recommendExercise(userId);
    };

    loadChatHistory();
  }, [userId]);

  const recommendExercise = async (userId: string) => {
    try {
      const exercise = await fetchRandomExercise();

      const exerciseMessage: IMessage = {
        _id: Math.round(Math.random() * 1000000),
        text: `I recommend trying this exercise: ${exercise.name}. ${exercise.description}`,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Chatbot',
          avatar: 'https://placekitten.com/200/300',
        },
      };

      await saveMessage(userId, exerciseMessage.text, 'assistant');
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [exerciseMessage]),
      );
    } catch (error) {
      console.error('Failed to fetch exercise:', error);
    }
  };

  const handleSend = async (newMessages: IMessage[] = []) => {
    if (!userId) return; // If user ID is not loaded, do nothing
    const userMessage = newMessages[0].text;

    // Render the user's message immediately
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages),
    );

    // Set loading state and render a "typing" or "loading" indicator
    setIsLoading(true);
    const loadingMessage: IMessage = {
      _id: `loading-${Math.random()}`, // Generate a unique key for the loading message
      text: '...',
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Chatbot',
        avatar: 'https://placekitten.com/200/300',
      },
    };
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, [loadingMessage]),
    );

    // Save the user's message to Supabase
    await saveMessage(userId, userMessage, 'user');

    // Asynchronously fetch the bot's response with userId
    const botResponse = await fetchResponse(userId, userMessage);

    // Save the bot's response to Supabase
    await saveMessage(userId, botResponse, 'assistant');

    // Remove the loading indicator and append the bot's response
    setIsLoading(false);
    const botMessage: IMessage = {
      _id: `bot-${Math.random()}`, // Generate a unique key for the bot message
      text: botResponse,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Chatbot',
        avatar: 'https://placekitten.com/200/300',
      },
    };

    // Remove the loading message and add the bot's response
    setMessages((previousMessages) =>
      GiftedChat.append(
        previousMessages.filter((msg) => msg.text !== '...'),
        [botMessage],
      ).sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      }),
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
      isTyping={isLoading} // Optional: This prop can be used to show typing indicator in GiftedChat
    />
  );
}
