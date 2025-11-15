import fs from 'fs';
import path from 'path';

export function loadJsonData(filename: string): any {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
}

export function getSymptomsDatabase() {
  return loadJsonData('symptoms_db.json');
}

export function getMedicalFacilitiesDatabase() {
  return loadJsonData('medical_facilities.json');
}

