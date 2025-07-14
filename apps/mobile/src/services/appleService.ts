import { API_BASE_URL } from '../constants/config';

export class AppleService {
  static async login(idToken: string) {
    const response = await fetch(`${API_BASE_URL}/apple/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    return response.json();
  }
} 