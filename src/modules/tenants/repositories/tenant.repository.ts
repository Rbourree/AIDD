import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { TenantUser } from '../entities/tenant-user.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { TenantRole } from '../enums/tenant-role.enum';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantUser)
    private readonly tenantUserRepository: Repository<TenantUser>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new tenant with an owner
   */
  async create(dto: CreateTenantDto, ownerId: string): Promise<Tenant> {
    return this.dataSource.transaction(async (manager) => {
      // Create tenant
      const tenant = manager.create(Tenant, dto);
      const savedTenant = await manager.save(Tenant, tenant);

      // Create tenant-user relationship with OWNER role
      const tenantUser = manager.create(TenantUser, {
        userId: ownerId,
        tenantId: savedTenant.id,
        role: TenantRole.OWNER,
      });
      await manager.save(TenantUser, tenantUser);

      // Return tenant with relations
      return manager.findOne(Tenant, {
        where: { id: savedTenant.id },
        relations: ['tenantUsers', 'tenantUsers.user'],
      });
    });
  }

  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { id },
      relations: ['tenantUsers', 'tenantUsers.user'],
    });
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { slug },
    });
  }

  /**
   * Find all tenants for a user
   */
  async findAllByUserId(userId: string): Promise<Tenant[]> {
    const queryBuilder = this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.tenantUsers', 'tenantUser', 'tenantUser.userId = :userId', {
        userId,
      })
      .leftJoin('tenant.tenantUsers', 'allTenantUsers')
      .addSelect('COUNT(DISTINCT allTenantUsers.id)', 'memberCount')
      .where('tenantUser.userId = :userId', { userId })
      .groupBy('tenant.id')
      .addGroupBy('tenantUser.id')
      .orderBy('tenant.createdAt', 'DESC');

    const results = await queryBuilder.getRawAndEntities();

    return results.entities.map((tenant, index) => {
      const myRole = tenant.tenantUsers[0]?.role;
      const memberCount = parseInt(results.raw[index]?.memberCount || '0', 10);
      tenant.myRole = myRole;
      tenant.memberCount = memberCount;
      return tenant;
    });
  }

  /**
   * Update tenant
   */
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    await this.tenantRepository.update(id, dto);
    return this.findById(id);
  }

  /**
   * Delete tenant
   */
  async delete(id: string): Promise<void> {
    await this.tenantRepository.delete(id);
  }

  // ==================== TenantUser Methods ====================

  /**
   * Get tenant user relationship
   */
  async getTenantUser(userId: string, tenantId: string): Promise<TenantUser | null> {
    return this.tenantUserRepository.findOne({
      where: { userId, tenantId },
    });
  }

  /**
   * Get all users in a tenant
   */
  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    return this.tenantUserRepository.find({
      where: { tenantId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Add user to tenant
   */
  async addUserToTenant(
    userId: string,
    tenantId: string,
    role: TenantRole,
  ): Promise<TenantUser> {
    const tenantUser = this.tenantUserRepository.create({
      userId,
      tenantId,
      role,
    });

    await this.tenantUserRepository.save(tenantUser);

    return this.tenantUserRepository.findOne({
      where: { id: tenantUser.id },
      relations: ['user'],
    });
  }

  /**
   * Update user role in tenant
   */
  async updateUserRole(userId: string, tenantId: string, role: TenantRole): Promise<TenantUser> {
    await this.tenantUserRepository.update({ userId, tenantId }, { role });

    return this.tenantUserRepository.findOne({
      where: { userId, tenantId },
      relations: ['user'],
    });
  }

  /**
   * Remove user from tenant
   */
  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    await this.tenantUserRepository.delete({ userId, tenantId });
  }

  /**
   * Check if user exists in tenant
   */
  async userExistsInTenant(userId: string, tenantId: string): Promise<boolean> {
    const tenantUser = await this.tenantUserRepository.findOne({
      where: { userId, tenantId },
    });

    return !!tenantUser;
  }
}
