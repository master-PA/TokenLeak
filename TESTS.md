# TESTS

Automated tests are focused on the audit engine (deterministic logic).

## Tests written
- `src/lib/auditEngine.test.ts`
  - Totals + annual savings calculation
  - High-savings flag behavior
  - Already-optimal flag behavior
  - Never negative savings
  - Pricing mismatch detection for known list price inputs

## How to run

```bash
npm test
```

