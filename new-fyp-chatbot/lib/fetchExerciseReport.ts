interface ExerciseReport {
  totalExerciseDuration: number;
  avgHeartRate: number;
  exerciseCount: number;
  totalModerateIntensity: number;
  totalVigorousIntensity: number;
}

export const fetchExerciseReport = async (
  profileId: string,
  startDate: string,
  endDate: string,
): Promise<ExerciseReport | null> => {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_MY_ENDPOINT}/exercise?profileId=${profileId}&startDate=${startDate}&endDate=${endDate}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exercise report');
    }

    const reportText = await response.text();

    // If the response is an empty string, return null
    if (reportText.trim() === '') {
      return null;
    }

    // Parse the report text into an object
    const lines = reportText.split('\n');
    const report: ExerciseReport = {
      totalExerciseDuration: parseInt(lines[2].split(': ')[1]),
      avgHeartRate: parseFloat(lines[3].split(': ')[1]),
      exerciseCount: parseInt(lines[4].split(': ')[1]),
      totalModerateIntensity: parseFloat(lines[5].split(': ')[1]),
      totalVigorousIntensity: parseFloat(lines[6].split(': ')[1]),
    };

    return report;
  } catch (error) {
    console.error('Error fetching exercise report:', error);
    throw error;
  }
};
