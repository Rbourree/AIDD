import { Module } from '@nestjs/common';
import { YousignService } from './yousign.service';

@Module({
  providers: [YousignService],
  exports: [YousignService],
})
export class YousignModule {}
