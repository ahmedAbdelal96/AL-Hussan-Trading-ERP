import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MaintenanceStatus,
  MaintenanceType,
  MaintenancePriority,
  PaymentStatus,
} from '@prisma/client';

/**
 * Response DTO for a single project cost allocation entry
 */
export class MaintenanceProjectAllocationResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  projectId: string;

  @ApiPropertyOptional({ example: 'مشروع الطرق الدائرية' })
  projectName?: string | null;

  @ApiProperty({
    example: 50.0,
    description: 'Percentage of total cost (0-100)',
  })
  percentage: number;

  @ApiPropertyOptional({
    example: 5000.0,
    description: 'Actual allocated amount (set on COMPLETED)',
  })
  allocatedAmount?: number | null;

  @ApiPropertyOptional({
    example:
      'Project X excluded due to COMPLETED status. Percentages redistributed.',
  })
  note?: string | null;
}

export class MaintenanceAttachmentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  maintenanceId: string;

  @ApiProperty({ example: 'maintenance_photo_before.jpg' })
  fileName: string;

  @ApiProperty({ example: '/uploads/maintenance/2026/01/abc123.jpg' })
  filePath: string;

  @ApiProperty({ example: 1048576 })
  fileSize: number;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiPropertyOptional({ example: 'Before photo - engine condition' })
  description?: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  uploadedBy: string;

  @ApiProperty({ example: '2026-01-14T10:30:00Z' })
  uploadedAt: Date;
}

export class MaintenanceAssetSummaryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ example: 'جرافة هيدروليكية' })
  name: string;

  @ApiProperty({ example: 'AST-2026-0042' })
  assetNumber: string;
}

export class MaintenanceFinanceCostApproverResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174010' })
  id: string;

  @ApiProperty({ example: 'Khaled' })
  firstName: string;

  @ApiProperty({ example: 'Al-Dosari' })
  lastName: string;
}

export class MaintenanceFinanceCostResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174011' })
  id: string;

  @ApiProperty({ example: 1450.0 })
  amount: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({ example: '2026-01-20T16:00:00Z' })
  approvedAt?: Date | null;

  @ApiPropertyOptional({ example: 'Missing supplier invoice' })
  rejectedReason?: string | null;

  @ApiPropertyOptional({ type: MaintenanceFinanceCostApproverResponseDto })
  approver?: MaintenanceFinanceCostApproverResponseDto | null;
}

/**
 * Response DTO for MaintenanceRequest
 */
export class MaintenanceRequestResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'MNT-0001' })
  maintenanceNumber: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  assetId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002' })
  projectId?: string | null;

  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  maintenanceType: MaintenanceType;

  @ApiProperty({
    enum: MaintenancePriority,
    example: MaintenancePriority.MEDIUM,
  })
  priority: MaintenancePriority;

  @ApiProperty({ enum: MaintenanceStatus, example: MaintenanceStatus.PENDING })
  status: MaintenanceStatus;

  @ApiProperty({ example: 'Oil change and filter replacement' })
  title: string;

  @ApiPropertyOptional({
    example: 'Regular maintenance: change engine oil and filters',
  })
  description?: string | null;

  @ApiPropertyOptional({ example: '2026-01-20T10:00:00Z' })
  scheduledDate?: Date | null;

  @ApiPropertyOptional({ example: '2026-01-20T09:00:00Z' })
  startedAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-01-20T15:30:00Z' })
  completedAt?: Date | null;

  @ApiPropertyOptional({ example: 1500.0 })
  estimatedCost?: number | null;

  @ApiPropertyOptional({ example: 1450.0 })
  actualCost?: number | null;

  @ApiPropertyOptional({ example: 'ABC Auto Service' })
  vendor?: string | null;

  @ApiPropertyOptional({ example: '+201501234567' })
  vendorContact?: string | null;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174003' })
  assignedTo?: string | null;

  @ApiPropertyOptional({ example: 45000 })
  odometerReading?: number | null;

  @ApiPropertyOptional({
    example: 'Changed oil, replaced oil filter and air filter',
  })
  workPerformed?: string | null;

  @ApiPropertyOptional({ example: 'Oil filter, Air filter, Engine oil (5L)' })
  partsReplaced?: string | null;

  @ApiPropertyOptional({ example: 'Vehicle in good condition' })
  notes?: string | null;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174004' })
  approvedBy?: string | null;

  @ApiPropertyOptional({ example: '2026-01-19T14:00:00Z' })
  approvedAt?: Date | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174005' })
  createdBy: string;

  @ApiProperty({ example: '2026-01-14T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-14T10:30:00Z' })
  updatedAt: Date;

  @ApiProperty({
    example: 4,
    description: 'Optimistic concurrency row version',
  })
  rowVersion: number;

  @ApiPropertyOptional({
    type: [MaintenanceProjectAllocationResponseDto],
    description: 'Cost distribution across projects',
  })
  projectAllocations?: MaintenanceProjectAllocationResponseDto[];

  @ApiPropertyOptional({ type: [MaintenanceAttachmentResponseDto] })
  attachments?: MaintenanceAttachmentResponseDto[];

  @ApiPropertyOptional({ type: MaintenanceAssetSummaryResponseDto })
  asset?: MaintenanceAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ type: MaintenanceFinanceCostResponseDto })
  financeCost?: MaintenanceFinanceCostResponseDto | null;
}
