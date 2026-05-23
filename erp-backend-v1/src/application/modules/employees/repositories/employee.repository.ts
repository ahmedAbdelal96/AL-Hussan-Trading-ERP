import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { IEmployeeRepository } from './employee.repository.interface';
import { EmployeeEntity } from '../entities/employee.entity';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeFiltersDto,
} from '../dto';

@Injectable()
export class EmployeeRepository implements IEmployeeRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateEmployeeDto,
    employeeNumber: string,
    createdBy: string,
  ): Promise<EmployeeEntity> {
    const employee = await this.prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        nationalId: data.nationalId,
        employeeNumber,
        email: data.email || null,
        phone: data.phone,
        alternatePhone: data.alternatePhone || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender ? data.gender : null,
        nationality: data.nationality || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || 'المملكه العربيه السعوديه',
        employmentType: data.employmentType as any,
        status: data.status || 'ACTIVE',
        departmentId: data.departmentId || null,
        positionId: data.positionId || null,
        hireDate: new Date(data.hireDate),
        baseSalary: data.baseSalary,
        currency: data.currency || 'SAR',
        terminationDate: data.terminationDate
          ? new Date(data.terminationDate)
          : null,
        terminationReason: data.terminationReason || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        emergencyContactRelation: data.emergencyContactRelation || null,
        notes: data.notes || null,
        createdBy,
        // Create employment contract
        contracts: data.employmentContract
          ? {
              create: {
                contractType: data.employmentContract.contractType,
                startDate: new Date(data.employmentContract.startDate),
                endDate: data.employmentContract.endDate
                  ? new Date(data.employmentContract.endDate)
                  : null,
                isRenewable: data.employmentContract.isRenewable ?? false,
                positionId: data.employmentContract.positionId || null,
                departmentId: data.employmentContract.departmentId || null,
                baseSalary: data.employmentContract.baseSalary,
                contractTerms: data.employmentContract.contractTerms || null,
                filePath: null, // Will be updated separately if contract file is uploaded
                isActive: true,
              },
            }
          : undefined,
        // Create employee documents
        documents:
          data.documents && data.documents.length > 0
            ? {
                create: data.documents.map((doc) => ({
                  documentType: doc.documentType,
                  documentName: doc.documentName,
                  filePath: doc.filePath || '', // Required in schema, should be set by file upload handler
                  fileSize: doc.fileSize || 0,
                  mimeType: doc.mimeType || 'application/octet-stream',
                  issueDate: doc.issueDate ? new Date(doc.issueDate) : null,
                  expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : null,
                  notes: doc.notes || null,
                  uploadedBy: createdBy,
                })),
              }
            : undefined,
      },
      include: {
        contracts: true,
        documents: true,
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });

    return new EmployeeEntity(employee);
  }

  async findAll(
    filters: EmployeeFiltersDto,
  ): Promise<{ employees: EmployeeEntity[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      search,
      employmentType,
      status,
      departmentId,
      positionId,
      nationality,
      country,
    } = filters;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { middleName: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (employmentType) where.employmentType = employmentType;
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (positionId) where.positionId = positionId;
    if (nationality)
      where.nationality = { contains: nationality, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { nameAr: true, nameEn: true } },
          position: { select: { nameAr: true, nameEn: true } },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      employees: employees.map((emp) => new EmployeeEntity(emp)),
      total,
    };
  }

  async findById(id: string): Promise<EmployeeEntity | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });

    return employee ? new EmployeeEntity(employee) : null;
  }

  async findByEmployeeNumber(
    employeeNumber: string,
  ): Promise<EmployeeEntity | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { employeeNumber, deletedAt: null },
      include: {
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });

    return employee ? new EmployeeEntity(employee) : null;
  }

  async findByNationalId(nationalId: string): Promise<EmployeeEntity | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { nationalId, deletedAt: null },
      include: {
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });

    return employee ? new EmployeeEntity(employee) : null;
  }

  async findByEmail(email: string): Promise<EmployeeEntity | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { email, deletedAt: null },
      include: {
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });

    return employee ? new EmployeeEntity(employee) : null;
  }

  async update(
    id: string,
    data: UpdateEmployeeDto,
    updatedBy: string,
  ): Promise<EmployeeEntity> {
    const lockVersion =
      typeof data.rowVersion === 'number'
        ? data.rowVersion
        : typeof data.version === 'number'
          ? data.version
          : undefined;

    const updateData: any = {
      updatedBy,
    };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.middleName !== undefined)
      updateData.middleName = data.middleName || null;
    if (data.nationalId !== undefined) updateData.nationalId = data.nationalId;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.alternatePhone !== undefined)
      updateData.alternatePhone = data.alternatePhone || null;
    if (data.dateOfBirth !== undefined)
      updateData.dateOfBirth = data.dateOfBirth
        ? new Date(data.dateOfBirth)
        : null;
    if (data.gender !== undefined) updateData.gender = data.gender || null;
    if (data.nationality !== undefined)
      updateData.nationality = data.nationality || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.city !== undefined) updateData.city = data.city || null;
    if (data.state !== undefined) updateData.state = data.state || null;
    if (data.postalCode !== undefined)
      updateData.postalCode = data.postalCode || null;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.employmentType !== undefined)
      updateData.employmentType = data.employmentType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.departmentId !== undefined)
      updateData.departmentId = data.departmentId || null;
    if (data.positionId !== undefined)
      updateData.positionId = data.positionId || null;
    if (data.hireDate !== undefined)
      updateData.hireDate = new Date(data.hireDate);
    if (data.baseSalary !== undefined) updateData.baseSalary = data.baseSalary;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.terminationDate !== undefined)
      updateData.terminationDate = data.terminationDate
        ? new Date(data.terminationDate)
        : null;
    if (data.terminationReason !== undefined)
      updateData.terminationReason = data.terminationReason || null;
    if (data.emergencyContactName !== undefined)
      updateData.emergencyContactName = data.emergencyContactName || null;
    if (data.emergencyContactPhone !== undefined)
      updateData.emergencyContactPhone = data.emergencyContactPhone || null;
    if (data.emergencyContactRelation !== undefined)
      updateData.emergencyContactRelation =
        data.emergencyContactRelation || null;
    if (data.profilePicture !== undefined)
      updateData.profilePicture = data.profilePicture;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    updateData.version = { increment: 1 };

    if (typeof lockVersion === 'number') {
      const result = await this.prisma.employee.updateMany({
        where: {
          id,
          version: lockVersion,
          deletedAt: null,
        },
        data: updateData,
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Employee data was modified by another user. Please refresh and try again.',
        );
      }
    } else {
      await this.prisma.employee.update({
        where: { id },
        data: updateData,
      });
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });

    if (!employee) {
      throw new ConflictException(
        'Employee data could not be loaded after update.',
      );
    }

    return new EmployeeEntity(employee);
  }

  async delete(
    id: string,
    deletedBy: string,
    rowVersion?: number,
  ): Promise<void> {
    const lockVersion = typeof rowVersion === 'number' ? rowVersion : undefined;

    if (typeof lockVersion === 'number') {
      const result = await this.prisma.employee.updateMany({
        where: {
          id,
          version: lockVersion,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          deletedBy,
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Employee data was modified by another user. Please refresh and try again.',
        );
      }
      return;
    }

    await this.prisma.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        version: { increment: 1 },
      },
    });
  }

  async existsByNationalId(
    nationalId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = { nationalId, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };

    const count = await this.prisma.employee.count({ where });
    return count > 0;
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const where: any = { email, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };

    const count = await this.prisma.employee.count({ where });
    return count > 0;
  }

  async existsByEmployeeNumber(employeeNumber: string): Promise<boolean> {
    const count = await this.prisma.employee.count({
      where: { employeeNumber, deletedAt: null },
    });
    return count > 0;
  }

  async getLastEmployeeNumber(year: number): Promise<string | null> {
    // If year is 0, get the absolute last employee number (fastest query)
    if (year === 0) {
      const employee = await this.prisma.employee.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { employeeNumber: true },
      });
      return employee?.employeeNumber || null;
    }

    // Otherwise filter by year prefix
    const employee = await this.prisma.employee.findFirst({
      where: {
        employeeNumber: { startsWith: `EMP-${year}-` },
      },
      orderBy: { employeeNumber: 'desc' },
      select: { employeeNumber: true },
    });

    return employee?.employeeNumber || null;
  }

  async bulkCreate(
    employees: Array<{ data: CreateEmployeeDto; employeeNumber: string }>,
    createdBy: string,
  ): Promise<EmployeeEntity[]> {
    const createData = employees.map(({ data, employeeNumber }) => ({
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName || null,
      nationalId: data.nationalId,
      employeeNumber,
      email: data.email || null,
      phone: data.phone,
      alternatePhone: data.alternatePhone || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender ? data.gender : null,
      nationality: data.nationality || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || 'المملكه العربيه السعوديه',
      employmentType: data.employmentType as any,
      status: (data.status as any) || 'ACTIVE',
      departmentId: data.departmentId || null,
      positionId: data.positionId || null,
      hireDate: new Date(data.hireDate),
      terminationDate: data.terminationDate
        ? new Date(data.terminationDate)
        : null,
      terminationReason: data.terminationReason || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      emergencyContactRelation: data.emergencyContactRelation || null,
      notes: data.notes || null,
      createdBy,
    }));

    await this.prisma.employee.createMany({
      data: createData,
    });

    // Fetch all created employees
    const employeeNumbers = employees.map((e) => e.employeeNumber);
    const createdEmployees = await this.prisma.employee.findMany({
      where: { employeeNumber: { in: employeeNumbers } },
      include: {
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });

    return createdEmployees.map((emp) => new EmployeeEntity(emp));
  }
}
