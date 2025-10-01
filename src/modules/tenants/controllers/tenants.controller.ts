import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { AddUserToTenantDto } from '../dto/add-user-to-tenant.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ==================== Public Routes ====================

  @Public()
  @Get('invitations/validate/:token')
  @ApiOperation({ summary: 'Validate invitation token (public)' })
  @ApiResponse({ status: 200, description: 'Invitation is valid' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  getInvitationByToken(@Param('token') token: string) {
    return this.tenantsService.getInvitationByToken(token);
  }

  // ==================== Tenant CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Tenant with this slug already exists' })
  create(@Body() createTenantDto: CreateTenantDto, @CurrentUser() user: JwtPayload) {
    return this.tenantsService.create(createTenantDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants for current user' })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.tenantsService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this tenant' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tenantsService.findOne(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Tenant with this slug already exists' })
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tenantsService.update(id, updateTenantDto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Only OWNER can delete tenant' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tenantsService.remove(id, user.sub);
  }

  // ==================== Tenant User Management ====================

  @Get(':tenantId/users')
  @ApiOperation({ summary: 'Get all users in a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied to this tenant' })
  getTenantUsers(@Param('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.tenantsService.getTenantUsers(tenantId, user.sub);
  }

  @Post(':tenantId/users')
  @ApiOperation({ summary: 'Add user to tenant' })
  @ApiResponse({ status: 201, description: 'User added to tenant successfully' })
  @ApiResponse({ status: 403, description: 'Only OWNER or ADMIN can add users' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'User is already a member' })
  addUserToTenant(
    @Param('tenantId') tenantId: string,
    @Body() addUserDto: AddUserToTenantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tenantsService.addUserToTenant(tenantId, addUserDto, user.sub);
  }

  @Patch(':tenantId/users/:userId/role')
  @ApiOperation({ summary: 'Update user role in tenant' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 403, description: 'Only OWNER or ADMIN can update roles' })
  @ApiResponse({ status: 404, description: 'User not in tenant' })
  @ApiResponse({ status: 400, description: 'Cannot modify OWNER role' })
  updateUserRole(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tenantsService.updateUserRole(tenantId, userId, updateRoleDto, user.sub);
  }

  @Delete(':tenantId/users/:userId')
  @ApiOperation({ summary: 'Remove user from tenant' })
  @ApiResponse({ status: 200, description: 'User removed from tenant successfully' })
  @ApiResponse({ status: 403, description: 'Only OWNER or ADMIN can remove users' })
  @ApiResponse({ status: 404, description: 'User not in tenant' })
  @ApiResponse({ status: 400, description: 'Cannot remove OWNER' })
  removeUserFromTenant(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tenantsService.removeUserFromTenant(tenantId, userId, user.sub);
  }

  // ==================== Invitation Management ====================

  @Post(':tenantId/invitations')
  @ApiOperation({ summary: 'Create invitation to tenant' })
  @ApiResponse({ status: 201, description: 'Invitation created and sent successfully' })
  @ApiResponse({ status: 403, description: 'Only OWNER or ADMIN can invite users' })
  @ApiResponse({ status: 400, description: 'User already member or pending invitation exists' })
  createInvitation(
    @Param('tenantId') tenantId: string,
    @Body() createInvitationDto: CreateInvitationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tenantsService.createInvitation(tenantId, createInvitationDto, user.sub);
  }

  @Get(':tenantId/invitations')
  @ApiOperation({ summary: 'Get all pending invitations for tenant' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Only OWNER or ADMIN can view invitations' })
  getInvitations(@Param('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.tenantsService.getInvitations(tenantId, user.sub);
  }

  @Delete(':tenantId/invitations/:invitationId')
  @ApiOperation({ summary: 'Cancel invitation' })
  @ApiResponse({ status: 200, description: 'Invitation cancelled successfully' })
  @ApiResponse({ status: 403, description: 'Only OWNER or ADMIN can cancel invitations' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel accepted invitation' })
  cancelInvitation(
    @Param('tenantId') tenantId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tenantsService.cancelInvitation(tenantId, invitationId, user.sub);
  }
}
