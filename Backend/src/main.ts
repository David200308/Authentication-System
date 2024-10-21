import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';
import 'dotenv/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
    .setTitle('COMP4334 Final Project Team4: Authorization System Backend API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  
  app.enableCors({
    origin: '*',
  });

  await app.listen(3001);
}
bootstrap();
