import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('device-tokens')
  register(@CurrentUser() user: RequestUser, @Body() dto: RegisterDeviceTokenDto) {
    return this.notificationService.registerDeviceToken(user.id, dto.token, dto.platform);
  }

  @Delete('device-tokens/:token')
  unregister(@Param('token') token: string) {
    return this.notificationService.unregisterDeviceToken(token);
  }
}
