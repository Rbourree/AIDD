import { Module } from '@nestjs/common';
import { ItemsService } from './services/items.service';
import { ItemsController } from './controllers/items.controller';
import { ItemRepository } from './repositories/item.repository';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService, ItemRepository],
  exports: [ItemsService, ItemRepository],
})
export class ItemsModule {}
