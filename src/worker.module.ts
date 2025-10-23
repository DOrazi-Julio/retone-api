import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import googleConfig from './auth-google/config/google.config';
import stripeConfig from './modules/stripe/config/stripe.config';
import { BullModule } from '@nestjs/bull';
import { HumanizationJobsModule } from './modules/humanization-jobs/humanization-jobs.module';
import { HumanizationJobsProcessor } from './modules/humanization-jobs/humanization-jobs.processor';
import { HUMANIZATION_JOBS_QUEUE } from './modules/humanization-jobs/queue';
import { HumanizationJobsRelationalPersistenceModule } from './modules/humanization-jobs/infrastructure/persistence/relational/relational-persistence.module';
import { FilesModule } from './files/files.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { DataSource, DataSourceOptions } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        googleConfig,
        stripeConfig,
      ],
      envFilePath: ['.env'],
    }),
    // Initialize TypeORM the same way AppModule does so repositories work in the worker
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: Number(configService.get('REDIS_PORT')),
          db: Number(configService.get('REDIS_DB') || 0),
          password: configService.get('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: HUMANIZATION_JOBS_QUEUE }),
    HumanizationJobsRelationalPersistenceModule,
    FilesModule,
    HumanizationJobsModule,
  ],
  providers: [HumanizationJobsProcessor],
})
export class WorkerModule {}
