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

  async createNewSession(userId: string, exerciseId: string) {
    console.log(`Creating a new session for user: ${userId}`);

    // Fetch exercise details using exerciseId
    let exercise;
    try {
      exercise = await this.supabaseService.getExerciseById(exerciseId);
    } catch (error) {
      console.error(`Exercise with id ${exerciseId} not found`);
      throw new Error('Exercise not found');
    }

    if (!exercise) {
      console.error(`No exercise found with id ${exerciseId}`);
      throw new Error('Exercise not found');
    }

    console.log(`Fetched exercise: ${exercise.name}`);

    // Delegate session creation logic to MapService
    await this.mapService.createNewSession(userId, exercise.name);

    console.log(`Created session with exercise: ${exercise.name}`);
  }

  async updateSession(userId: string, exerciseId: string) {
    console.log(
      `Updating session for user: ${userId} with exercise ${exerciseId}`,
    );

    let exercise;
    try {
      exercise = await this.supabaseService.getExerciseById(exerciseId);
    } catch (error) {
      console.error(`Exercise with id ${exerciseId} not found`);
      throw new Error('Exercise not found');
    }

    if (!exercise) {
      console.error(`No exercise found with id ${exerciseId}`);
      throw new Error('Exercise not found');
    }

    // Update session with new exercise
    await this.mapService.updateCurrentExercise(userId, exercise.name);
    console.log(`Updated session with exercise: ${exercise.name}`);
  }

  async chatWithGPT(userId: string, content: string) {
    console.log('Processing chat for user:', userId, 'with message:', content);

    // Check if user session exists, if not create a new session
    if (!this.mapService.getSession(userId)) {
      console.log('No existing session found. Creating a new session...');
      const randomExercise = await this.supabaseService.fetchRandomExercise();
      await this.createNewSession(userId, randomExercise.id);
    }

    let userSession = this.mapService.getSession(userId);

    if (!userSession) {
      console.error(
        'User session is null after attempting to create/load a session.',
      );
      return { response: 'An error occurred. Please try again later.' };
    }

    // Save user message to Supabase
    await this.supabaseService.insertChatHistory(userId, 'user', content);

    this.conversationHistory.push({
      role: 'user',
      content: content,
    });

    // Determine user motivation
    const x_m = this.determineUserMotivation(content);
    console.log(`Determined motivation: ${x_m}`);

    // If high motivation, proceed
    if (x_m === 1) {
      console.log('User agreed to exercise. No further persuasion needed.');
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

    // Low motivation: continue persuasion attempts
    console.log('User did not agree. Running persuasion strategy...');
    await this.mapService.incrementFailedPersuasionCount(userId);
    userSession = this.mapService.getSession(userId);

    // ** Run persuasion strategy first
    const route = this.mapService.decidePersuasionRoute(userId, x_m);
    const strategy = this.mapService.getCurrentStrategy(userId);
    console.log(`Selected persuasion route: ${route}`);
    console.log(`Using persuasion strategy: ${strategy}`);

    const prompt = this.generatePrompt(route, userId);

    // Get response from ChatGPT
    const chatCompletion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant' }, // Only in memory
        ...this.conversationHistory,
        { role: 'user', content: prompt },
      ],
    });

    const botMessage = chatCompletion.choices[0].message.content;

    // Save assistant (bot) message to Supabase
    this.conversationHistory.push({ role: 'assistant', content: botMessage });
    await this.supabaseService.insertChatHistory(
      userId,
      'assistant',
      botMessage,
    );

    // Check if persuasionAttempt == 3
    if (userSession.persuasionAttempt == 3) {
      // Recommend new exercise after running persuasion strategy
      let newExercise;
      do {
        newExercise = await this.supabaseService.fetchRandomExercise();
      } while (newExercise.name === userSession.current_exercise);

      console.log(`Switching to a new exercise: ${newExercise.name}`);
      userSession.current_exercise = newExercise.name;
      userSession.failedPersuasionCount = 0;

      // Update session with new exercise
      await this.updateSession(userId, newExercise.id);

      return { response: `What about trying ${newExercise.name}?` };
    } else if (userSession.persuasionAttempt >= 6) {
      // Give up after 6 failed attempts
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
      "I don't have time",
      "I'm too busy",
      "I don't want to exercise alone",
    ];

    const isPositive = positiveKeywords.some((keyword) =>
      response.toLowerCase().includes(keyword),
    );
    const isNegative = negativeKeywords.some((keyword) =>
      response.toLowerCase().includes(keyword),
    );

    // Return 1 for high motivation, 0 for low motivation
    if (isPositive) return 1;
    if (isNegative) return 0;
    return 0.5; // Neutral motivation level
  }

  async fetchChatHistory(userId: string) {
    console.log('Fetching chat history for user:', userId);
    const history = await this.supabaseService.fetchChatHistory(userId);

    console.log('Fetched chat history from Supabase:', history);

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

    let prompt = '';
    if (route === 'central') {
      prompt = `The user responded with: "${lastUserResponse}". Now explain the health benefits of ${exerciseInfo}. Strategy: ${strategy}`;
    } else {
      prompt = `The user responded with: "${lastUserResponse}". Encourage the user to do ${exerciseInfo} in a friendly tone. Strategy: ${strategy}`;
    }

    console.log('Generated Prompt with User Response:', prompt);
    return prompt;
  }

  async updateStrategyWeights(userId: string, successful: boolean) {
    console.log(
      'Updating strategy weights for user:',
      userId,
      'Success:',
      successful,
    );

    await this.mapService.updateStrategyWeights(userId, successful);
  }
}
