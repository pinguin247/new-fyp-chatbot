export const fetchHistory = async (userId: string) => {
  console.log('Fetching chat history for userId:', userId);
  console.log('Endpoint:', `${process.env.EXPO_PUBLIC_MY_ENDPOINT}/history`);

  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_MY_ENDPOINT}/history`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch chat history');
    }

    const data = await response.json();
    return data; // Return the fetched chat history
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return []; // Return an empty array on error
  }
};
