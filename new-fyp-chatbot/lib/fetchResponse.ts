export const fetchResponse = async (userId: string, content: string) => {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_MY_ENDPOINT}/message`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }

    const data = await response.json();
    return data.response; // Extract the 'response' property from the JSON object
  } catch (error) {
    console.error('Error fetching response:', error);
    return 'Sorry, something went wrong.';
  }
};
