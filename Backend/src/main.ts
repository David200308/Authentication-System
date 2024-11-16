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


async function bootstrap() {
  checkEnv();
  checkDBConnection();

  const app = await NestFactory.create(AppModule);

  app.use(accessLogMiddleware);
  
  app.use(
    ['/docs'],
    basicAuth({
      challenge: true,
      users: { 
        [process.env.DOCS_USER]: process.env.DOCS_PASSWORD
      },
    }),
  );

  app.use(cookieParser());
  const config = new DocumentBuilder()
    .setTitle('COMP4334 Final Project Team4: Authentication System Backend API')
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

  await app.listen(3001);
}
bootstrap();
