export const checkExistingSession = async (
  userId: string,
): Promise<boolean> => {
  try {
    const response = await fetch(
      `http://10.0.2.2:3000/map/check-session/${userId}`,
    );
    const data = await response.json();

    if (data.sessionExists) {
      console.log('Session exists for user:', userId);
      return true; // Return true if session exists
    } else {
      console.log('No session found for user:', userId);
      return false; // Return false if no session exists
    }
  } catch (error) {
    console.error('Error checking session:', error);
    return false; // Return false in case of error
  }
};