export const updateSession = async (
  userId: string,
  exerciseId: string,
  updateData = {}, // Optional update data
) => {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_MY_ENDPOINT}/chat/updateSession`,
      {
        method: 'POST', // Assuming your backend accepts POST requests for updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          exerciseId,
          ...(Object.keys(updateData).length ? updateData : {}), // Send updateData only if it exists
        }),
      },
    );

    // Return the response as JSON
    return await response.json();
  } catch (error) {
    console.error('Error updating session:', error);
    return { success: false, message: 'Failed to update session.' };
  }
};
