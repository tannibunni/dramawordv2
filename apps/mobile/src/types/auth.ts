export interface UserInfo {
  id: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginData {
  type: 'phone' | 'wechat' | 'apple' | 'guest';
  userInfo: UserInfo;
  token?: string;
  refreshToken?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginRequest {
  phone?: string;
  verificationCode?: string;
  wechatCode?: string;
  appleToken?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: LoginData;
  error?: string;
  message?: string;
}

export interface SendVerificationCodeRequest {
  phone: string;
}

export interface SendVerificationCodeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    user: UserInfo;
  };
  error?: string;
} 