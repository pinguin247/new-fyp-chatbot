import { supabase } from '../lib/supabase'; // Adjust the path according to your folder structure

// Function to fetch the user profile by userId
export const fetchUserProfile = async (userId: string) => {
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*') // Selecting all fields
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile data:', profileError);
      return null;
    }

    return profileData; // Return the entire profile object
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
