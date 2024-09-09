import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { SupabaseService } from '../supabase/supabase.service';
import { MapService } from '../map/map.service'; // Import the MapService

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private conversationHistory: {
    role: 'user' | 'assistant';
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

  // Helper function to handle errors more gracefully
  private handleError(errorMessage: string, error: any) {
    console.error(`${errorMessage}:`, error);
    return { success: false, message: errorMessage };
  }

  async createNewSession(userId: string, exerciseId: string) {
    console.log(`Creating a new session for user: ${userId}`);

    try {
      // Fetch exercise details
      const exercise = await this.supabaseService.getExerciseById(exerciseId);
      if (!exercise) throw new Error('Exercise not found');

      console.log(`Fetched exercise: ${exercise.name}`);
      // Delegate session creation logic to MapService
      await this.mapService.createNewSession(userId, exercise.name);

      console.log(`Created session with exercise: ${exercise.name}`);
      return { success: true };
    } catch (error) {
      return this.handleError('Failed to create new session', error);
    }
  }

  async updateSession(userId: string, exerciseId: string) {
    console.log(
      `Updating session for user: ${userId} with exercise ${exerciseId}`,
    );

    try {
      // Fetch exercise details
      const exercise = await this.supabaseService.getExerciseById(exerciseId);
      if (!exercise) throw new Error('Exercise not found');

      // Update session with new exercise
      await this.mapService.updateCurrentExercise(userId, exercise.name);
      console.log(`Updated session with exercise: ${exercise.name}`);
      return { success: true };
    } catch (error) {
      return this.handleError('Failed to update session', error);
    }
  }

  async chatWithGPT(userId: string, content: string) {
    console.log('Processing chat for user:', userId, 'with message:', content);

    try {
      let userSession = this.mapService.getSession(userId);

      // If no session found, create a new one
      if (!userSession) {
        console.log('No existing session found. Creating a new session...');
        const randomExercise = await this.supabaseService.fetchRandomExercise();
        const sessionCreationResult = await this.createNewSession(
          userId,
          randomExercise.id,
        );

        if (!sessionCreationResult.success) {
          throw new Error('Failed to create a new session.');
        }

        // Re-fetch session after creation
        userSession = this.mapService.getSession(userId);
        if (!userSession)
          throw new Error('Session could not be loaded after creation.');
      }

      // Save the user's message to Supabase
      await this.supabaseService.insertChatHistory(userId, 'user', content);
      this.conversationHistory.push({ role: 'user', content });

      // Determine user's motivation level
      const x_m = this.determineUserMotivation(content);
      console.log(`Determined motivation: ${x_m}`);

      if (x_m === 1) {
        return this.handleMotivatedUser(userId);
      }

      // Handle persuasion attempt
      await this.mapService.incrementFailedPersuasionCount(userId);
      const route = this.mapService.decidePersuasionRoute(userId, x_m);
      const strategy = this.mapService.getCurrentStrategy(userId);
      const prompt = this.generatePrompt(route, userId);

      console.log(`Selected persuasion route: ${route}, strategy: ${strategy}`);

      // Get response from GPT
      const botMessage = await this.generateGPTResponse(prompt);
      this.conversationHistory.push({ role: 'assistant', content: botMessage });

      // Save the assistant's message to Supabase
      await this.supabaseService.insertChatHistory(
        userId,
        'assistant',
        botMessage,
      );

      // Handle 3 or 6 failed persuasion attempts
      return await this.handlePersuasionAttempts(
        userId,
        userSession,
        botMessage,
      );
    } catch (error) {
      return this.handleError('Failed to process chat', error);
    }
  }

  // When the user is already motivated
  private async handleMotivatedUser(userId: string) {
    const confirmationMessage =
      "Great! I'm glad you're willing to try the exercise. Keep it up!";
    this.conversationHistory.push({
      role: 'assistant',
      content: confirmationMessage,
    });

    // Save confirmation message to Supabase
    await this.supabaseService.insertChatHistory(
      userId,
      'assistant',
      confirmationMessage,
    );

    return { response: confirmationMessage };
  }

  // Handle persuasion logic for 3 and 6 attempts
  private async handlePersuasionAttempts(
    userId: string,
    userSession: any,
    botMessage: string,
  ) {
    // Recommend a new exercise after 3 failed persuasion attempts
    if (userSession.persuasionAttempt === 3) {
      let newExercise;
      do {
        newExercise = await this.supabaseService.fetchRandomExercise();
      } while (newExercise.name === userSession.current_exercise);

      console.log(`Switching to a new exercise: ${newExercise.name}`);
      userSession.current_exercise = newExercise.name;
      userSession.failedPersuasionCount = 0;

      await this.updateSession(userId, newExercise.id);
      return { response: `What about trying ${newExercise.name}?` };
    }

    // Give up after 6 failed attempts
    if (userSession.persuasionAttempt >= 6) {
      const giveUpMessage =
        "Alright, it seems you're not interested right now. Let's talk later!";
      this.conversationHistory.push({
        role: 'assistant',
        content: giveUpMessage,
      });

      await this.supabaseService.insertChatHistory(
        userId,
        'assistant',
        giveUpMessage,
      );
      console.log('Giving up after 6 failed attempts.');
      return { response: giveUpMessage };
    }

    return { response: botMessage };
  }

  // Function to generate GPT-3 response
  private async generateGPTResponse(prompt: string) {
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          ...this.conversationHistory,
          { role: 'user', content: prompt },
        ],
      });
      return chatCompletion.choices[0].message.content;
    } catch (error) {
      throw new Error('Error while generating GPT response.');
    }
  }

  // Determine user's motivation from response
  determineUserMotivation(response: string): number {
    const positiveKeywords = [
      'yes',
      'sure',
      'okay',
      'great',
      'awesome',
      'sounds good',
      "let's do it",
    ];
    const negativeKeywords = [
      'no',
      'not interested',
      'maybe later',
      "don't want to",
      "I'm too busy",
      "I don't want to exercise alone",
    ];

    if (
      positiveKeywords.some((keyword) =>
        response.toLowerCase().includes(keyword),
      )
    ) {
      return 1; // High motivation
    }

    if (
      negativeKeywords.some((keyword) =>
        response.toLowerCase().includes(keyword),
      )
    ) {
      return 0; // Low motivation
    }

    return 0.5; // Neutral motivation
  }

  async fetchChatHistory(userId: string) {
    console.log('Fetching chat history for user:', userId);
    const history = await this.supabaseService.fetchChatHistory(userId);
    this.conversationHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    console.log('Updated in-memory conversation history.');
    return history;
  }

  generatePrompt(route: 'central' | 'peripheral', userId: string): string {
    const strategy = this.mapService.getCurrentStrategy(userId);
    const userSession = this.mapService.getSession(userId);
    const exerciseInfo = userSession?.current_exercise || 'an exercise';
    const lastUserResponse =
      this.conversationHistory.reverse().find((msg) => msg.role === 'user')
        ?.content || '';

    if (route === 'central') {
      return `The user responded with: "${lastUserResponse}". Now explain the health benefits of ${exerciseInfo}. Strategy: ${strategy}`;
    } else {
      return `The user responded with: "${lastUserResponse}". Encourage the user to do ${exerciseInfo} in a friendly tone. Strategy: ${strategy}`;
    }
  }

  async updateStrategyWeights(userId: string, successful: boolean) {
    console.log(
      `Updating strategy weights for user ${userId}. Success: ${successful}`,
    );
    await this.mapService.updateStrategyWeights(userId, successful);
  }
}
