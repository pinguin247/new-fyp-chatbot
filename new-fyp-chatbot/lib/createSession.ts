export const createSession = async (userId: string, exerciseId: string) => {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_MY_ENDPOINT}/createSession`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, exerciseId }), // Pass exerciseId in the request body
      },
    );

    return await response.json();
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, message: 'Failed to create session.' };
  }
};
