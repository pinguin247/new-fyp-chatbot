export const fetchResponse = async (text: string) => {
  try {
    const response = await fetch(process.env.EXPO_PUBLIC_MY_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });

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
