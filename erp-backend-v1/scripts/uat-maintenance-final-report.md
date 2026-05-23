# Maintenance UAT Final Report

Generated at: 2026-03-11T19:13:34.2713194+02:00

## Result
- PASS

## Scenario
- create asset for isolated maintenance test
- assign asset to project
- create maintenance request
- move status to IN_PROGRESS with rowVersion
- reject invalid completion allocation (sum != 100)
- complete maintenance with valid allocation
- validate maintenance statistics and cost-analysis deltas

## Key Metrics
- completedRequests: 0 -> 1
- totalActualCost: 0 -> 2200

## Validation
- invalid allocation rejected: True
- negative message: The remote server returned an error: (400) Bad Request.

## Cleanup
- attempted: True
- maintenance soft-cancelled: True
- maintenance hard-deleted: True
- asset project returned: True
- asset deleted: True
