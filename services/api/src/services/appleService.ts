import appleSigninAuth from 'apple-signin-auth';
import { appleConfig } from '../config/apple';

export class AppleService {
  static async verifyIdToken(idToken: string) {
    return appleSigninAuth.verifyIdToken(idToken, {
      audience: appleConfig.clientId,
      ignoreExpiration: false,
    });
  }
} 