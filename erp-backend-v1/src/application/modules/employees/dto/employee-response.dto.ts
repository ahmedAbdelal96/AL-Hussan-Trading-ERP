export class EmploymentContractResponseDto {
  id: string;
  contractType: string;
  startDate: Date;
  endDate: Date | null;
  isRenewable: boolean;
  positionId: string | null;
  departmentId: string | null;
  baseSalary: number;
  contractTerms: string | null;
  filePath: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeDocumentResponseDto {
  id: string;
  documentType: string;
  documentName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  notes: string | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  fullName: string;
  nationalId: string;
  employeeNumber: string;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  employmentType: string;
  status: string;
  departmentId: string | null;
  departmentName: string | null;
  positionId: string | null;
  positionName: string | null;
  hireDate: Date;
  terminationDate: Date | null;
  terminationReason: string | null;
  rehireDate: Date | null;
  rehireReason: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  profilePicture: string | null;
  notes: string | null;
  contracts?: EmploymentContractResponseDto[];
  documents?: EmployeeDocumentResponseDto[];
  // Salary fields
  baseSalary: number | null;
  currency: string | null;
  lastSalaryUpdate: Date | null;
  lastSalaryUpdateBy: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
