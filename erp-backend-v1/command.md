<!-- prisma -->

npx prisma format
npx prisma validate
npx prisma migrate dev --name "initial-schema"
npx prisma migrate reset
npx prisma generate

<!-- if exist erros when  make migrate run -->

npx prisma migrate resolve --rolled-back

<!--   -->

npx eslint --fix .
npx prettier --write .
npm run format

<!-- perf benchmark -->

$env:PERF_EMAIL="superadmin@erp.sys"
$env:PERF_PASSWORD="YOUR_PASSWORD"
$env:PERF_API_BASE_URL="http://localhost:9000/api/v1"
$env:PERF_PROFILE="reports"   # reports | core | all
$env:PERF_MEASURED_ROUNDS="30"
$env:PERF_CONCURRENCY="3"
$env:PERF_OUTPUT_FILE="scripts/perf/results/baseline.json"
npm run perf:benchmark

<!-- core modules benchmark (daily ops) -->

$env:PERF_PROFILE="core"
$env:PERF_OUTPUT_FILE="scripts/perf/results/core-current.json"
npm run perf:benchmark

<!-- core gate (recommended daily workflow) -->

$env:PERF_EMAIL="superadmin@erp.sys"
$env:PERF_PASSWORD="YOUR_PASSWORD"
npm run perf:core:baseline   # one-time (or after major data/model changes)
npm run perf:core:check      # current run + compare + assert

<!-- write-heavy benchmark (create/update/delete daily operations) -->

$env:PERF_EMAIL="superadmin@erp.sys"
$env:PERF_PASSWORD="YOUR_PASSWORD"
$env:PERF_MEASURED_ROUNDS="20"
npm run perf:write:baseline  # one-time baseline for write path
npm run perf:write:check     # current write run + compare + assert

<!-- write-heavy benchmark for operations modules (sites + projects) -->

$env:PERF_EMAIL="superadmin@erp.sys"
$env:PERF_PASSWORD="YOUR_PASSWORD"
$env:PERF_MEASURED_ROUNDS="20"
npm run perf:write:ops:baseline
npm run perf:write:ops:check

<!-- compare with baseline -->

$env:PERF_OUTPUT_FILE="scripts/perf/results/current.json"
$env:PERF_COMPARE_FILE="scripts/perf/results/baseline.json"
npm run perf:benchmark
$env:PERF_ASSERT_FILE="scripts/perf/results/current.json"
$env:PERF_ASSERT_BASELINE_FILE="scripts/perf/results/baseline.json"
$env:PERF_ASSERT_MAX_P95_MS="400"
$env:PERF_ASSERT_MAX_P99_MS="700"
$env:PERF_ASSERT_MAX_P95_REGRESSION_MS="50"
npm run perf:assert

<!-- projects module audit gate -->

$env:PERF_EMAIL="superadmin@erp.sys"
$env:PERF_PASSWORD="Admin@123456"
npm run audit:projects:all

<!-- finance module audit gate -->

$env:PERF_EMAIL="superadmin@erp.sys"
$env:PERF_PASSWORD="Admin@123456"
npm run audit:finance:all

<!-- payroll rowVersion migrations -->

# run latest payroll optimistic concurrency migrations
npx prisma migrate dev -n add_payroll_row_version
npx prisma migrate dev -n add_employee_allowance_row_version

# production
npx prisma migrate deploy

<!--  Force stop the node process -->

cd 'F:\Web\Projects\full projects\school-system\project\nestjs-school-api-v1'; Get-Process | Where-Object { $\_.ProcessName -like "_node_" } | Stop-Process -Force
