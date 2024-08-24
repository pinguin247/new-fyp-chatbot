import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { SupabaseService } from '../supabase/supabase.service';
import { MapService } from '../map/map.service'; // Import the MapService

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private conversationHistory: {
    role: 'user' | 'system' | 'assistant';
    content: string;
  }[] = [];

  constructor(
    private readonly supabaseService: SupabaseService, // Inject SupabaseService
    private readonly mapService: MapService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createNewSession(userId: string) {
    console.log('Creating a new session for user:', userId); // Log the creation of a new session

    // Use MapService to create a new session
    await this.mapService.createNewSession(userId);

    // Fetch a random exercise from Supabase
    const exercise = await this.supabaseService.fetchRandomExercise();

    console.log('Fetched random exercise:', exercise.name); // Log the fetched exercise

    // Save the recommended exercise in chat history
    await this.supabaseService.insertChatHistory(
      userId,
      'system',
      `Let's start with ${exercise.name}. ${exercise.description}`,
    );

    this.conversationHistory.push({
      role: 'system',
      content: `Let's start with ${exercise.name}. ${exercise.description}`,
    });
  }

  async chatWithGPT(userId: string, content: string) {
    console.log('Processing chat for user:', userId, 'with message:', content); // Log user message

    // Check if user session exists, if not create a new session
    if (!this.mapService.getSession(userId)) {
      console.log('No existing session found. Creating a new session...');
      await this.createNewSession(userId);
    }

    // Save user message to Supabase
    await this.supabaseService.insertChatHistory(userId, 'user', content);

    this.conversationHistory.push({
      role: 'user',
      content: content,
    });

    // Check if the user's response is positive
    if (this.isPositiveResponse(content)) {
      console.log('User agreed to exercise. No further persuasion needed.'); // Log user agreement
      // Acknowledge the user's positive response
      const confirmationMessage =
        "Great! I'm glad you're willing to try the exercise. Keep it up!";
      this.conversationHistory.push({
        role: 'assistant',
        content: confirmationMessage,
      });

      // Save the confirmation message to Supabase
      await this.supabaseService.insertChatHistory(
        userId,
        'assistant',
        confirmationMessage,
      );

      return { response: confirmationMessage };
    }

    // Run persuasion strategy only if the initial response is negative or user has not agreed yet
    const userSession = this.mapService.getSession(userId);
    if (userSession && userSession.persuasionAttempt === 0) {
      console.log('User did not agree. Running persuasion strategy...'); // Log persuasion start

      // Decide the persuasion route and strategy using MapService
      const route = this.mapService.decidePersuasionRoute(userId, content);
      const strategy = this.mapService.getCurrentStrategy(userId);
      console.log(`Selected persuasion route: ${route}`); // Log the persuasion route
      console.log(`Using persuasion strategy: ${strategy}`); // Log the specific strategy

      const prompt = this.generatePrompt(route, userId);

      // Get response from ChatGPT
      const chatCompletion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          ...this.conversationHistory,
          { role: 'user', content: prompt }, // Add prompt for ChatGPT
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

    // If the user has agreed, don't run the persuasion model again
    console.log('User has already agreed. No need to run persuasion again.'); // Log stopping of persuasion
    return { response: 'Thank you for your response!' };
  }

  async fetchChatHistory(userId: string) {
    console.log('Fetching chat history for user:', userId); // Log fetch history
    const history = await this.supabaseService.fetchChatHistory(userId);

    console.log('Fetched chat history from Supabase:', history); // Log the fetched history

    // Optional: Sync the in-memory conversation history when fetching
    this.conversationHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log('Updated in-memory conversation history.'); // Log update of in-memory history

    return history;
  }

  generatePrompt(route: 'central' | 'peripheral', userId: string): string {
    const strategy = this.mapService.getCurrentStrategy(userId);
    const lastExercise = this.conversationHistory.find(
      (msg) =>
        msg.role === 'system' && msg.content.includes("Let's start with"),
    );

    const exerciseInfo = lastExercise
      ? lastExercise.content.split("Let's start with ")[1]
      : 'an exercise';

    let prompt = '';

    if (route === 'central') {
      prompt = `Explain the health benefits of ${exerciseInfo}. Strategy: ${strategy}`;
    } else {
      prompt = `Encourage the user to do ${exerciseInfo} in a friendly tone. Strategy: ${strategy}`;
    }

    // Print out the generated prompt for debugging
    console.log('Generated Prompt:', prompt);

    return prompt;
  }

  async updateStrategyWeights(userId: string, successful: boolean) {
    console.log(
      'Updating strategy weights for user:',
      userId,
      'Success:',
      successful,
    ); // Log strategy weight update

    // Update strategy weights using MapService
    await this.mapService.updateStrategyWeights(userId, successful);

    // Log strategy weights update in chat history
    await this.supabaseService.insertChatHistory(
      userId,
      'system',
      'Strategy weights updated',
    );
  }

  // Helper function to determine if the response is positive
  isPositiveResponse(response: string): boolean {
    const positiveKeywords = [
      'yes',
      'sure',
      'okay',
      'great',
      'awesome',
      'sounds good',
      "let's do it",
    ];
    return positiveKeywords.some((keyword) =>
      response.toLowerCase().includes(keyword),
    );
  }

  // Helper function to determine if the response is negative
  isNegativeResponse(response: string): boolean {
    const negativeKeywords = [
      'no',
      'not interested',
      'maybe later',
      "don't want to",
    ];
    return negativeKeywords.some((keyword) =>
      response.toLowerCase().includes(keyword),
    );
  }
}
