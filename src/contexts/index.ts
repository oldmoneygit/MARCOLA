/**
 * @file index.ts
 * @description Barrel export para contextos
 * @module contexts
 */

export { AuthProvider, useAuth } from './AuthContext';
export type {
  AuthContextType,
  AuthState,
  SignInCredentials,
  SignUpCredentials,
} from './AuthContext';
