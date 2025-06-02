import axios from 'axios';
import { parse } from 'csv-parse/sync';

export interface NepalDestination {
  pID: number;
  pName: string;
  culture: number;
  adventure: number;
  wildlife: number;
  sightseeing: number;
  history: number;
  tags: string[];
  province: number;
  district: string;
  nearby_landmark: string;
  best_time_to_visit: string;
  things_to_do: string[];
  travel_tips: string[];
}

const GOOGLE_DRIVE_FILE_ID = process.env.GOOGLE_DRIVE_FILE_ID;
const GOOGLE_DRIVE_URL = `https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_FILE_ID}`;

export async function loadDestinationsFromDrive(): Promise<NepalDestination[]> {
  try {
    if (!GOOGLE_DRIVE_FILE_ID) {
      throw new Error('GOOGLE_DRIVE_FILE_ID is not set in .env');
    }

    const response = await axios.get(GOOGLE_DRIVE_URL, { responseType: 'text' });
    const fileContent = response.data;

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((record: Record<string, string>) => {
      const travelTipsRaw = record.travel_tips || '';
      const travelTips = travelTipsRaw
        .replace(/"/g, '')
        .split(';')
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);

      return {
        pID: parseInt(record.pID),
        pName: record.pName,
        culture: parseInt(record.culture),
        adventure: parseInt(record.adventure),
        wildlife: parseInt(record.wildlife),
        sightseeing: parseInt(record.sightseeing),
        history: parseInt(record.history),
        tags: record.tags?.replace(/"/g, '').split(',').map((tag: string) => tag.trim()) || [],
        province: parseInt(record.province),
        district: record.district,
        nearby_landmark: record.nearby_landmark,
        best_time_to_visit: record.best_time_to_visit,
        things_to_do: record.things_to_do?.split(',').map((item: string) => item.trim()) || [],
        travel_tips: travelTips.length > 0 ? travelTips : [],
      };
    });
  } catch (error) {
    console.error('Error fetching CSV from Google Drive:', error);
    return [];
  }
}