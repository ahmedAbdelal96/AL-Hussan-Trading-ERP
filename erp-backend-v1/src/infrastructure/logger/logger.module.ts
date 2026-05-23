/**
 * Logger Module
 * Global module that provides Winston logger service to the entire application
 */

import { Global, Module } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service';

@Global()
@Module({
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class LoggerModule {}
