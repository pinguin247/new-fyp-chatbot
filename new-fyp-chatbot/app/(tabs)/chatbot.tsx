import React, { useState, useEffect, useRef } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { Image, LogBox } from 'react-native';
import { fetchResponse } from '@/lib/fetchResponse';
import { fetchHistory } from '@/lib/fetchHistory';
import { fetchRandomExercise } from '@/lib/fetchRandomExercise';
import { createSession } from '@/lib/createSession';
import { checkExistingSession } from '@/lib/checkExistingSession';
import { saveMessage } from '@/lib/saveMessage';
import { updateSession } from '@/lib/updateSession'; // Import updateSession
import { supabase } from '@/lib/supabase';

LogBox.ignoreLogs([
  'Warning: Avatar: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

export default function Chatbot() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null); // State to store user's full name
  const isFirstLoad = useRef(true); // Track if it's the first page load

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

        // Fetch user's profile to get the full_name
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        } else if (userProfile) {
          setUserName(userProfile.full_name); // Set the user's full name in state
          console.log(
            'User full_name fetched from Supabase:',
            userProfile.full_name,
          );
        }
      }
    };

    fetchUser();

    const loadChatHistory = async () => {
      if (!userId || !userName) return; // Ensure both userId and userName are loaded

      const history = await fetchHistory(userId);
      const formattedHistory: IMessage[] = history.map((message: any) => ({
        _id: message.id, // Assuming 'id' is the unique identifier in your chat history data
        text: message.content,
        createdAt: new Date(message.created_at),
        user: {
          _id: message.role === 'user' ? 1 : 2,
          name: message.role === 'user' ? userName : 'Chatbot',
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

      // Declare the starting message with the user's full name
      const startingMessage: IMessage = {
        _id: Math.round(Math.random() * 1000000),
        text: `Hi ${userName}! How are you feeling today? Let me know, and I can help you with your exercise routine!`,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Chatbot',
          avatar: 'https://placekitten.com/200/300',
        },
      };

      // Always send the two messages when the page first loads
      if (isFirstLoad.current) {
        await saveMessage(userId, startingMessage.text, 'assistant');
        setMessages([startingMessage, ...formattedHistory]);

        // Commented out: Always recommend an exercise when the page first loads
        // await recommendExercise(userId);

        isFirstLoad.current = false; // Set flag to false after first load
      } else {
        // If not the first load, just load the chat history without extra messages
        setMessages(formattedHistory);
      }
    };

    loadChatHistory();
  }, [userId, userName]);

  // Function to recommend an exercise, reset persuasion_attempt, and create/update session as needed
  const recommendExercise = async (userId: string) => {
    try {
      const exercise = await fetchRandomExercise();
      const sessionExists = await checkExistingSession(userId);

      if (!sessionExists) {
        // If no session exists, create a new session and reset persuasion_attempt
        console.log('No session found, creating a new session.');
        const response = await createSession(userId, exercise.id);

        if (response.success) {
          console.log(
            `Session created successfully with exerciseId: ${exercise.id}`,
          );
        } else {
          console.error('Failed to create session:', response.message);
        }
      } else {
        // If session exists, update it and reset persuasion_attempt
        console.log(
          'Session already exists, updating the session and resetting persuasion_attempt.',
        );
        const response = await updateSession(userId, exercise.id, {
          persuasion_attempt: 0, // Reset persuasion_attempt
        });

        if (response.success) {
          console.log(
            `Session updated successfully with exerciseId: ${exercise.id} and persuasion_attempt reset.`,
          );
        } else {
          console.error('Failed to update session:', response.message);
        }
      }

      // Always recommend an exercise
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

      // Save the exercise recommendation to the chat history
      await saveMessage(userId, exerciseMessage.text, 'assistant');

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

    // Show a typing indicator
    setIsLoading(true);
    const loadingMessage: IMessage = {
      _id: `loading-${Math.random()}`,
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
      _id: `bot-${Math.random()}`,
      text: botResponse,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Chatbot',
        avatar: 'https://placekitten.com/200/300',
      },
    };

    setMessages((previousMessages) =>
      GiftedChat.append(
        previousMessages.filter((msg) => msg.text !== '...'),
        [botMessage],
      ),
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
      user={{ _id: 1, name: userName || 'User' }} // Use user's full name in the chat if available
      renderAvatar={renderAvatar}
      isTyping={isLoading} // Show typing indicator when loading
    />
  );
}
