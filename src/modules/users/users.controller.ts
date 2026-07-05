import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('users')
@UseGuards(PlatformRolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(PlatformRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Roles(PlatformRole.SUPER_ADMIN)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
    });
  }

  @Roles(PlatformRole.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Roles(PlatformRole.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /** Any authenticated user may switch their own Bangla/English preference. */
  @Patch('me/language')
  updateOwnLanguage(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this.usersService.updateLanguage(user.id, dto.preferredLanguage);
  }
}
