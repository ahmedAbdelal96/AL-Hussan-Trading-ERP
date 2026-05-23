/**
 * Maintenance Requests Seed Data
 * Creates maintenance requests for assets with various types and statuses
 */

import {
  PrismaClient,
  MaintenanceType,
  MaintenanceStatus,
  MaintenancePriority,
} from '@prisma/client';

export async function seedMaintenance(
  prisma: PrismaClient,
  assets: any[],
  projects: any[],
  employees: any[],
  createdBy: string,
) {
  console.log('🔧 Seeding Maintenance Requests...');

  // Helper function to generate maintenance number
  const generateMaintenanceNumber = (index: number) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return `MNT-${year}${month}-${String(index).padStart(4, '0')}`;
  };

  const maintenanceRequests = [
    // ========================================
    // COMPLETED - Past Maintenance (Success Stories)
    // ========================================
    {
      maintenanceNumber: generateMaintenanceNumber(1),
      assetId: assets[0].id, // Caterpillar Excavator
      projectId: projects[0].id, // Riyadh CBD
      maintenanceType: MaintenanceType.PREVENTIVE,
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.COMPLETED,
      title: 'تغيير الزيت ربع السنوي واستبدال الفلاتر',
      description:
        'صيانة دورية ربع سنوية - تغيير زيت المحرك، فحص زيت الهيدروليك، استبدال الفلاتر (زيت، وقود، هواء، هيدروليك)',
      scheduledDate: new Date('2024-12-10T08:00:00Z'),
      startedAt: new Date('2024-12-10T08:15:00Z'),
      completedAt: new Date('2024-12-10T14:30:00Z'),
      estimatedCost: 3500,
      actualCost: 3420,
      vendor: 'مركز خدمة معدات البحر',
      vendorContact: '+201-11-234-5678',
      assignedTo: employees[9].id, // Heavy Equipment Operator
      odometerReading: 8540,
      workPerformed:
        'تم تغيير زيت المحرك (15W-40)، استبدال فلتر الزيت والهواء والوقود. فحص نظام الهيدروليك وتعبئة الزيت. تشحيم جميع النقاط. فحص توتر الجنازير.',
      partsReplaced:
        'فلتر الزيت (CAT 1R-0739)، فلتر الهواء (CAT 110-6326)، فلتر الوقود (CAT 1R-0750)، زيت المحرك 20 لتر',
      approvedBy: employees[0].id,
      approvedAt: new Date('2024-12-10T15:00:00Z'),
    },
    {
      maintenanceNumber: generateMaintenanceNumber(2),
      assetId: assets[1].id, // Komatsu Bulldozer
      projectId: projects[1].id, // Jeddah Waterfront
      maintenanceType: MaintenanceType.CORRECTIVE,
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.COMPLETED,
      title: 'إصلاح تسريب أسطوانة الهيدروليك',
      description: 'تسريب زيت هيدروليك من حشية أسطوانة رفع النصل',
      scheduledDate: new Date('2024-12-15T10:00:00Z'),
      startedAt: new Date('2024-12-15T10:30:00Z'),
      completedAt: new Date('2024-12-16T16:00:00Z'),
      estimatedCost: 8500,
      actualCost: 9200,
      vendor: 'ورشة المعدات العربية الثقيلة',
      vendorContact: '+201-12-567-8901',
      assignedTo: employees[9].id,
      odometerReading: 6720,
      workPerformed:
        'تم فك مجموعة النصل، استبدال حشيات أسطوانة الهيدروليك، اختبار ضغط النظام، إعادة التجميع والمعايرة. لا تسريبات مكتشفة.',
      partsReplaced:
        'طقم حشيات أسطوانة الهيدروليك (KOM-707-99-45220)، طقم حلقات الإحكام، زيت هيدروليك 10 لتر',
      approvedBy: employees[0].id,
      approvedAt: new Date('2024-12-16T17:00:00Z'),
    },
    {
      maintenanceNumber: generateMaintenanceNumber(3),
      assetId: assets[4].id, // Toyota Land Cruiser
      projectId: projects[0].id, // Riyadh CBD
      maintenanceType: MaintenanceType.SCHEDULED,
      priority: MaintenancePriority.LOW,
      status: MaintenanceStatus.COMPLETED,
      title: 'صيانة العشرة آلاف كيلومتر',
      description: 'صيانة دورية منتظمة عند 10,000 كيلومتر',
      scheduledDate: new Date('2024-12-05T09:00:00Z'),
      startedAt: new Date('2024-12-05T09:10:00Z'),
      completedAt: new Date('2024-12-05T11:45:00Z'),
      estimatedCost: 1800,
      actualCost: 1650,
      vendor: 'مركز خدمة عبداللطيف جميل',
      vendorContact: '+201-11-345-6789',
      assignedTo: employees[0].id, // General Manager
      odometerReading: 10250,
      workPerformed:
        'تغيير زيت المحرك والفلتر، تبديل الإطارات، فحص الفرامل، استبدال فلتر المكيف، فحص شامل متعدد النقاط. جميع الأنظمة سليمة.',
      partsReplaced:
        'زيت المحرك 5W-30 / 7 لتر، فلتر الزيت (90915-YZZJ1)، فلتر المكيف (87139-30040)',
      approvedBy: employees[0].id,
      approvedAt: new Date('2024-12-05T12:00:00Z'),
    },
    {
      maintenanceNumber: generateMaintenanceNumber(4),
      assetId: assets[7].id, // Atlas Copco Air Compressor
      projectId: projects[5].id, // Abha Resort
      maintenanceType: MaintenanceType.PREVENTIVE,
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.COMPLETED,
      title: 'الصيانة السنوية للضاغط',
      description: 'صيانة وقائية سنوية لضاغط الهواء',
      scheduledDate: new Date('2024-11-20T08:00:00Z'),
      startedAt: new Date('2024-11-20T08:30:00Z'),
      completedAt: new Date('2024-11-20T15:00:00Z'),
      estimatedCost: 4200,
      actualCost: 4100,
      vendor: 'مركز خدمة أطلس كوبكو المعتمد',
      vendorContact: '+201-17-234-5678',
      assignedTo: employees[6].id, // Site Supervisor
      odometerReading: 3200, // Operating hours
      workPerformed:
        'فحص شامل: تغيير الزيت، فلتر الهواء، فاصل الزيت، اختبار صمام الأمان، التحقق من ضبط الضغط، فحص التوصيلات الكهربائية.',
      partsReplaced:
        'عنصر فلتر الهواء، فاصل الزيت، زيت الضاغط 20 لتر، صمام الأمان',
      approvedBy: employees[3].id, // Operations Manager
      approvedAt: new Date('2024-11-20T16:00:00Z'),
    },

    // ========================================
    // IN_PROGRESS - Currently Being Worked On
    // ========================================
    {
      maintenanceNumber: generateMaintenanceNumber(5),
      assetId: assets[10].id, // Bobcat Skid Steer (UNDER_MAINTENANCE)
      projectId: projects[1].id, // Jeddah Waterfront
      maintenanceType: MaintenanceType.CORRECTIVE,
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.IN_PROGRESS,
      title: 'ارتفاع حرارة المحرك - إصلاح نظام التبريد',
      description:
        'تفعّل مؤشر تحذير درجة حرارة المحرك. توقف الجهاز بسبب الارتفاع الحراري. يستلزم تشخيص وإصلاح نظام التبريد.',
      scheduledDate: new Date('2026-01-14T07:00:00Z'),
      startedAt: new Date('2026-01-14T07:30:00Z'),
      estimatedCost: 12000,
      vendor: 'مركز خدمة بوبكات المعتمد',
      vendorContact: '+201-12-890-1234',
      assignedTo: employees[9].id,
      odometerReading: 4850,
      workPerformed:
        'جاري العمل: تم تشخيص عطل الراديتر ومضخة المياه. تم طلب القطع. المتوقع الانتهاء غداً.',
      notes:
        'الراديتر مسدود داخلياً، محامل مضخة المياه متآكلة. قطع الغيار متوقع وصولها نهاية اليوم.',
    },
    {
      maintenanceNumber: generateMaintenanceNumber(6),
      assetId: assets[5].id, // Mercedes-Benz Actros Truck
      projectId: projects[1].id, // Jeddah Waterfront
      maintenanceType: MaintenanceType.PREVENTIVE,
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.IN_PROGRESS,
      title: 'صيانة وفحص نظام الفرامل',
      description:
        'صيانة الفرامل عند 20,000 كيلومتر - استبدال تيل الفرامل وفحص النظام',
      scheduledDate: new Date('2026-01-15T08:00:00Z'),
      startedAt: new Date('2026-01-15T08:15:00Z'),
      estimatedCost: 5500,
      vendor: 'مركز خدمة دايملر للشاحنات',
      vendorContact: '+201-12-456-7890',
      assignedTo: employees[11].id, // Contract Worker
      odometerReading: 20150,
      workPerformed:
        'جاري العمل: تم استبدال تيل الفرامل الأمامية. جاري العمل على ضبط فرامل المحور الخلفي.',
    },

    // ========================================
    // PENDING - Scheduled for Future
    // ========================================
    {
      maintenanceNumber: generateMaintenanceNumber(7),
      assetId: assets[0].id, // Caterpillar Excavator
      projectId: projects[0].id, // Riyadh CBD
      maintenanceType: MaintenanceType.PREVENTIVE,
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.PENDING,
      title: 'استبدال الجنازير وفحص هيكل الجنزير',
      description:
        'الجنازير تُظهر تآكلاً، مقررة للاستبدال قبل التوقف الكامل. يلزم فحص شامل لهيكل الجنزير.',
      scheduledDate: new Date('2026-02-01T08:00:00Z'),
      estimatedCost: 45000,
      vendor: 'معدات البحر',
      vendorContact: '+201-11-234-5678',
      assignedTo: employees[9].id,
      odometerReading: 8540,
      notes:
        'الجنازير بنسبة تآكل 70٪. يُنصح بالاستبدال قبل الوصول للمستوى الحرج. يُجدول خلال توقف المشروع لتقليل وقت التوقف.',
    },
    {
      maintenanceNumber: generateMaintenanceNumber(8),
      assetId: assets[2].id, // Liebherr Mobile Crane
      projectId: projects[4].id, // Madinah University
      maintenanceType: MaintenanceType.SCHEDULED,
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.PENDING,
      title: 'فحص شهادة السلامة السنوية',
      description:
        'شهادة السلامة السنوية الإلزامية لتشغيل الرافعة. مطلوبة من الدفاع المدني السعودي.',
      scheduledDate: new Date('2026-02-10T09:00:00Z'),
      estimatedCost: 8500,
      vendor: 'مركز ليبهر المعتمد للشرق الأوسط',
      vendorContact: '+201-14-678-9012',
      assignedTo: employees[3].id, // Operations Manager
      odometerReading: 2340,
      notes:
        'عاجل: يجب الإنجاز قبل انتهاء الشهادة الحالية في 15 فبراير 2026. لا يمكن تشغيل الجهاز بدون شهادة سارية.',
    },
    {
      maintenanceNumber: generateMaintenanceNumber(9),
      assetId: assets[6].id, // Hilux Pickup
      projectId: projects[2].id, // Dammam Industrial Complex
      maintenanceType: MaintenanceType.SCHEDULED,
      priority: MaintenancePriority.LOW,
      status: MaintenanceStatus.PENDING,
      title: 'صيانة الخمسة آلاف كيلومتر',
      description: 'أول صيانة دورية عند 5,000 كيلومتر',
      scheduledDate: new Date('2026-01-25T10:00:00Z'),
      estimatedCost: 850,
      vendor: 'خدمة عبداللطيف جميل',
      vendorContact: '+201-13-567-8901',
      assignedTo: employees[6].id, // Site Supervisor
      odometerReading: 4950,
    },
    {
      maintenanceNumber: generateMaintenanceNumber(10),
      assetId: assets[11].id, // Cummins Generator
      projectId: projects[2].id, // Dammam Industrial Complex
      maintenanceType: MaintenanceType.PREVENTIVE,
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.PENDING,
      title: 'الصيانة الربع سنوية للمولد',
      description:
        'صيانة 500 ساعة: تغيير الزيت والفلاتر، فحص سائل التبريد، اختبار البطارية، اختبار حمل البنك',
      scheduledDate: new Date('2026-01-30T08:00:00Z'),
      estimatedCost: 3800,
      vendor: 'خدمة كمينز العربية',
      vendorContact: '+201-13-890-1234',
      assignedTo: employees[6].id,
      odometerReading: 490, // Operating hours
    },

    // ========================================
    // EMERGENCY - Critical Issues
    // ========================================
    {
      maintenanceNumber: generateMaintenanceNumber(11),
      assetId: assets[3].id, // JCB Backhoe Loader
      maintenanceType: MaintenanceType.EMERGENCY,
      priority: MaintenancePriority.CRITICAL,
      status: MaintenanceStatus.PENDING,
      title: 'عاجل: عطل ناقل الحركة - الجهاز متوقف',
      description:
        'توقف الجهاز عن العمل في الموقع. ناقل الحركة لا يعمل، لا حركة للأمام أو الخلف. الجهاز عالق في الحقل.',
      scheduledDate: new Date('2026-01-16T07:00:00Z'),
      estimatedCost: 25000,
      vendor: 'خدمة JCB الطارئة',
      vendorContact: '+201-13-456-7890',
      odometerReading: 1240,
      notes:
        'طارئ: الجهاز يسد طريق الوصول. خدمة بأولوية قصوى. تم تنبيه فريق JCB.',
    },
    {
      maintenanceNumber: generateMaintenanceNumber(12),
      assetId: assets[9].id, // HP Workstation
      maintenanceType: MaintenanceType.CORRECTIVE,
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.PENDING,
      title: 'الحاسب لا يعمل - عطل القرص الصلب',
      description:
        'محطة العمل لا تشتغل. رسالة الخطأ تشير إلى عطل في القرص الصلب. يحتوي على ملفات CAD مهمة للمشروع.',
      scheduledDate: new Date('2026-01-17T09:00:00Z'),
      estimatedCost: 2500,
      vendor: 'مركز HP المعتمد',
      vendorContact: '+201-11-789-0123',
      notes:
        'عاجل: يحتوي على ملفات AutoCAD غير محفوظة لمشروع الرياض. استرداد البيانات أولوية قبل استبدال القطع.',
    },

    // ========================================
    // ON_HOLD - Awaiting Parts or Approval
    // ========================================
    {
      maintenanceNumber: generateMaintenanceNumber(13),
      assetId: assets[8].id, // Welding Machine
      maintenanceType: MaintenanceType.CORRECTIVE,
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.ON_HOLD,
      title: 'استبدال وحدة الطاقة',
      description:
        'وحدة الطاقة محترقة. قطعة الاستبدال مطلوبة من الولايات المتحدة.',
      scheduledDate: new Date('2026-01-12T08:00:00Z'),
      startedAt: new Date('2026-01-12T08:30:00Z'),
      estimatedCost: 15000,
      vendor: 'خدمة لينكولن إلكتريك',
      vendorContact: '+201-11-890-1234',
      assignedTo: employees[7].id, // Electrician
      notes:
        'قيد الانتظار: تم طلب وحدة الطاقة البديلة من مورد أمريكي. الوصول المتوقع: 25 يناير 2026. تكلفة القطع: 12,000 ريال. التخليص الجمركي جاري.',
    },

    // ========================================
    // CANCELLED - User Error / Not Needed
    // ========================================
    {
      maintenanceNumber: generateMaintenanceNumber(14),
      assetId: assets[4].id, // Toyota Land Cruiser
      projectId: projects[0].id,
      maintenanceType: MaintenanceType.CORRECTIVE,
      priority: MaintenancePriority.LOW,
      status: MaintenanceStatus.CANCELLED,
      title: 'فحص مؤشر تحقق من المحرك',
      description: 'إضاءة مؤشر تحقق من المحرك على لوحة القيادة',
      scheduledDate: new Date('2026-01-13T10:00:00Z'),
      estimatedCost: 500,
      notes:
        'ملغي: إنذار كاذب - غطاء خزان الوقود كان مفكوكاً. أحكم السائق الغطاء وانطفأ المؤشر بعد دورتين. لا حاجة للخدمة.',
    },

    // ========================================
    // Additional Preventive Maintenance Schedule
    // ========================================
    {
      maintenanceNumber: generateMaintenanceNumber(15),
      assetId: assets[1].id, // Komatsu Bulldozer
      projectId: projects[1].id,
      maintenanceType: MaintenanceType.PREVENTIVE,
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.PENDING,
      title: 'صيانة الألف ساعة',
      description:
        'صيانة كبرى مقررة عند 1000 ساعة: فحص شامل للمحرك وناقل الحركة والهيدروليك',
      scheduledDate: new Date('2026-02-15T07:00:00Z'),
      estimatedCost: 12000,
      vendor: 'المعدات العربية الثقيلة',
      vendorContact: '+201-12-567-8901',
      assignedTo: employees[9].id,
      odometerReading: 980,
      notes:
        'محطة صيانة رئيسية. يُجدول يومين توقف. استبدال جميع الفلاتر والسوائل والأحزمة.',
    },
    {
      maintenanceNumber: generateMaintenanceNumber(16),
      assetId: assets[5].id, // Mercedes Truck
      projectId: projects[1].id,
      maintenanceType: MaintenanceType.SCHEDULED,
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.PENDING,
      title: 'تدوير الإطارات والضبط',
      description: 'صيانة الإطارات عند 30,000 كيلومتر',
      scheduledDate: new Date('2026-02-05T09:00:00Z'),
      estimatedCost: 1800,
      vendor: 'مركز دايملر للخدمة',
      vendorContact: '+201-12-456-7890',
      assignedTo: employees[11].id,
      odometerReading: 29850,
    },
    {
      maintenanceNumber: generateMaintenanceNumber(17),
      assetId: assets[7].id, // Air Compressor
      projectId: projects[5].id,
      maintenanceType: MaintenanceType.PREVENTIVE,
      priority: MaintenancePriority.LOW,
      status: MaintenanceStatus.PENDING,
      title: 'استبدال فلتر الهواء',
      description: 'استبدال فلتر الهواء الربع سنوي',
      scheduledDate: new Date('2026-02-20T10:00:00Z'),
      estimatedCost: 450,
      vendor: 'خدمة أطلس كوبكو',
      vendorContact: '+201-17-234-5678',
      odometerReading: 3200,
    },
  ];

  // Create maintenance requests
  const createdMaintenance: any[] = [];
  for (const maintenanceData of maintenanceRequests) {
    const maintenance = await prisma.maintenanceRequest.upsert({
      where: { maintenanceNumber: maintenanceData.maintenanceNumber },
      update: {},
      create: {
        ...maintenanceData,
        createdBy,
      },
    });
    createdMaintenance.push(maintenance);
  }

  console.log(`✅ ${createdMaintenance.length} Maintenance Requests created`);

  // Print summary by status
  console.log('\n📊 Maintenance Requests Summary:');
  console.log('-'.repeat(60));

  const statusCounts = {
    PENDING: createdMaintenance.filter((m) => m.status === 'PENDING').length,
    IN_PROGRESS: createdMaintenance.filter((m) => m.status === 'IN_PROGRESS')
      .length,
    COMPLETED: createdMaintenance.filter((m) => m.status === 'COMPLETED')
      .length,
    ON_HOLD: createdMaintenance.filter((m) => m.status === 'ON_HOLD').length,
    CANCELLED: createdMaintenance.filter((m) => m.status === 'CANCELLED')
      .length,
  };

  console.log(`   ⏳ Pending:      ${statusCounts.PENDING}`);
  console.log(`   🔄 In Progress:  ${statusCounts.IN_PROGRESS}`);
  console.log(`   ✅ Completed:    ${statusCounts.COMPLETED}`);
  console.log(`   ⏸️  On Hold:      ${statusCounts.ON_HOLD}`);
  console.log(`   ❌ Cancelled:    ${statusCounts.CANCELLED}`);

  const typeCounts = {
    PREVENTIVE: createdMaintenance.filter(
      (m) => m.maintenanceType === 'PREVENTIVE',
    ).length,
    CORRECTIVE: createdMaintenance.filter(
      (m) => m.maintenanceType === 'CORRECTIVE',
    ).length,
    EMERGENCY: createdMaintenance.filter(
      (m) => m.maintenanceType === 'EMERGENCY',
    ).length,
    SCHEDULED: createdMaintenance.filter(
      (m) => m.maintenanceType === 'SCHEDULED',
    ).length,
  };

  console.log('\n📋 By Maintenance Type:');
  console.log(`   🛡️  Preventive:   ${typeCounts.PREVENTIVE}`);
  console.log(`   🔧 Corrective:   ${typeCounts.CORRECTIVE}`);
  console.log(`   🚨 Emergency:    ${typeCounts.EMERGENCY}`);
  console.log(`   📅 Scheduled:    ${typeCounts.SCHEDULED}`);

  return createdMaintenance;
}

