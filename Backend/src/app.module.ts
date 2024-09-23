import { Module } from '@nestjs/common';
import { UserController } from './controllers/user';
import { UserServices } from './services/user';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  })],
  controllers: [UserController],
  providers: [UserServices],
})
export class AppModule {}
