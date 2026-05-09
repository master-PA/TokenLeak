# TESTS

Automated tests are focused on the audit engine (deterministic logic).

## Tests written
- `src/lib/auditEngine.test.ts`
  - Recommends 'keep' when usage matches list price and team size
  - Detects unused seats as a downgrade opportunity
  - Detects team plan for 1 user as an overkill downgrade opportunity
  - Recommends dropping redundant tools if primary use case is coding
  - Flags high API spend for Credex

## How to run

```bash
npm test
```
