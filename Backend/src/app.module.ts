import { Module } from '@nestjs/common';
import { UserController } from './controllers/user';
import { UserServices } from './services/user';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    })],
  controllers: [UserController],
  providers: [UserServices],
})
export class AppModule { }
