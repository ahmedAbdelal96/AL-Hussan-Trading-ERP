/**
 * Storage Module
 * Provides file storage infrastructure for the entire application
 */

import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';

@Global() // Make available everywhere without importing
@Module({
  providers: [StorageService, LocalStorageAdapter],
  exports: [StorageService],
})
export class StorageModule {}
