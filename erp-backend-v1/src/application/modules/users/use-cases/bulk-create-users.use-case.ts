import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { BulkCreateUsersDto } from '../dto';
import { CreateUserUseCase } from './create-user.use-case';

@Injectable()
export class BulkCreateUsersUseCase {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private readonly i18n: I18nService,
  ) {}

  async execute(data: BulkCreateUsersDto, createdBy: string) {
    const results = { success: [] as any[], failed: [] as any[] };
    for (const userData of data.users) {
      try {
        const user = await this.createUserUseCase.execute(userData, createdBy);
        results.success.push({ email: userData.email, user });
      } catch (error: any) {
        results.failed.push({ email: userData.email, error: error.message });
      }
    }
    return results;
  }
}
