import React, { useState } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { Image, LogBox  } from 'react-native';

LogBox.ignoreLogs([
    'Warning: Avatar: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
  ]);

export default function chatbot() {
  const [messages, setMessages] = useState<IMessage[]>([
    {
      _id: 1,
      text: 'Hello! I am your GFG chatbot. How can I help you?',
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Chatbot',
        avatar: 'https://placekitten.com/200/300',
      },
    },
  ]);

  const handleSend = (newMessages: IMessage[] = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages),
    );

    const userMessage = newMessages[0].text;
    const botResponse = generateChatbotResponse(userMessage);

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

  const generateChatbotResponse = (userMessage: string): string => {
    switch (userMessage.toLowerCase()) {
      case 'hello':
        return 'Hi there! How can I assist you today?';
      case 'how are you':
        return 'I am just a chatbot, but thanks for asking!';
      case 'bye':
        return 'Goodbye! If you have more questions, feel free to ask.';
      case 'javascript':
        return 'JavaScript is a programming language commonly used to create interactive effects within web browsers.';
      case 'python':
        return 'Python is a versatile and easy-to-read programming language often used for web development, data analysis, and artificial intelligence.';
      case 'html':
        return 'HTML (Hypertext Markup Language) is the standard markup language for documents designed to be displayed in a web browser.';
      case 'css':
        return 'CSS (Cascading Style Sheets) is a style sheet language used for describing the look and formatting of a document written in HTML.';
      case 'git':
        return 'Git is a distributed version control system used to track changes in source code during software development.';
      case 'api':
        return 'An API (Application Programming Interface) is a set of rules that allows one software application to interact with another.';
      case 'algorithm':
        return 'An algorithm is a step-by-step procedure or formula for solving a problem or accomplishing a task in computer science.';
      case 'database':
        return 'A database is an organized collection of data, typically stored and accessed electronically from a computer system.';
      default:
        return "I'm sorry, I didn't understand that. Can you please rephrase?";
    }
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
