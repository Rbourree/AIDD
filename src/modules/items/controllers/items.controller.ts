import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ItemsService } from '../services/items.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/interfaces/jwt-payload.interface';

@ApiTags('items')
@ApiBearerAuth()
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, description: 'Item created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to tenant' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  create(@Body() createItemDto: CreateItemDto, @CurrentUser() user: JwtPayload) {
    return this.itemsService.create(createItemDto, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items (paginated, filtered by user tenant)' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto, @CurrentUser() user: JwtPayload) {
    return this.itemsService.findAll(paginationDto, user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this item' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.itemsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an item' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this item' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itemsService.update(id, updateItemDto, user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this item' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.itemsService.remove(id, user.tenantId);
  }
}
