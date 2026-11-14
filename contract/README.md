# Contract files

- `examples/`: one example request and response per endpoint. Use them as mock data. The wording inside cards and procedures is illustrative; the real wording comes from the API.
- `schemas.json`: JSON Schema for every endpoint, exported from the zod schemas in `src/schemas/`. Don't edit it by hand; run `npm run contract:export`.

The human-readable contract is `docs/api-contract.md`. Tests keep all three in step.
