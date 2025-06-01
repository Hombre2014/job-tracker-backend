import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getOkMessage() {
    return 'All is good!';
  }
}
