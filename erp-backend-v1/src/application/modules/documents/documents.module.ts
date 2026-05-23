/**
 * Documents Module
 *
 * Provides reusable document management services for all entity modules
 *
 * Architecture Design:
 * - DocumentsService: Shared business logic for document operations
 * - StorageCleanupService: Background cleanup for orphaned files
 * - DocumentsController: Admin-only endpoints for cross-entity operations
 *
 * Usage Pattern:
 * Each entity module (Employees, Assets, etc.) imports DocumentsModule
 * and implements its own endpoints (e.g., POST /employees/:id/documents)
 * using the shared DocumentsService
 *
 * Benefits:
 * - No code duplication
 * - Clean URLs per entity
 * - Self-contained modules
 * - Easy to extract and reuse in other projects
 */

import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { StorageCleanupService } from './storage-cleanup.service';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { StorageModule } from '../../../infrastructure/storage/storage.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [DatabaseModule, StorageModule, RbacModule],
  // NOTE: DocumentsController kept for admin/cross-entity operations
  // Individual entities implement their own endpoints using DocumentsService
  controllers: [DocumentsController],
  providers: [DocumentsService, StorageCleanupService],
  exports: [DocumentsService, StorageCleanupService], // Export for use in other modules
})
export class DocumentsModule {}
