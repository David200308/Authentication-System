import { Module } from '@nestjs/common';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { UserController } from './controllers/user';
import { UserServices } from './services/user';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: '.env',
    }),
    CacheModule.register({
      isGlobal: true,
      store: redisStore as unknown as CacheStore,
      url: process.env.REDIS_URL,
    }),
  ],
  controllers: [UserController],
  providers: [
    UserServices,
  ],
})
export class AppModule {}
