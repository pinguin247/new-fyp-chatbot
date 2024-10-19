import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { SupabaseService } from '../supabase/supabase.service';
import { MapService } from '../map/map.service';
import { PatientService } from '../patient/patient.service';
import { ExerciseAllocationService } from '../exercise/exercise_allocation.service';
import { ExerciseSummaryService } from '../exercise/exercise_summary.service';

import { DateTime } from 'luxon';
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
    private readonly patientService: PatientService,
    private readonly exerciseAllocationService: ExerciseAllocationService,
    private readonly eerciseSummaryService: ExerciseSummaryService,
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

  formatTimeTo12Hour = (time: string) => {
    return DateTime.fromISO(time).toLocaleString(DateTime.TIME_SIMPLE); // Example: 1:30 PM
  };

  async createNewSession(userId: string, exerciseId: string) {
    //console.log(`Creating a new session for user: ${userId}`);
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
    //console.log('Processing chat for user:', userId, 'with message:', content);

    try {
      // Clear the conversation history before processing new chat
      this.conversationHistory = [];

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

      // Fetch patient details for personalization

      const patientDetails =
        await this.supabaseService.fetchUserInputsByPatientId(userId);

      //Fetch Doctor Inputs

      const doctorInput =
        await this.patientService.getDoctorInputsByPatientId(userId);

      // Extract the current exercise from the session
      const currentExercise = userSession?.current_exercise || 'exercise';

      // Check if it's the user's first message
      // Check if it's the user's first message
      if (userSession.first_time) {
        console.log('Handling first-time user message...');

        // Determine user's motivation for the first message
        const motivationResult =
          await this.determineUserMotivationFromGPT(content);
        console.log('Motivation determined by GPT:', motivationResult);

        // Update the strategy parameters in the session
        await this.mapService.updateStrategyWeights(userId, motivationResult);

        // Update the session to set first_time to false
        await this.mapService.updateFirstTime(userId, false);

        const strategy = this.mapService.getCurrentStrategy(userId);
        const strategyExamples =
          await this.supabaseService.fetchExamplesByStrategy(strategy);

        if (!strategyExamples || strategyExamples.length === 0) {
          throw new Error(`No examples found for strategy: ${strategy}`);
        }
        const strategyExampleText = strategyExamples.join(' ');

        userSession.current_exercise = 'Swimming';

        let prompt;
        if (motivationResult === 1) {
          prompt = `Explain the health benefits of doing ${userSession.current_exercise} and encourage them to do this exercise. Use persuasion Strategy: ${strategy}. Encourage them to continue and ask if they are interested in proceeding with the exercise. Keep your response within 70 words.`;
        } else {
          prompt = `Encourage the user to do ${userSession.current_exercise} in a friendly and motivating tone. Use persuasion Strategy: ${strategy}. Keep your response within 70 words. Ask if they are interested in proceeding with the exercise. Keep your response within 70 words.`;
        }

        // Log the prompt that will be sent to GPT
        //console.log('Sending the following prompt to GPT API:', prompt);

        // Get the response from GPT
        const botMessage =
          await this.generateGPTResponsewithChatHistory(prompt);

        // Return the generated response
        return { response: botMessage };
      }

      // For subsequent messages, use the existing flow
      console.log('Handling subsequent user message...');

      // Determine user's motivation level

      const { motivation: x_m, wantNewExercise } =
        await this.determineUserMotivation(content);

      console.log(
        `Determined motivation: ${x_m}, Want new exercise: ${wantNewExercise}`,
      );

      if (wantNewExercise) {
        // Recommend a new exercise without changing the persuasion strategy
        const newExercise = await this.supabaseService.fetchRandomExercise();
        console.log(`Recommending new exercise: ${newExercise.name}`);

        // Update the session with the new exercise
        await this.updateSession(userId, newExercise.id);

        // Generate a prompt for the new exercise using the current strategy
        const strategy = this.mapService.getCurrentStrategy(userId);
        const strategyExamples =
          await this.supabaseService.fetchExamplesByStrategy(strategy);
        const conversationHistory =
          await this.supabaseService.fetchChatHistory(userId);

        const prompt = this.generatePromptWithNewExercise(
          strategy,
          strategyExamples,
          newExercise.name,
          patientDetails,
          doctorInput,
          conversationHistory,
        );

        const gptResponse =
          await this.generateGPTResponsewithChatHistory(prompt);

        // Save the GPT response in Supabase
        await this.supabaseService.insertChatHistory(
          userId,
          'assistant',
          gptResponse,
        );

        return { response: gptResponse };
      }

      if (x_m === 1) {
        return this.handlePersuasionSuccess(userId, currentExercise);
      }

      await this.mapService.incrementFailedPersuasionCount(userId);

      if (userSession.persuasionAttempt >= 6) {
        console.log(
          `6th attempt reached for user ${userId}, sending give up message.`,
        );
        // Update strategy weights and handle 6th attempt give-up message
        await this.mapService.updateStrategyWeights(userId, 0);
        return this.handlePersuasionAttempts(userId, userSession, '');
      }

      const route = this.mapService.decidePersuasionRoute(
        userSession.sessionID,
        userId,
        x_m,
      );
      await this.mapService.updateStrategyWeights(userId, x_m);
      const strategy = this.mapService.getCurrentStrategy(userId);
      const strategyExamples =
        await this.supabaseService.fetchExamplesByStrategy(strategy);

      if (!strategyExamples || strategyExamples.length === 0) {
        throw new Error(`No examples found for strategy: ${strategy}`);
      }
      const strategyExampleText = strategyExamples.join(' ');

      const conversationHistory =
        await this.supabaseService.fetchChatHistory(userId);

      const prompt = this.generatePrompt(
        route,
        strategy,
        strategyExampleText,
        currentExercise,
        patientDetails,
        doctorInput,
        content,
        conversationHistory,
      );

      // Log the prompt that will be sent to the API
      console.log('Sending the following prompt to GPT API:', prompt);

      // Get response from GPT
      const botMessage = await this.generateGPTResponsewithChatHistory(prompt);
      this.conversationHistory.push({ role: 'assistant', content: botMessage });

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
  private async handlePersuasionSuccess(
    userId: string,
    currentExercise: string,
  ) {
    // Check for free slots first before sending the prompt
    const exerciseDuration = 30; // Set the exercise duration, for example, 30 minutes
    const allocationResult =
      await this.exerciseAllocationService.allocateExerciseSlot(
        userId,
        currentExercise,
        exerciseDuration,
      );

    // If the user has a free slot, proceed with the allocation
    if (allocationResult.success) {
      // Incorporate the allocated time and day into the success message
      const { message } = allocationResult; // The message contains allocated day and time details

      const formattedMessage = message.replace(
        /(\d{2}:\d{2}:\d{2})/g,
        (match) => this.formatTimeTo12Hour(match),
      );

      // Create a prompt for GPT to generate a thank you message with resources and success message
      const prompt = `Thank the user for agreeing to perform the exercise "${currentExercise}". Provide helpful resources and confirm that their exercise has been scheduled. Keep your response within 100 words.`;

      // Get the GPT response for the personalized message
      const gptResponse = await this.generateGPTResponsewithChatHistory(prompt);

      // Add the GPT response to the conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: gptResponse,
      });

      // Save the GPT response in Supabase
      await this.supabaseService.insertChatHistory(
        userId,
        'assistant',
        gptResponse,
      );

      // Save the allocation success message in Supabase
      this.conversationHistory.push({
        role: 'assistant',
        content: `Exercise has been scheduled successfully. ${allocationResult.message}`,
      });

      await this.supabaseService.insertChatHistory(
        userId,
        'assistant',
        `Exercise has been scheduled successfully. ${allocationResult.message}`,
      );

      // Update the strategy weights to reflect the successful persuasion
      await this.mapService.updateStrategyWeights(userId, 1);

      return { response: gptResponse };
    }

    // If no free slots are available, modify the prompt
    const noSlotPrompt = `The user has agreed to perform the exercise: ${currentExercise}, but they don't have any available free time this week. Please generate a thank you message encouraging them to find time to complete the exercise. Keep your response within 70 words.`;

    // Get the GPT response for the no-slot scenario
    const noSlotResponse =
      await this.generateGPTResponsewithChatHistory(noSlotPrompt);

    // Add the response to the conversation history
    this.conversationHistory.push({
      role: 'assistant',
      content: noSlotResponse,
    });

    // // Save the no-slot response in Supabase
    // await this.supabaseService.insertChatHistory(
    //   userId,
    //   'assistant',
    //   noSlotResponse,
    // );

    // Also save a failure message about slot availability
    this.conversationHistory.push({
      role: 'assistant',
      content: `Unfortunately, we couldn't find an available slot for your exercise. Please try to free up some time in your schedule and attempt the exercise.`,
    });

    await this.supabaseService.insertChatHistory(
      userId,
      'assistant',
      `Unfortunately, we couldn't find an available slot for your exercise. Please try to free up some time in your schedule and attempt the exercise.`,
    );

    // Update the strategy weights to reflect unsuccessful persuasion
    await this.mapService.updateStrategyWeights(userId, 1);

    return { response: noSlotResponse };
  }

  // Handle persuasion logic for 3 and 6 attempts
  // Handle persuasion logic for 3 and 6 attempts
  private async handlePersuasionAttempts(
    userId: string,
    userSession: any,
    botMessage: string,
  ) {
    // On the 3rd attempt, recommend a new exercise and use a dynamic prompt
    if (userSession.persuasionAttempt === 2) {
      console.log(
        `2rd attempt reached for user ${userId}, recommending a new exercise.`,
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

      //Fetch Doctor Inputs
      const doctorInput =
        await this.patientService.getDoctorInputsByPatientId(userId);

      const conversationHistory =
        await this.supabaseService.fetchChatHistory(userId);
      // Generate a dynamic and persuasive prompt with the new exercise
      const prompt = this.generatePromptWithNewExercise(
        strategy,
        strategyExamples,
        newExercise.name, // Use the new exercise here
        patientDetails,
        doctorInput,
        conversationHistory,
      );

      //console.log(`Generated prompt for 3rd attempt: ${prompt}`);

      // Get response from GPT
      const gptResponse = await this.generateGPTResponsewithChatHistory(prompt);

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
    if (userSession.persuasionAttempt >= 4) {
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
      console.log('Giving up after 4 failed attempts.');
      return { response: giveUpMessage };
    }

    return { response: botMessage };
  }

  private async generateGPTResponsewithChatHistory(prompt: string) {
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        //model: 'gpt-3.5-turbo',
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          // Add conversation history here before the current prompt
          //...this.conversationHistory,
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });
      return chatCompletion.choices[0].message.content;
    } catch (error) {
      throw new Error('Error while generating GPT response.');
    }
  }

  // Determine user's motivation from response
  async determineUserMotivation(
    response: string,
  ): Promise<{ motivation: number; wantNewExercise: boolean }> {
    console.log('Determining user motivation and exercise change request...');

    const prompt = `What is the user's motivation level and do they want a different exercise based on their response: "${response}"? Please provide the motivation level as a number (1 for high, 0 for low) and indicate if they want a different exercise (true or false). Please respond in the format: {"motivation": number, "wantNewExercise": boolean}`;

    try {
      const chatCompletion = await this.openai.chat.completions.create({
        //model: 'gpt-3.5-turbo',
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });

      const rawResponse = chatCompletion.choices[0].message.content.trim();
      console.log('Raw GPT response:', rawResponse);

      let result;
      try {
        result = JSON.parse(rawResponse);
      } catch (parseError) {
        console.error('Error parsing GPT response:', parseError);
        // If parsing fails, attempt to extract information manually
        const motivationMatch = rawResponse.match(/motivation:\s*(\d)/i);
        const newExerciseMatch = rawResponse.match(
          /wantNewExercise:\s*(true|false)/i,
        );

        result = {
          motivation: motivationMatch ? parseInt(motivationMatch[1]) : 0,
          wantNewExercise: newExerciseMatch
            ? newExerciseMatch[1].toLowerCase() === 'true'
            : false,
        };
      }

      // Validate the result
      if (
        (result.motivation === 0 || result.motivation === 1) &&
        typeof result.wantNewExercise === 'boolean'
      ) {
        return result;
      } else {
        console.error('Invalid result structure:', result);
        // Return default values if validation fails
        return { motivation: 0, wantNewExercise: false };
      }
    } catch (error) {
      console.error('Error determining motivation using GPT:', error);
      // Return default values in case of any error
      return { motivation: 0, wantNewExercise: false };
    }
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
    doctorInputs: any,
    lastUserResponse: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[], // Pass conversation history
  ): string {
    // Extract patient details like age, gender for personalization
    const { age, gender } = patientDetails || {
      age: 'unknown',
      gender: 'unknown',
    };

    const { medical_condition, disability_level } = doctorInputs || {
      medical_condition: 'unknown',
      disability_level: 'unknown',
    };

    // Start creating the prompt with the chat history context
    let historyPrompt = 'Here is the chat history:\n';

    // Append the conversation history
    conversationHistory.forEach((message) => {
      historyPrompt += `${message.role === 'user' ? 'User' : 'Assistant'}: ${
        message.content
      }\n`;
    });

    currentExercise = 'Swimming';

    // Add current context for the new prompt
    historyPrompt += `\nThe user responded with: "${lastUserResponse}". Address user's response at the start.`;

    if (route === 'central') {
      historyPrompt += `Explain the health benefits of doing ${currentExercise} and encourage them to do this exercise. Use persuasion Strategy: ${strategy}. Keep your response within 70 words.`;
    } else {
      historyPrompt += `Encourage the user to do ${currentExercise} in a friendly and motivating tone. Use persuasion Strategy: ${strategy}. Keep your response within 70 words.`;
    }

    return historyPrompt;
  }
  generatePromptWithNewExercise(
    strategy: string,
    strategyExamples: string[],
    newExercise: string,
    patientDetails: any,
    doctorInputs: any,
    conversationHistory: any,
  ): string {
    // Extract patient details like age, gender for personalization
    const { age, gender } = patientDetails || {
      age: 'unknown',
      gender: 'unknown',
    };

    const { medical_condition, disability_level } = doctorInputs || {
      medical_condition: 'unknown',
      disability_level: 'unknown',
    };

    // Start creating the prompt with the chat history context
    let historyPrompt = 'Here is the chat history:\n';

    // Append the conversation history
    conversationHistory.forEach((message) => {
      historyPrompt += `${message.role === 'user' ? 'User' : 'Assistant'}: ${
        message.content
      }\n`;
    });

    // Add the last user response from the history
    const lastUserResponse =
      conversationHistory.reverse().find((msg) => msg.role === 'user')
        ?.content || '';

    // Randomly select a strategy example as a reference
    const exampleToUse =
      strategyExamples[Math.floor(Math.random() * strategyExamples.length)];

    newExercise = 'Badminton';

    // Complete the prompt using the strategy example and new exercise
    historyPrompt += `\nThe user responded with: "${lastUserResponse}". `;
    historyPrompt += `Recommend the new exercise, ${newExercise}. Ensure the response is persuasive and motivational. Use persuasion Strategy: ${strategy}. Keep your response within 70 words.`;

    return historyPrompt;
  }

  async updateStrategyWeights(userId: string, successful: number) {
    console.log(
      `Updating strategy weights for user ${userId}. Success: ${successful}`,
    );
    await this.mapService.updateStrategyWeights(userId, successful);
  }

  private async determineUserMotivationFromGPT(
    content: string,
  ): Promise<number> {
    console.log('Determining user motivation based on mood...');

    // Update the prompt to make sure GPT understands the context of the first message
    const motivationPrompt = `Based on the user's response: "${content}", determine the user's motivation level. Please return either 1 for high motivation or 0 for low motivation. Only respond with the number 1 or 0.`;

    try {
      // Send the updated prompt to GPT
      const chatCompletion = await this.openai.chat.completions.create({
        //model: 'gpt-3.5-turbo',
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: motivationPrompt },
        ],
        temperature: 0.7,
      });

      // Parse GPT's response, which should be either "1" or "0"
      const motivationResponse =
        chatCompletion.choices[0].message.content.trim();

      console.log('MOTIVATION: ', motivationResponse);

      // Convert the response to a number and return it
      const motivation = parseInt(motivationResponse, 10);

      // Ensure the motivation is either 1 or 0
      if (motivation === 1 || motivation === 0) {
        return motivation;
      } else {
        throw new Error('Unexpected value returned from GPT.');
      }
    } catch (error) {
      console.error('Error determining motivation with GPT:', error);
      throw new Error('Error determining user motivation.');
    }
  }
}
