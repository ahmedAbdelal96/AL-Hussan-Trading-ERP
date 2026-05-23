تحليل شامل: ما ينقص موديول التقارير
بناءً على طبيعة الشركة (مقاولات/حفر، الأولوية: الموظفين، الرواتب، الأصول، الصيانة، المواقع، المشاريع)، خليني أحلل الوضع الحالي وأقترح ما ينقص.

أولاً: ما عندنا حالياً (الموجود)
Module Reports
Employees Overview, By-Dept, By-Position, By-Type, Status, Turnover, Age/Experience
Payroll Dashboard, By-Dept, By-Site, Components, Allowances, Deductions, Trend, Comparison
Assets Overview, By-Type, By-Status, Alerts, By-Location
Maintenance Overview, By-Type, By-Status, Alerts
Sites Dashboard, By-Status, By-Location, Capacity, With-Projects, Performance
Finance بعض التقارير الأساسية
Users RBAC, Security
ثانياً: الثغرات الحرجة (مرتبة بالأولوية)
🔴 Priority 1 — CRITICAL (القرارات التشغيلية اليومية)

1. Projects Module — شبه غائب تقريباً
   ده أهم نقطة ضعف. شركة مقاولات بدون تقارير مشاريع تفصيلية = إدارة عمياء.

Report المقترح البيانات المطلوبة الهدف
Project Cost Breakdown Labor cost + Asset cost + Maintenance cost + Materials per project كم كلّف المشروع فعلياً؟
Budget vs. Actual per Project plannedBudget vs. (كل التكاليف الفعلية) هل المشروع في الميزانية؟
Project RAG Status timeline deviation + budget deviation أي مشاريع في خطر؟
Project Profitability Revenue - TotalCost per project أي المشاريع مربحة؟
Project Cash Flow Spending over time per project التدفق النقدي للمشروع
Resource Allocation per Project Employees + Assets assigned per project من/ماذا في كل مشروع؟ 2. Total Cost of Ownership — مربوط الأصول بالمشاريع
Report المقترح البيانات المطلوبة الهدف
Asset TCO Report Purchase price + Total maintenance cost + Operating hours هل الأصل يستحق الاستمرار؟
Asset Utilization by Project Hours assigned per project vs. idle hours كفاءة استخدام المعدات
Idle Assets Report Assets not assigned to any active project أصول غير مستغلة = خسارة 3. Labor Cost per Project — الرواتب مربوطة بالمشاريع
Report المقترح البيانات المطلوبة الهدف
Labor Cost by Project Employees assigned × salary cost / project duration كم كلّف العمالة في كل مشروع؟
Site Headcount vs. Requirement Current assigned employees vs. required نقص أو زيادة في كل موقع؟
🟡 Priority 2 — HIGH (القرارات الاستراتيجية الشهرية) 4. Maintenance Intelligence — الصيانة الذكية
Report المقترح البيانات الهدف
MTBF/MTTR per Asset عدد الأعطال + وقت الإصلاح تحديد الأصول الضعيفة
Preventive vs. Corrective Ratio نوع الصيانة over time هل الصيانة الوقائية فعّالة؟
Maintenance Cost per Asset Total spent on each asset أيهم أغلى في الصيانة
Upcoming Maintenance Schedule Next 30/60/90 days تخطيط مستقبلي
Maintenance Budget vs. Actual Planned maintenance cost vs. spent هل ميزانية الصيانة كافية؟ 5. Employee Assignment & Availability
Report المقترح البيانات الهدف
Employee Assignment Report Employee → Project/Site mapping من يعمل أين؟
Contract Expiry Report Employees with contracts expiring in 30/60/90 days تجديد العقود
Leave & Absence Report Leave balances, absenteeism rate التأثير على الإنتاجية
Skills Inventory Certifications, skills per employee تخصيص الكفاءات للمشاريع 6. Site-Level P&L (ربحية الموقع)
Report المقترح البيانات الهدف
Site Profitability Revenue - (Labor + Asset + Maintenance costs) per site أي المواقع مربحة؟
Site Resource Efficiency Output per resource unit كفاءة الإنتاج لكل موقع
Inter-Site Resource Movement Transfer log of assets/employees between sites تتبع حركة الموارد
🟢 Priority 3 — MEDIUM (اللوحات التنفيذية) 7. Executive Dashboard — لوحة القيادة التنفيذية
تقرير واحد يجمع كل المؤشرات الحرجة:

┌─────────────────────────────────────────────┐
│ EXECUTIVE DASHBOARD │
├───────────────┬─────────────────────────────┤
│ Active Projects: 12 │ Budget Utilization: 73% │
│ At-Risk Projects: 3 │ Labor Cost MTD: 2.4M SAR │
│ Asset Utilization: 68% │ Maintenance Overdue: 7 │
│ Headcount: 284 │ Idle Assets: 12 │
├────────────────────────┴─────────────────────┤
│ [Budget vs Actual Chart] [Project Status Map] │
│ [Monthly Cost Trend] [Asset Availability] │
└───────────────────────────────────────────────┘ 8. Finance Cross-Module Reports
Report المقترح البيانات الهدف
Company P&L All revenues - All costs الربحية الكلية
Cost Center Analysis Costs by Dept/Site/Project أين تذهب الأموال؟
Budget Adherence All departments vs. budgets الانضباط المالي
Cash Flow Forecast Planned spending next 3/6 months التخطيط النقدي
ثالثاً: خطة التنفيذ المقترحة
Architecture Approach

Backend (per new report):
Controller → FiltersDto → UseCase → Repository (Prisma queries)

Frontend (per new report):
Page → React Query Hook → API Service → Types

Data Sources (existing Prisma models):
Employee, Payslip, Asset, MaintenanceRecord,
Project, Site, Cost, ProjectEmployee, AssetAssignment
التسلسل الموصى به:

Phase 1 (أهم شيء — 2-3 أسابيع):
✅ Project Cost Breakdown
✅ Budget vs. Actual per Project  
 ✅ Asset Utilization by Project
✅ Labor Cost by Project

Phase 2 (تعمق في الصيانة — أسبوعين):
✅ MTBF/MTTR per Asset
✅ Maintenance Cost per Asset
✅ Maintenance Budget vs. Actual

Phase 3 (الموظفين والمواقع — أسبوعين):
✅ Employee Assignment Report
✅ Contract Expiry Report
✅ Site Profitability

Phase 4 (التنفيذيين — أسبوع):
✅ Executive Dashboard
✅ Company P&L
رأيي كـ Senior Developer
التقارير الموجودة حالياً هي reporting على مستوى الـ entity (موظف، أصل، موقع) — وده مفيد للمديرين التشغيليين.

لكن الإدارة العليا تحتاج cross-entity reporting يربط:

Project ←→ Employees (Labor Cost)
Project ←→ Assets (Equipment Cost)  
Project ←→ Maintenance (Maintenance Cost)
Project ←→ Site (Site Performance)
↓
Total Project Cost = يتخذوا قرارات صح
السؤال الأهم للإدارة هو دايماً: "المشروع ده كسب ولا خسر وليه؟" — وده مش بيجاوب عليه أي تقرير موجود حالياً.

هل تبدأ بـ Phase 1 (تقارير المشاريع)؟ وهل عندك في الـ Prisma schema بيانات الـ Cost وProjectEmployee وتخصيص الأصول للمشاريع؟
