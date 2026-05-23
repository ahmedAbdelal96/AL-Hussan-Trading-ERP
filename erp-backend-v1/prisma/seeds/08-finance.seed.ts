/**
 * Finance Seed Data
 * Creates cost categories and project costs
 */

import { PrismaClient, CostType, PaymentStatus } from '@prisma/client';

export async function seedFinance(
  prisma: PrismaClient,
  projects: any[],
  createdBy: string,
) {
  console.log('💰 Seeding Finance Data...');

  // ============= Create Cost Categories =============
  console.log('📋 Creating Cost Categories...');

  const costCategories = [
    {
      name: 'مواد البناء',
      description: 'مواد ومستلزمات البناء والتشييد',
      isActive: true,
    },
    {
      name: 'الأيدي العاملة',
      description: 'تكاليف الأيدي العاملة المباشرة',
      isActive: true,
    },
    {
      name: 'استئجار المعدات',
      description: 'استئجار وتأجير المعدات الثقيلة',
      isActive: true,
    },
    {
      name: 'المقاولون الفرعيون',
      description: 'مدفوعات المقاولين الفرعيين',
      isActive: true,
    },
    {
      name: 'الوقود والنقل',
      description: 'مصروفات الوقود والنقل',
      isActive: true,
    },
    {
      name: 'الصيانة',
      description: 'صيانة المعدات والمنشآت',
      isActive: true,
    },
    {
      name: 'المرافق العامة',
      description: 'الكهرباء والمياه وسائر المرافق',
      isActive: true,
    },
    {
      name: 'التأمين',
      description: 'أقساط التأمين',
      isActive: true,
    },
    {
      name: 'الرسوم المهنية',
      description: 'الاستشارات والخدمات المهنية',
      isActive: true,
    },
  ];

  const createdCategories: any[] = [];
  for (const categoryData of costCategories) {
    const category = await prisma.costCategory.upsert({
      where: { name: categoryData.name },
      update: {},
      create: categoryData,
    });
    createdCategories.push(category);
  }

  console.log(`✅ ${createdCategories.length} Cost Categories created`);

  // ============= Create Project Costs =============
  console.log('💵 Creating Project Costs...');

  const projectCosts = [
    // Project 1: Twin Towers - Riyadh
    {
      projectId: projects[0].id,
      categoryId: createdCategories[0].id,
      costType: CostType.MATERIAL,
      amount: 15000000,
      transactionDate: new Date('2025-11-15'),
      description: 'حديد التسليح والخرسانة',
      invoiceNumber: 'INV-2025-1001',
      paymentStatus: PaymentStatus.PAID,
      paidDate: new Date('2025-12-10'),
      approvedBy: createdBy,
      approvedAt: new Date('2025-11-18'),
    },
    {
      projectId: projects[0].id,
      categoryId: createdCategories[1].id,
      costType: CostType.SALARY,
      amount: 2500000,
      transactionDate: new Date('2025-12-01'),
      description: 'تكاليف الأيدي العاملة الشهرية - ديسمبر',
      invoiceNumber: 'PAY-2025-12',
      paymentStatus: PaymentStatus.PAID,
      paidDate: new Date('2025-12-28'),
      approvedBy: createdBy,
      approvedAt: new Date('2025-12-20'),
    },
    {
      projectId: projects[0].id,
      categoryId: createdCategories[3].id,
      costType: CostType.SUBCONTRACTOR,
      amount: 8500000,
      transactionDate: new Date('2026-01-05'),
      description: 'أعمال تركيب الميكانيك والكهرباء والسباكة',
      invoiceNumber: 'INV-2026-0045',
      paymentStatus: PaymentStatus.APPROVED,
      approvedBy: createdBy,
      approvedAt: new Date('2026-01-08'),
    },
    // Project 2: Waterfront Villas - Jeddah
    {
      projectId: projects[1].id,
      categoryId: createdCategories[0].id,
      costType: CostType.MATERIAL,
      amount: 8200000,
      transactionDate: new Date('2025-12-10'),
      description: 'التشطيبات الفاخرة والتركيبات',
      invoiceNumber: 'INV-2025-0789',
      paymentStatus: PaymentStatus.PENDING,
    },
    {
      projectId: projects[1].id,
      categoryId: createdCategories[4].id,
      costType: CostType.FUEL,
      amount: 450000,
      transactionDate: new Date('2025-12-31'),
      description: 'الديزل والنقل - الربع الرابع 2025',
      invoiceNumber: 'FUEL-2025-Q4',
      paymentStatus: PaymentStatus.PAID,
      paidDate: new Date('2026-01-12'),
      approvedBy: createdBy,
      approvedAt: new Date('2026-01-05'),
    },
    // Project 3: Industrial Warehouse - Dammam
    {
      projectId: projects[2].id,
      categoryId: createdCategories[0].id,
      costType: CostType.MATERIAL,
      amount: 6500000,
      transactionDate: new Date('2025-11-20'),
      description: 'معدات التخزين المبرد',
      invoiceNumber: 'INV-2025-0456',
      paymentStatus: PaymentStatus.PAID,
      paidDate: new Date('2025-12-15'),
      approvedBy: createdBy,
      approvedAt: new Date('2025-11-25'),
    },
    {
      projectId: projects[2].id,
      categoryId: createdCategories[2].id,
      costType: CostType.EQUIPMENT_RENTAL,
      amount: 380000,
      transactionDate: new Date('2025-12-01'),
      description: 'استئجار المعدات الثقيلة - ديسمبر',
      invoiceNumber: 'RENT-2025-12',
      paymentStatus: PaymentStatus.PAID,
      paidDate: new Date('2025-12-29'),
      approvedBy: createdBy,
      approvedAt: new Date('2025-12-15'),
    },
    // Project 5: University Building - Madinah
    {
      projectId: projects[4].id,
      categoryId: createdCategories[0].id,
      costType: CostType.MATERIAL,
      amount: 4200000,
      transactionDate: new Date('2025-12-05'),
      description: 'مواد الأساسات والهيكل الإنشائي',
      invoiceNumber: 'INV-2025-0234',
      paymentStatus: PaymentStatus.APPROVED,
      approvedBy: createdBy,
      approvedAt: new Date('2025-12-10'),
    },
    {
      projectId: projects[4].id,
      categoryId: createdCategories[6].id,
      costType: CostType.UTILITY,
      amount: 125000,
      transactionDate: new Date('2025-12-31'),
      description: 'مرافق الموقع - نوفمبر وديسمبر',
      invoiceNumber: 'UTIL-2025-11-12',
      paymentStatus: PaymentStatus.PENDING,
    },
    // Project 6: Mountain Resort - Abha
    {
      projectId: projects[5].id,
      categoryId: createdCategories[0].id,
      costType: CostType.MATERIAL,
      amount: 3800000,
      transactionDate: new Date('2025-12-15'),
      description: 'مواد بناء صديقة للبيئة',
      invoiceNumber: 'INV-2025-0567',
      paymentStatus: PaymentStatus.PENDING,
    },
    {
      projectId: projects[5].id,
      categoryId: createdCategories[8].id,
      costType: CostType.OTHER,
      amount: 750000,
      transactionDate: new Date('2025-11-01'),
      description: 'رسوم المعمارية والتصميم',
      invoiceNumber: 'PROF-2025-0012',
      paymentStatus: PaymentStatus.PAID,
      paidDate: new Date('2025-11-28'),
      approvedBy: createdBy,
      approvedAt: new Date('2025-11-05'),
    },
    // Project 8: Marina Development - Khobar
    {
      projectId: projects[7].id,
      categoryId: createdCategories[0].id,
      costType: CostType.MATERIAL,
      amount: 12500000,
      transactionDate: new Date('2025-12-01'),
      description: 'مواد مقاومة للماء وعوازل بحرية',
      invoiceNumber: 'INV-2025-0890',
      paymentStatus: PaymentStatus.PAID,
      paidDate: new Date('2025-12-28'),
      approvedBy: createdBy,
      approvedAt: new Date('2025-12-05'),
    },
    {
      projectId: projects[7].id,
      categoryId: createdCategories[3].id,
      costType: CostType.SUBCONTRACTOR,
      amount: 5600000,
      transactionDate: new Date('2026-01-10'),
      description: 'إنشاء المرسى وأعمال الحفر البحري',
      invoiceNumber: 'INV-2026-0012',
      paymentStatus: PaymentStatus.PENDING,
    },
    {
      projectId: projects[7].id,
      categoryId: createdCategories[5].id,
      costType: CostType.MAINTENANCE,
      amount: 280000,
      transactionDate: new Date('2025-12-31'),
      description: 'صيانة المعدات - ديسمبر',
      invoiceNumber: 'MAINT-2025-12',
      paymentStatus: PaymentStatus.PENDING,
    },
    // Insurance costs
    {
      projectId: projects[0].id,
      categoryId: createdCategories[7].id,
      costType: CostType.INSURANCE,
      amount: 1250000,
      transactionDate: new Date('2025-01-01'),
      description: 'قسط التأمين السنوي على المشروع',
      invoiceNumber: 'INS-2025-001',
      paymentStatus: PaymentStatus.PAID,
      paidDate: new Date('2025-01-28'),
      approvedBy: createdBy,
      approvedAt: new Date('2025-01-05'),
    },
    {
      projectId: projects[1].id,
      categoryId: createdCategories[7].id,
      costType: CostType.INSURANCE,
      amount: 850000,
      transactionDate: new Date('2025-03-01'),
      description: 'قسط التأمين السنوي على المشروع',
      invoiceNumber: 'INS-2025-002',
      paymentStatus: PaymentStatus.PAID,
      paidDate: new Date('2025-03-25'),
      approvedBy: createdBy,
      approvedAt: new Date('2025-03-05'),
    },
  ];

  for (const costData of projectCosts) {
    await prisma.cost.create({
      data: {
        ...costData,
        amountBeforeTax: costData.amount,
        createdBy,
      },
    });
  }

  console.log(`✅ ${projectCosts.length} Project Costs created`);

  console.log('✅ Finance seeding completed successfully');
}
