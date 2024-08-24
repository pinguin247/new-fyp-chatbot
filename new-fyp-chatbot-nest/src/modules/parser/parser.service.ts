import { Injectable } from '@nestjs/common';

@Injectable()
export class ParserService {
  // Parse the text content of a file buffer into a JSON structure
  parseTextFileContent(content: string): any[] {
    const lines = content.split('\n').filter(Boolean);

    // Skip the header if it exists
    if (lines[0].startsWith('userID')) {
      lines.shift();
    }

    const records = lines.map((line) => {
      const data = line.split(';');

      if (data.length !== 9) {
        throw new Error(`Invalid line format: ${line}`);
      }

      let heartrate;
      try {
        heartrate = JSON.parse(data[8]);
      } catch (error) {
        console.error(`Error parsing JSON for heartrate: ${data[8]}`);
        throw new Error(`Invalid JSON in heartrate field: ${data[8]}`);
      }

      return {
        userID: parseInt(data[0], 10),
        startDate: data[1],
        duration: parseInt(data[2], 10),
        steps: parseInt(data[3], 10),
        distance: parseFloat(data[4]),
        calories: parseFloat(data[5]),
        moderateIntensity: parseInt(data[6], 10),
        vigorousIntensity: parseInt(data[7], 10),
        heartrate: heartrate,
      };
    });

    return records;
  }
}
