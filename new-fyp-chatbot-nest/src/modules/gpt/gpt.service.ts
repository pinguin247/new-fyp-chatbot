import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private conversationHistory: {
    role: 'user' | 'system' | 'assistant';
    content: string;
  }[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chatWithGPT(content: string) {
    this.conversationHistory.push({
      role: 'user',
      content: content,
    });
    const chatCompletion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are nice' },
        ...this.conversationHistory,
      ],
    });

    const botMessage = chatCompletion.choices[0].message.content;
    this.conversationHistory.push({
      role: 'assistant',
      content: botMessage,
    });

    return { response: botMessage }; // Ensure the response is a string
  }
}
