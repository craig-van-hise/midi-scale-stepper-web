import { fetchBinaryLUT } from './binaryLut';
import type { PCS_Entry } from '../types/midi';

let lutData: (PCS_Entry | null)[] = [];

export async function initializeLUT(): Promise<void> {
  try {
    const baseUrl = typeof window !== 'undefined' ? (window.location.origin || '') : '';
    const url = `${baseUrl}/PCS_LUT.dat`;
    lutData = await fetchBinaryLUT(url);
  } catch (error) {
    console.error('Failed to load PCS_LUT.dat:', error);
    throw error;
  }
}

export function getLUT(): (PCS_Entry | null)[] {
  return lutData;
}

export function setLUT(data: (PCS_Entry | null)[]): void {
  lutData = data;
}
