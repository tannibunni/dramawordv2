import { API_BASE_URL } from '../constants/config';

export interface AppleLoginData {
  idToken: string;
  email?: string;
  fullName?: {
    givenName?: string;
    familyName?: string;
  };
  guestUserId?: string;
}

export class AppleService {
  static async login(loginData: AppleLoginData) {
    const response = await fetch(`${API_BASE_URL}/apple/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    });
    return response.json();
  }
} 