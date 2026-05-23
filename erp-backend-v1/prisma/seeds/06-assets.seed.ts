/**
 * Assets Seed Data
 * Creates construction equipment, vehicles, and machinery
 */

import {
  PrismaClient,
  AssetType,
  AssetStatus,
  OperatorRole,
} from '@prisma/client';

export async function seedAssets(
  prisma: PrismaClient,
  projects: any[],
  employees: any[],
  createdBy: string,
) {
  console.log('🚜 Seeding Assets...');

  const assets = [
    // Heavy Machinery
    {
      assetNumber: 'AST-2024-0001',
      name: 'حفارة كاتربيلر 320',
      assetType: AssetType.MACHINERY,
      category: 'حفارات',
      manufacturer: 'Caterpillar',
      model: '320 GC',
      serialNumber: 'CAT320-2021-0045',
      yearOfManufacture: 2021,
      purchaseDate: new Date('2021-03-15'),
      purchasePrice: 450000,
      vendor: 'شركة البحر للمعدات الثقيلة',
      warrantyExpiry: new Date('2024-03-14'),
      status: AssetStatus.IN_USE,
      currentLocation: 'موقع برج الرياض للأعمال',
    },
    {
      assetNumber: 'AST-2024-0002',
      name: 'بلدوزر كوماتسو D65',
      assetType: AssetType.MACHINERY,
      category: 'بلدوزرات',
      manufacturer: 'Komatsu',
      model: 'D65EX-18',
      serialNumber: 'KOM-D65-2022-0132',
      yearOfManufacture: 2022,
      purchaseDate: new Date('2022-06-10'),
      purchasePrice: 520000,
      vendor: 'المعدات الثقيلة العربية',
      warrantyExpiry: new Date('2025-06-09'),
      status: AssetStatus.IN_USE,
      currentLocation: 'موقع مجمع فلل البحر الأحمر',
    },
    {
      assetNumber: 'AST-2024-0003',
      name: 'رافعة متحركة ليبهر LTM 1220',
      assetType: AssetType.MACHINERY,
      category: 'رافعات',
      manufacturer: 'Liebherr',
      model: 'LTM 1220-5.2',
      serialNumber: 'LBH-1220-2020-0089',
      yearOfManufacture: 2020,
      purchaseDate: new Date('2020-09-05'),
      purchasePrice: 1850000,
      vendor: 'ليبهر الشرق الأوسط',
      warrantyExpiry: new Date('2023-09-04'),
      status: AssetStatus.IN_USE,
      currentLocation: 'موقع الحرم الجامعي للعلوم الطبية',
    },
    {
      assetNumber: 'AST-2024-0004',
      name: 'لودر جي سي بي 3CX',
      assetType: AssetType.MACHINERY,
      category: 'لودرات',
      manufacturer: 'JCB',
      model: '3CX Sitemaster',
      serialNumber: 'JCB-3CX-2023-0201',
      yearOfManufacture: 2023,
      purchaseDate: new Date('2023-02-20'),
      purchasePrice: 285000,
      vendor: 'جي سي بي السعودية',
      warrantyExpiry: new Date('2026-02-19'),
      status: AssetStatus.AVAILABLE,
      currentLocation: 'مستودع الدمام',
    },
    // Vehicles
    {
      assetNumber: 'AST-2024-0005',
      name: 'تويوتا لاند كروزر',
      assetType: AssetType.VEHICLE,
      category: 'مركبات إدارية',
      manufacturer: 'Toyota',
      model: 'Land Cruiser GXR',
      serialNumber: 'TOY-LC-2023-0445',
      licensePlate: 'ر ي ض 1234',
      chassisNumber: '5TFUY5F19NX789456',
      engineNumber: '1GR-FE-789456',
      color: 'أبيض',
      fuelType: 'بنزين',
      yearOfManufacture: 2023,
      purchaseDate: new Date('2023-04-12'),
      purchasePrice: 185000,
      vendor: 'عبداللطيف جميل للسيارات',
      warrantyExpiry: new Date('2026-04-11'),
      status: AssetStatus.IN_USE,
      currentLocation: 'المكتب الرئيسي - الرياض',
    },
    {
      assetNumber: 'AST-2024-0006',
      name: ' شاحنة مرسيدس أكتروس',
      assetType: AssetType.VEHICLE,
      category: 'شاحنات ثقيلة',
      manufacturer: 'Mercedes-Benz',
      model: 'Actros 2645',
      serialNumber: 'MBZ-ACT-2022-0178',
      licensePlate: 'ج د ة 5678',
      chassisNumber: 'WDB9540311L654321',
      engineNumber: 'OM471-LA-654321',
      color: 'فضي',
      fuelType: 'ديزل',
      yearOfManufacture: 2022,
      purchaseDate: new Date('2022-08-15'),
      purchasePrice: 420000,
      vendor: 'دايملر الشرق الأوسط للشاحنات',
      warrantyExpiry: new Date('2025-08-14'),
      status: AssetStatus.IN_USE,
      currentLocation: 'موقع مجمع فلل البحر الأحمر',
    },
    {
      assetNumber: 'AST-2024-0007',
      name: 'سيارة هايلوكس',
      assetType: AssetType.VEHICLE,
      category: 'شاحنات خفيفة',
      manufacturer: 'Toyota',
      model: 'Hilux 4x4 Double Cab',
      serialNumber: 'TOY-HLX-2024-0089',
      licensePlate: 'د م م 9012',
      chassisNumber: '8TDEM5FN2P0123456',
      engineNumber: '2GD-FTV-123456',
      color: 'أحمر',
      fuelType: 'ديزل',
      yearOfManufacture: 2024,
      purchaseDate: new Date('2024-01-10'),
      purchasePrice: 125000,
      vendor: 'عبداللطيف جميل للسيارات',
      warrantyExpiry: new Date('2027-01-09'),
      status: AssetStatus.AVAILABLE,
      currentLocation: 'مكتب الدمام',
    },
    // Equipment & Tools
    {
      assetNumber: 'AST-2024-0008',
      name: 'ضاغط هواء أطلس كوبكو',
      assetType: AssetType.EQUIPMENT,
      category: 'ضواغط هواء',
      manufacturer: 'Atlas Copco',
      model: 'XAHS 447 CD',
      serialNumber: 'ACP-447-2023-0056',
      yearOfManufacture: 2023,
      purchaseDate: new Date('2023-05-18'),
      purchasePrice: 95000,
      vendor: 'أطلس كوبكو السعودية',
      warrantyExpiry: new Date('2025-05-17'),
      status: AssetStatus.IN_USE,
      currentLocation: 'موقع منتجع السودة السياحي',
    },
    {
      assetNumber: 'AST-2024-0009',
      name: 'Welding Machine Set',
      assetType: AssetType.TOOL,
      category: 'Welding Equipment',
      manufacturer: 'Lincoln Electric',
      model: 'PowerWave S500',
      serialNumber: 'LIN-S500-2022-0234',
      yearOfManufacture: 2022,
      purchaseDate: new Date('2022-11-20'),
      purchasePrice: 45000,
      vendor: 'Al Futtaim Equipment',
      warrantyExpiry: new Date('2024-11-19'),
      status: AssetStatus.AVAILABLE,
      currentLocation: 'Riyadh Warehouse',
    },
    {
      assetNumber: 'AST-2024-0010',
      name: 'HP Workstation Computer',
      assetType: AssetType.COMPUTER,
      category: 'Workstations',
      manufacturer: 'HP',
      model: 'Z4 G4 Workstation',
      serialNumber: 'HP-Z4-2023-0789',
      yearOfManufacture: 2023,
      purchaseDate: new Date('2023-07-01'),
      purchasePrice: 12000,
      vendor: 'Extra Stores',
      warrantyExpiry: new Date('2026-06-30'),
      status: AssetStatus.IN_USE,
      currentLocation: 'Riyadh Office - Engineering',
    },
    // Maintenance Required
    {
      assetNumber: 'AST-2024-0011',
      name: 'Bobcat S650 Skid Steer',
      assetType: AssetType.MACHINERY,
      category: 'Loaders',
      manufacturer: 'Bobcat',
      model: 'S650',
      serialNumber: 'BOB-S650-2020-0312',
      yearOfManufacture: 2020,
      purchaseDate: new Date('2020-10-15'),
      purchasePrice: 165000,
      vendor: 'Bobcat المملكه العربيه السعوديه',
      warrantyExpiry: new Date('2023-10-14'),
      status: AssetStatus.UNDER_MAINTENANCE,
      currentLocation: 'Jeddah Service Center',
    },
    {
      assetNumber: 'AST-2024-0012',
      name: 'Generator - Cummins 500 kVA',
      assetType: AssetType.EQUIPMENT,
      category: 'Power Generators',
      manufacturer: 'Cummins',
      model: 'C500D6',
      serialNumber: 'CMM-500-2021-0167',
      yearOfManufacture: 2021,
      purchaseDate: new Date('2021-12-08'),
      purchasePrice: 285000,
      vendor: 'Cummins Arabia',
      warrantyExpiry: new Date('2023-12-07'),
      status: AssetStatus.AVAILABLE,
      currentLocation: 'Khobar Marina Site',
    },
  ];

  const createdAssets: any[] = [];
  for (const assetData of assets) {
    const asset = await prisma.asset.upsert({
      where: { assetNumber: assetData.assetNumber },
      update: {},
      create: {
        ...assetData,
        createdBy,
      },
    });
    createdAssets.push(asset);
  }

  console.log(`✅ ${createdAssets.length} Assets created`);

  // Assign assets to employees (operators)
  console.log('👷 Assigning assets to employee operators...');

  const assetEmployeeAssignments = [
    {
      assetId: createdAssets[0].id, // Excavator
      employeeId: employees[9].id, // Heavy Equipment Operator
      role: OperatorRole.PRIMARY_DRIVER,
    },
    {
      assetId: createdAssets[1].id, // Bulldozer
      employeeId: employees[9].id,
      role: OperatorRole.PRIMARY_DRIVER,
    },
    {
      assetId: createdAssets[2].id, // Mobile Crane
      employeeId: employees[9].id,
      role: OperatorRole.OPERATOR,
    },
    {
      assetId: createdAssets[4].id, // Land Cruiser
      employeeId: employees[0].id, // General Manager
      role: OperatorRole.PRIMARY_DRIVER,
    },
    {
      assetId: createdAssets[5].id, // Mercedes Truck
      employeeId: employees[11].id, // Contract Worker
      role: OperatorRole.PRIMARY_DRIVER,
    },
    {
      assetId: createdAssets[6].id, // Hilux
      employeeId: employees[6].id, // Site Supervisor
      role: OperatorRole.PRIMARY_DRIVER,
    },
  ];

  for (const assignment of assetEmployeeAssignments) {
    await prisma.assetEmployee.upsert({
      where: {
        assetId_assignmentType_isPrimary_isActive: {
          assetId: assignment.assetId,
          assignmentType: assignment.role,
          isPrimary: true,
          isActive: true,
        },
      },
      update: {},
      create: {
        assetId: assignment.assetId,
        employeeId: assignment.employeeId,
        assignmentType: assignment.role,
        isPrimary: true,
        assignedBy: createdBy,
        isActive: true,
      },
    });
  }

  console.log(
    `✅ ${assetEmployeeAssignments.length} Asset-Employee assignments created`,
  );

  // Assign assets to projects
  console.log('🏗️ Assigning assets to projects...');

  const projectAssetAssignments = [
    { projectId: projects[0].id, assetId: createdAssets[0].id }, // Riyadh - Excavator
    { projectId: projects[0].id, assetId: createdAssets[4].id }, // Riyadh - Land Cruiser
    { projectId: projects[1].id, assetId: createdAssets[1].id }, // Jeddah - Bulldozer
    { projectId: projects[1].id, assetId: createdAssets[5].id }, // Jeddah - Mercedes Truck
    { projectId: projects[2].id, assetId: createdAssets[6].id }, // Dammam - Hilux
    { projectId: projects[2].id, assetId: createdAssets[11].id }, // Dammam - Generator
    { projectId: projects[4].id, assetId: createdAssets[2].id }, // Madinah - Mobile Crane
    { projectId: projects[5].id, assetId: createdAssets[7].id }, // Abha - Air Compressor
    { projectId: projects[7].id, assetId: createdAssets[11].id }, // Khobar - Generator
  ];

  for (const assignment of projectAssetAssignments) {
    await prisma.projectAsset.upsert({
      where: {
        projectId_assetId_assignedDate: {
          projectId: assignment.projectId,
          assetId: assignment.assetId,
          assignedDate: new Date(),
        },
      },
      update: {},
      create: {
        ...assignment,
        assignedBy: createdBy,
        isActive: true,
        status: 'APPROVED',
      },
    });
  }

  console.log(
    `✅ ${projectAssetAssignments.length} Project-Asset assignments created`,
  );

  return createdAssets;
}
