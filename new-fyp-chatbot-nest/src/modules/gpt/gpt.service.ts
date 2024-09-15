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
      let userSession = await this.mapService.loadSessionFromSupabase(userId);

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
        userSession = await this.mapService.loadSessionFromSupabase(userId);
        if (!userSession || !userSession.sessionID) {
          throw new Error('Session could not be loaded after creation.');
        }
      }

      // Ensure sessionID is valid before proceeding
      const sessionId = userSession.sessionID;
      if (!sessionId) {
        throw new Error('Session ID is missing or null.');
      }

      // Fetch patient details for personalization
      const patientDetails =
        await this.supabaseService.fetchUserInputsByPatientId(userId);

      // Save the user's message to Supabase
      await this.supabaseService.insertChatHistory(userId, 'user', content);
      this.conversationHistory.push({ role: 'user', content });

      // Determine user's motivation level
      const x_m = this.determineUserMotivation(content);
      console.log(`Determined motivation: ${x_m}`);

      if (x_m === 1) {
        return this.handleMotivatedUser(userId);
      }

      await this.mapService.incrementFailedPersuasionCount(userId);
      const route = this.mapService.decidePersuasionRoute(
        sessionId,
        userId,
        x_m,
      );
      const strategy = this.mapService.getCurrentStrategy(userId);

      // Fetch examples based on the selected strategy (returns an array of examples)
      const strategyExamples =
        await this.supabaseService.fetchExamplesByStrategy(strategy);

      if (!strategyExamples || strategyExamples.length === 0) {
        throw new Error(`No examples found for strategy: ${strategy}`);
      }

      // Concatenate the examples into a single string
      const strategyExampleText = strategyExamples.join(' ');

      // Get the current exercise for the session
      const currentExercise = userSession?.current_exercise || 'exercise';

      // Generate prompt with the concatenated examples and current exercise
      const prompt = this.generatePrompt(
        route,
        strategy,
        strategyExampleText,
        currentExercise,
        patientDetails, // Pass the patient details for personalization
      );

      // Log the prompt that will be sent to the API
      console.log('Sending the following prompt to GPT API:', prompt);

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

    // Update the strategy weights to reflect the successful persuasion
    await this.mapService.updateStrategyWeights(userId, true);

    return { response: confirmationMessage };
  }

  // Handle persuasion logic for 3 and 6 attempts
  // Handle persuasion logic for 3 and 6 attempts
  private async handlePersuasionAttempts(
    userId: string,
    userSession: any,
    botMessage: string,
  ) {
    // On the 3rd attempt, recommend a new exercise and use a dynamic prompt
    if (userSession.persuasionAttempt === 3) {
      console.log(
        `3rd attempt reached for user ${userId}, recommending a new exercise.`,
      );

      // Fetch a new exercise
      let newExercise;
      do {
        newExercise = await this.supabaseService.fetchRandomExercise();
      } while (newExercise.name === userSession.current_exercise);

      console.log(`New exercise recommended: ${newExercise.name}`);

      // Update the session with the new exercise
      userSession.current_exercise = newExercise.name;
      userSession.failedPersuasionCount = 0;

      await this.updateSession(userId, newExercise.id);

      // Fetch an example for the persuasion strategy
      const strategy = this.mapService.getCurrentStrategy(userId);
      const strategyExamples =
        await this.supabaseService.fetchExamplesByStrategy(strategy);

      if (!strategyExamples || strategyExamples.length === 0) {
        throw new Error(`No example found for strategy: ${strategy}`);
      }

      // Fetch patient details for personalization
      const patientDetails =
        await this.supabaseService.fetchUserInputsByPatientId(userId);

      // Generate a dynamic and persuasive prompt with the new exercise
      const prompt = this.generateDynamicPromptWithNewExercise(
        strategy,
        strategyExamples,
        newExercise.name, // Use the new exercise here
        patientDetails,
      );

      console.log(`Generated prompt for 3rd attempt: ${prompt}`);

      // Get response from GPT
      const gptResponse = await this.generateGPTResponse(prompt);

      console.log(`GPT response for 3rd attempt: ${gptResponse}`);

      this.conversationHistory.push({
        role: 'assistant',
        content: gptResponse,
      });

      // Save the recommendation response in Supabase
      await this.supabaseService.insertChatHistory(
        userId,
        'assistant',
        gptResponse,
      );

      return { response: gptResponse };
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

  generatePrompt(
    route: 'central' | 'peripheral',
    strategy: string,
    strategyExamples: string, // Pass examples as a single string
    currentExercise: string, // Include exercise in prompt
    patientDetails: any, // Include patient details
  ): string {
    const lastUserResponse =
      this.conversationHistory.reverse().find((msg) => msg.role === 'user')
        ?.content || '';

    // Extract patient details like age, gender, and country for personalization
    const { age, gender, country } = patientDetails || {
      age: 'unknown',
      gender: 'unknown',
      country: 'unknown',
    };

    // Add the strategy examples, exercise, and patient details to the prompt
    if (route === 'central') {
      return `The user responded with: "${lastUserResponse}". For background info, this patient is from ${country} who is ${age} years old. They are ${gender}. Now, explain the health benefits of doing ${currentExercise}, drawing inspiration from these examples: "${strategyExamples}". Please generate a unique response based on this but do not copy the examples exactly. Strategy: ${strategy}. Try to craft your response catering to the demographic as well.`;
    } else {
      return `The user responded with: "${lastUserResponse}". For background info, this patient is from ${country} who is ${age} years old. They are ${gender}. Encourage the user to do ${currentExercise} in a friendly and motivating tone. Use these examples for inspiration: "${strategyExamples}". Create a new response that is based on but does not exactly copy the examples. Strategy: ${strategy}. Try to craft your response catering to the demographic as well.`;
    }
  }
  generateDynamicPromptWithNewExercise(
    strategy: string,
    strategyExamples: string[],
    newExercise: string, // The newly recommended exercise\
    patientDetails: any, // Include patient details
  ): string {
    const lastUserResponse =
      this.conversationHistory.reverse().find((msg) => msg.role === 'user')
        ?.content || '';

    // Extract patient details like age, gender, and country for personalization
    const { age, gender, country } = patientDetails || {
      age: 'unknown',
      gender: 'unknown',
      country: 'unknown',
    };

    // Randomly select a strategy example as a reference
    const exampleToUse =
      strategyExamples[Math.floor(Math.random() * strategyExamples.length)];

    // Use the new exercise and strategy example in the prompt
    return `The user responded with: "${lastUserResponse}". For background info, this patient is from ${country} who is ${age} years old. They are ${gender}. Recommend the new exercise, ${newExercise}, using this example as inspiration: "${exampleToUse}". Ensure the response is persuasive and motivational but does not directly copy the example. Strategy: ${strategy}. Try to craft your response catering to the demographic as well.`;
  }

  async updateStrategyWeights(userId: string, successful: boolean) {
    console.log(
      `Updating strategy weights for user ${userId}. Success: ${successful}`,
    );
    await this.mapService.updateStrategyWeights(userId, successful);
  }
}
