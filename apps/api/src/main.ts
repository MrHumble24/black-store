import { NestFactory } from '@nestjs/core';
import dotenv from 'dotenv';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // This serves the UI at /api and the JSON at /api-json
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
