export class JwtTokensDto {
  constructor({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  accessToken: string;

  refreshToken: string;
}
