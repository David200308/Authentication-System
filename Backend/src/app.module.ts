import { Module } from '@nestjs/common';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { UserController } from './controllers/user';
import { UserServices } from './services/user';
import { ConfigModule } from '@nestjs/config';
import { RedisOptions } from './redis.config.options';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.registerAsync(RedisOptions),
  ],
  controllers: [UserController],
  providers: [
    UserServices,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule { }
