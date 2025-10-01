import { Module } from '@nestjs/common';
import { Ar24Service } from './ar24.service';

@Module({
  providers: [Ar24Service],
  exports: [Ar24Service],
})
export class Ar24Module {}
