import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Language, PlatformRole, Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  generateDefaultPassword,
  hashPassword,
} from '../../common/utils/password.util';
import { SafeUser } from '../auth/auth.service';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      mobileNumber: user.mobileNumber,
      name: user.name,
      platformRole: user.platformRole,
      preferredLanguage: user.preferredLanguage,
      mustChangePassword: user.mustChangePassword,
    };
  }

  /**
   * Shared account-creation path. Used directly by the Admin-only `POST
   * /users` endpoint today, and will be reused as-is by the Investment
   * module later for auto-creating investor logins (same
   * default-password + forced-change behaviour, just called internally
   * with `platformRole: 'USER'` instead of via this HTTP endpoint).
   */
  async createUser(input: {
    name: string;
    mobileNumber: string;
    platformRole?: PlatformRole;
    password?: string;
  }): Promise<{ user: SafeUser; generatedPassword: string | null }> {
    const existing = await this.prisma.user.findUnique({
      where: { mobileNumber: input.mobileNumber },
    });
    if (existing) {
      throw new ConflictException(this.i18n.t('auth.mobile_number_taken'));
    }

    const generatedPassword = input.password ? null : generateDefaultPassword();
    const passwordToHash = input.password ?? generatedPassword!;

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        mobileNumber: input.mobileNumber,
        platformRole: input.platformRole ?? PlatformRole.USER,
        passwordHash: await hashPassword(passwordToHash),
        mustChangePassword: true,
      },
    });

    return { user: this.toSafeUser(user), generatedPassword };
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResult<SafeUser>> {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 100);

    const where: Prisma.UserWhereInput = params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { mobileNumber: { contains: params.search } },
          ],
        }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: rows.map((u) => this.toSafeUser(u)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    };
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(this.i18n.t('common.errors.not_found'));
    return this.toSafeUser(user);
  }

  async update(
    id: string,
    input: { name?: string; platformRole?: PlatformRole; isActive?: boolean },
  ): Promise<SafeUser> {
    const user = await this.prisma.user
      .update({ where: { id }, data: input })
      .catch(() => null);
    if (!user) throw new NotFoundException(this.i18n.t('common.errors.not_found'));
    return this.toSafeUser(user);
  }

  async updateLanguage(id: string, preferredLanguage: Language): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { preferredLanguage },
    });
    return this.toSafeUser(user);
  }
}
