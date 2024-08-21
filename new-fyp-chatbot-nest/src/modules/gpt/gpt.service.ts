import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private conversationHistory: {
    role: 'user' | 'system' | 'assistant';
    content: string;
  }[] = [];

  constructor(
    private readonly supabaseService: SupabaseService, // Inject SupabaseService
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chatWithGPT(userId: string, content: string) {
    // Save user message to Supabase
    await this.supabaseService.insertChatHistory(userId, 'user', content);

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

    // Save assistant (bot) message to Supabase and in-memory history
    this.conversationHistory.push({ role: 'assistant', content: botMessage });
    await this.supabaseService.insertChatHistory(
      userId,
      'assistant',
      botMessage,
    );

    return { response: botMessage };
  }

  async fetchChatHistory(userId: string) {
    const history = await this.supabaseService.fetchChatHistory(userId);

    // Optional: Sync the in-memory conversation history when fetching
    this.conversationHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    return history;
  }
}
