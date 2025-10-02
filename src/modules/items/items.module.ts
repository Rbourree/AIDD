import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsService } from './services/items.service';
import { ItemsController } from './controllers/items.controller';
import { ItemRepository } from './repositories/item.repository';
import { Item } from './entities/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  controllers: [ItemsController],
  providers: [ItemsService, ItemRepository],
  exports: [ItemsService, ItemRepository, TypeOrmModule],
})
export class ItemsModule {}
