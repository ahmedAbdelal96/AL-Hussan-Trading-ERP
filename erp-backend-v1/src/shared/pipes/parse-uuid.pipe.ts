/**
 * Parse UUID Pipe
 * Validates and transforms UUID parameters
 */

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  constructor(private readonly field: string = 'id') {}

  transform(value: string): string {
    if (!value) {
      throw new BadRequestException(`${this.field} is required`);
    }

    if (!isUUID(value)) {
      throw new BadRequestException(`${this.field} must be a valid UUID`);
    }

    return value;
  }
}
