export const saveMessage = async (
  userId: string,
  content: string,
  role: string,
) => {
  console.log('Saving bot message for userId:', userId);
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_MY_ENDPOINT}/chat/saveMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          content: content,
          role: role,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save message');
    }
  } catch (error) {
    console.error('Error saving message:', error);
  }
};
