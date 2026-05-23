/**
 * Prisma Service
 * Handles database connection with connection pooling, query logging, and error handling
 *
 * Features:
 * - Automatic connection management
 * - Slow query detection and logging
 * - Transaction support with automatic retry on deadlock
 * - Connection pool monitoring
 * - Graceful shutdown handling
 */

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly slowQueryThreshold: number;

  constructor(private configService: ConfigService) {
    // Create connection pool for Prisma 7
    const connectionString = configService.get<string>('database.url');
    const pool = new Pool({
      connectionString,
      min: configService.get('database.pool.min', 2),
      max: configService.get('database.pool.max', 10),
      idleTimeoutMillis: configService.get(
        'database.pool.idleTimeoutMillis',
        30000,
      ),
      connectionTimeoutMillis: configService.get(
        'database.pool.connectionTimeoutMillis',
        5000,
      ),
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'warn',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
      ],
      errorFormat: 'pretty',
    });

    this.slowQueryThreshold = configService.get(
      'database.logging.slowQueryThreshold',
      100,
    );
  }

  /**
   * Initialize database connection and setup middleware
   */
  async onModuleInit() {
    try {
      // Connect to database
      await this.$connect();
      this.logger.log('✅ Database connected successfully');

      // Setup query logging for development
      if (this.configService.get('app.isDevelopment')) {
        this.setupQueryLogging();
      }

      // Setup slow query detection for all environments
      this.setupSlowQueryDetection();

      // Log database info
      await this.logDatabaseInfo();
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error);
      throw new InternalServerErrorException('Database connection failed');
    }
  }

  /**
   * Gracefully disconnect from database on shutdown
   */
  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected gracefully');
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
    }
  }

  /**
   * Setup query logging for development environment
   * Only logs queries when there's an error or when explicitly needed
   */
  private setupQueryLogging() {
    // Query logging disabled by default - only show slow queries
    // Uncomment below to enable full query logging for debugging:
    // this.$on('query' as never, (e: Prisma.QueryEvent) => {
    //   this.logger.debug(`Query: ${e.query}`);
    //   this.logger.debug(`Params: ${e.params}`);
    //   this.logger.debug(`Duration: ${e.duration}ms`);
    // });
  }

  /**
   * Setup slow query detection and logging
   */
  private setupSlowQueryDetection() {
    this.$on('query' as never, (e: Prisma.QueryEvent) => {
      if (e.duration > this.slowQueryThreshold) {
        this.logger.warn({
          message: '🐌 Slow query detected',
          query: e.query,
          params: '[REDACTED]',
          duration: `${e.duration}ms`,
          threshold: `${this.slowQueryThreshold}ms`,
        });
      }
    });
  }

  /**
   * Log database connection information
   */
  private async logDatabaseInfo() {
    try {
      const result = await this.$queryRaw<
        Array<{ version: string }>
      >`SELECT version()`;
      this.logger.log(
        `Database version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`,
      );
    } catch {
      this.logger.warn('Could not retrieve database version');
    }
  }

  /**
   * Execute transaction with automatic retry on deadlock
   *
   * @param fn - Transaction function to execute
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Transaction result
   *
   * @example
   * ```typescript
   * const result = await prisma.executeTransaction(async (tx) => {
   *   const user = await tx.user.create({ data: userData });
   *   const profile = await tx.profile.create({ data: profileData });
   *   return { user, profile };
   * });
   * ```
   */
  async executeTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(fn, {
          maxWait: 5000, // Max wait time to acquire a connection
          timeout: 10000, // Max transaction execution time
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        });
      } catch (error: any) {
        lastError = error;

        // Check if error is a deadlock or serialization failure
        const isRetryable =
          error.code === 'P2034' || // Deadlock detected
          error.message?.includes('deadlock') ||
          error.message?.includes('serialization failure');

        if (isRetryable && attempt < maxRetries) {
          const delay = 100 * attempt; // Exponential backoff
          this.logger.warn(
            `Deadlock detected, retrying transaction (${attempt}/${maxRetries}) after ${delay}ms`,
          );
          await this.sleep(delay);
          continue;
        }

        // If not retryable or max retries reached, throw error
        throw error;
      }
    }

    throw lastError!;
  }

  /**
   * Clean database for testing purposes only
   * WARNING: This will delete all data!
   */
  async cleanDatabase() {
    if (this.configService.get('app.isProduction')) {
      throw new Error('Cannot clean database in production environment');
    }

    this.logger.warn('🧹 Cleaning database...');

    // Get all model names
    const modelNames = Prisma.dmmf.datamodel.models.map((model) => model.name);

    // Delete all records from all tables (in reverse order to avoid FK constraints)
    for (const modelName of modelNames.reverse()) {
      const model = this[
        (modelName.charAt(0).toLowerCase() + modelName.slice(1)) as keyof this
      ] as any;

      if (model && typeof model.deleteMany === 'function') {
        try {
          await model.deleteMany({});
          this.logger.debug(`Cleaned ${modelName} table`);
        } catch (error) {
          this.logger.warn(`Could not clean ${modelName}: ${error.message}`);
        }
      }
    }

    this.logger.warn('✅ Database cleaned');
  }

  /**
   * Check database connection health
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message?: string;
  }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return { status: 'healthy' };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: error.message,
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const stats = await this.$queryRaw<
        Array<{
          table_name: string;
          row_count: number;
        }>
      >`
        SELECT
          schemaname || '.' || tablename as table_name,
          n_live_tup as row_count
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 20
      `;

      return stats;
    } catch (error) {
      this.logger.error('Error fetching database stats:', error);
      return [];
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
