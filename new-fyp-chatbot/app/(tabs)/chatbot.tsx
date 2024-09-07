import React, { useState, useEffect } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { Image, LogBox } from 'react-native';
import { fetchResponse } from '@/lib/fetchResponse';
import { fetchHistory } from '@/lib/fetchHistory';
import { fetchRandomExercise } from '@/lib/fetchRandomExercise';
import { createSession } from '@/lib/createSession'; // Import API function
import { saveMessage } from '@/lib/saveMessage';
import { supabase } from '@/lib/supabase';

LogBox.ignoreLogs([
  'Warning: Avatar: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

export default function Chatbot() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch the current user from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching user:', error);
      } else if (user) {
        setUserId(user.id); // Set the user ID in state
        console.log('User ID fetched from Supabase:', user.id);
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
          _id: message.role === 'user' ? 1 : 2,
          name: message.role === 'user' ? 'User' : 'Chatbot',
          avatar:
            message.role === 'user'
              ? undefined
              : 'https://placekitten.com/200/300',
        },
      }));

      // Sort the history by createdAt in descending order
      formattedHistory.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Save the starting message to Supabase
      await saveMessage(userId, startingMessage.text, 'assistant');

      // Add the starting message to the existing history
      setMessages([startingMessage, ...formattedHistory]);

      // After sending the default message, recommend an exercise
      await recommendExercise(userId);
    };

    loadChatHistory();
  }, [userId]);

  // Function to recommend an exercise and create a new session
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

      // Pass exerciseId to the createSession API instead of exerciseName
      const response = await createSession(userId, exercise.id); // Send exercise.id instead of exercise.name

      if (response.success) {
        console.log(
          `Session created successfully with exerciseId: ${exercise.id}`,
        );
      } else {
        console.error('Failed to create session:', response.message);
      }

      // Append the exercise message to the chat
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [exerciseMessage]),
      );
    } catch (error) {
      console.error('Failed to fetch exercise:', error);
    }
  };

  // Handle sending user messages
  const handleSend = async (newMessages: IMessage[] = []) => {
    if (!userId) return; // If user ID is not loaded, do nothing
    const userMessage = newMessages[0].text;

    // Immediately append the user's message to the chat
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages),
    );

    // Set loading state to show a typing indicator
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

    // Fetch the bot's response
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

    // Remove the loading message and append the bot's response
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

  // Render custom avatar for the chatbot
  const renderAvatar = (props: any) => {
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
      isTyping={isLoading} // Show typing indicator when loading
    />
  );
}
