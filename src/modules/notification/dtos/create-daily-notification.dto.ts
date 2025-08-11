import { IsNumber, IsString, Matches, Max, Min } from 'class-validator';

export class CreateDailyNotification {
  @IsString()
  @Matches('^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$')
  time: string;

  @IsNumber()
  @Min(-840)
  @Max(720)
  timezoneOffset: number;
}
