/**
 * Update Payslip Payment Status Use Case
 * Business logic for marking payslips as paid/unpaid
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PAYSLIP_REPOSITORY, type IPayslipRepository } from '../repositories';
import { UpdatePayslipPaymentDto, PayslipResponseDto } from '../dto';

@Injectable()
export class UpdatePayslipPaymentUseCase {
  constructor(
    @Inject(PAYSLIP_REPOSITORY)
    private readonly payslipRepository: IPayslipRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(UpdatePayslipPaymentUseCase.name);
  }

  async execute(
    id: string,
    dto: UpdatePayslipPaymentDto,
    userId: string,
  ): Promise<PayslipResponseDto> {
    this.logger.log(`Updating payment status for payslip: ${id}`);

    try {
      // Check if payslip exists
      const existingPayslip = await this.payslipRepository.findById(id);
      if (!existingPayslip) {
        throw new NotFoundException(`Payslip with ID ${id} not found`);
      }

      // Update payment status
      const updatedPayslip = await this.payslipRepository.updatePaymentStatus(
        id,
        dto,
        userId,
      );

      this.logger.log(
        `Payslip payment status updated: ${id} - Paid: ${dto.isPaid}`,
      );

      return updatedPayslip;
    } catch (error) {
      this.logger.error(
        `Failed to update payslip payment status: ${error.message}`,
      );
      throw error;
    }
  }
}
