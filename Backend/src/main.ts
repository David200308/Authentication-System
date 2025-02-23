import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { checkEnv } from './utils/env';
import * as basicAuth from 'express-basic-auth';
import 'dotenv/config';
import { checkDBConnection } from './database/database';
import "./instrument";
import { accessLogMiddleware } from './utils/accessLogMiddleware';
import { readFileSync } from 'fs';


async function bootstrap() {
  checkEnv();
  checkDBConnection();

  const app = await NestFactory.create(AppModule);
  const [docsUser, docsPass] = [
    readFileSync(process.env.DOCS_USER_FILE, 'utf8').trim(), 
    readFileSync(process.env.DOCS_PASSWORD_FILE, 'utf8').trim()
  ];

  app.use(accessLogMiddleware);
  
  app.use(
    ['/docs'],
    basicAuth({
      challenge: true,
      users: { 
        // [process.env.DOCS_USER]: process.env.DOCS_PASSWORD
        [docsUser]: docsPass
      },
    }),
  );

  app.use(cookieParser());
  const config = new DocumentBuilder()
    .setTitle('Authentication System Backend API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  
  // testing cors
  // app.enableCors({
  //   origin: '*',
  // });

  // production cors
  app.enableCors({
    origin: process.env.PASSKEY_ORIGIN,
  });

  await app.listen(3000);
}
bootstrap();
