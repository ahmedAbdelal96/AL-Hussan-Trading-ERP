# Assets UAT Final Report

- Started: 2026-03-11T19:03:16.4637650+02:00
- Finished: 2026-03-11T19:03:17.5612942+02:00
- Base URL: http://localhost:9000/api/v1
- Status: **PASS**

## Scenarios Executed
- Create asset
- Update asset status with rowVersion
- Assign asset to project
- Assign employee to asset
- Create maintenance request
- Verify asset detail/history endpoints
- Verify reports delta (overview/by-status/utilization)

## Baseline vs After
- Total assets: 5 -> 6
- IN_USE count: 2 -> 2
- UNDER_MAINTENANCE count: 3 -> 4
- Operational count (IN_USE + UNDER_MAINTENANCE): 5 -> 6

## Created Entities
- Asset ID: 8f43991d-4150-4edd-ae6a-ffc480b07a93
- Project ID: 7e057047-97e9-470b-b79a-b9ae66041b8c
- Employee ID: 73abed57-b2e0-4666-8d7d-9ae25baa8c48
- Maintenance Request ID: be6830df-e8cf-4746-b879-e55d03273402
- Final Asset Row Version: 2

## Cleanup
- Attempted: True
- Deleted: True
- Error: 
