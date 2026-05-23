import { EmployeeEntity } from '../entities/employee.entity';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeFiltersDto,
} from '../dto';

export const EMPLOYEE_REPOSITORY = 'EMPLOYEE_REPOSITORY';

export interface IEmployeeRepository {
  create(
    data: CreateEmployeeDto,
    employeeNumber: string,
    createdBy: string,
  ): Promise<EmployeeEntity>;
  findAll(
    filters: EmployeeFiltersDto,
  ): Promise<{ employees: EmployeeEntity[]; total: number }>;
  findById(id: string): Promise<EmployeeEntity | null>;
  findByEmployeeNumber(employeeNumber: string): Promise<EmployeeEntity | null>;
  findByNationalId(nationalId: string): Promise<EmployeeEntity | null>;
  findByEmail(email: string): Promise<EmployeeEntity | null>;
  update(
    id: string,
    data: UpdateEmployeeDto,
    updatedBy: string,
  ): Promise<EmployeeEntity>;
  delete(id: string, deletedBy: string, rowVersion?: number): Promise<void>;
  existsByNationalId(nationalId: string, excludeId?: string): Promise<boolean>;
  existsByEmail(email: string, excludeId?: string): Promise<boolean>;
  existsByEmployeeNumber(employeeNumber: string): Promise<boolean>;
  getLastEmployeeNumber(year: number): Promise<string | null>;
  bulkCreate(
    employees: Array<{ data: CreateEmployeeDto; employeeNumber: string }>,
    createdBy: string,
  ): Promise<EmployeeEntity[]>;
}
