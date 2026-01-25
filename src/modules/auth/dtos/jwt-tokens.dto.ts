export class JwtTokensDto {
  constructor({
    accessToken,
    refreshToken,
    passwordStrength,
  }: {
    accessToken: string;
    refreshToken: string;
    passwordStrength?: 'strong' | 'weak';
  }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.passwordStrength = passwordStrength;
  }

  accessToken: string;

  refreshToken: string;

  passwordStrength?: 'strong' | 'weak';
}
