import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  const port = process.env.PORT ? Number(process.env.PORT) : 9502;
  await app.listen(port);
  console.log(`API (BFF) escuchando en http://localhost:${port}`);
}
bootstrap();
