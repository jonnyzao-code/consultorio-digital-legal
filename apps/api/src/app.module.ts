import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NormativeController } from './normative.controller';
import { NormativeService } from './normative.service';

@Module({
  controllers: [AppController, NormativeController],
  providers: [AppService, NormativeService],
})
export class AppModule {}
