export const fetchResponse = async (text: string) => {
  try {
    const response = await fetch(process.env.EXPO_PUBLIC_MY_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return await response.text();
  } catch (error) {
    console.error('Error fetching response:', error);
    return 'Sorry, something went wrong.';
  }
};
