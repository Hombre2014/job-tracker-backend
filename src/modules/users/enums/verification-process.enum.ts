export enum VerificationProcess {
  USER_SIGNUP = 'USER_SIGNUP',
  USER_EMAIL_RESET = 'USER_EMAIL_RESET',
  USER_DELETE = 'USER_DELETE',
  USER_RESET_PASSWORD = 'USER_RESET_PASSWORD',
}

export type VerificationProcessType = `${VerificationProcess}`;
