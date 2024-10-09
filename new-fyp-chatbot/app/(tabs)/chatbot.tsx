import React, { useState, useEffect, useRef } from 'react';
import { GiftedChat, IMessage, Bubble, Send } from 'react-native-gifted-chat';
import { Image, LogBox, View, StyleSheet, SafeAreaView } from 'react-native';
import { fetchResponse } from '@/lib/fetchResponse';
import { fetchHistory } from '@/lib/fetchHistory';
import { fetchRandomExercise } from '@/lib/fetchRandomExercise';
import { createSession } from '@/lib/createSession';
import { checkExistingSession } from '@/lib/checkExistingSession';
import { saveMessage } from '@/lib/saveMessage';
import { updateSession } from '@/lib/updateSession';
import { supabase } from '@/lib/supabase';
import { fetchExerciseReport } from '@/lib/fetchExerciseReport';
import { Ionicons } from '@expo/vector-icons';

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

      // Sort history from oldest to newest
      formattedHistory.sort((a, b) => {
        const timeA =
          a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
        const timeB =
          b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
        return timeA - timeB;
      });

      if (isFirstLoad.current) {
        const endDate = new Date('2024-06-07');
        const startDate = new Date('2024-06-01');
        const report = await fetchExerciseReport(
          userId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
        );

        const newMessages: IMessage[] = [];

        if (report) {
          const reportMessage: IMessage = {
            _id: `report-${Date.now()}-1`,
            text: `Here's your exercise report for the week of ${startDate.toDateString()} to ${endDate.toDateString()}:
      
      - Total Exercise Duration: ${report.totalExerciseDuration} minutes
      - Average Heart Rate: ${report.avgHeartRate.toFixed(1)} bpm
      - Number of Exercise Sessions: ${report.exerciseCount}
      - Total Time in Moderate Intensity: ${report.totalModerateIntensity.toFixed(1)} minutes
      - Total Time in Vigorous Intensity: ${report.totalVigorousIntensity.toFixed(1)} minutes
      
      Great job on your progress!`,
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'Chatbot',
              avatar: 'https://placekitten.com/200/300',
            },
          };
          newMessages.push(reportMessage);
          await saveMessage(userId, reportMessage.text, 'assistant');
        }

        const startingMessage: IMessage = {
          _id: `greeting-${Date.now()}-2`,
          text: `Hi ${userName}! How are you feeling today? Let me know, and I can help you with your exercise routine!`,
          createdAt: new Date(Date.now() + 1), // Ensure this is slightly later than the report message
          user: {
            _id: 2,
            name: 'Chatbot',
            avatar: 'https://placekitten.com/200/300',
          },
        };
        newMessages.push(startingMessage);
        await saveMessage(userId, startingMessage.text, 'assistant');

        // Reverse newMessages to get the correct order (oldest first)
        newMessages.reverse();

        // Combine chat history with new messages in the correct order
        setMessages(GiftedChat.append(formattedHistory, newMessages));
        isFirstLoad.current = false;
      } else {
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
  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#007AFF',
          },
          left: {
            backgroundColor: '#E5E5EA',
          },
        }}
        textStyle={{
          right: {
            color: '#FFFFFF',
          },
          left: {
            color: '#000000',
          },
        }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send {...props}>
        <View style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#007AFF" />
        </View>
      </Send>
    );
  };

  const renderAvatar = (props: any) => {
    if (props.currentMessage.user._id === 2) {
      return (
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.botAvatar}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={(newMessages) => handleSend(newMessages)}
        user={{ _id: 1, name: userName || 'User' }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderAvatar={renderAvatar}
        isTyping={isLoading}
        alwaysShowSend
        scrollToBottom
        inverted={true} // This is the default, but we're setting it explicitly for clarity
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
