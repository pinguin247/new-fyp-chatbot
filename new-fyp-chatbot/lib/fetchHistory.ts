export const fetchHistory = async (userId: string) => {
  console.log('Fetching chat history for userId:', userId);
  console.log(
    'Endpoint:',
    `${process.env.EXPO_PUBLIC_MY_ENDPOINT}/chat/history`,
  );

  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_MY_ENDPOINT}/chat/history`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include', // Ensure credentials are sent with the request
      },
    );

    if (response.redirected) {
      console.error('Redirected to:', response.url);
      throw new Error('Redirection detected, likely due to authentication.');
    }

    // Check the response status before trying to read the body
    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    // Store the response text for logging and JSON parsing
    const responseText = await response.text();
    console.log('Raw Response:', responseText);

    // Now parse the stored text as JSON
    const data = JSON.parse(responseText);

    return data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return []; // Return an empty array on error
  }
};
