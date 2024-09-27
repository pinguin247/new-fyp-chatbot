export const fetchRandomExercise = async () => {
  try {
    const response = await fetch(
      `http://${process.env.EXPO_PUBLIC_MY_ENDPOINT}/exercise/random`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch exercise');
    }
    const exercise = await response.json();
    return exercise;
  } catch (error) {
    console.error('Error fetching random exercise:', error);
    throw error;
  }
};
