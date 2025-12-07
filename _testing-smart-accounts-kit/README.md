# Testing Smart Accounts Kit

This project tests the `decodeDelegations` and `encodeDelegations` utilities from `@metamask/smart-accounts-kit`.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the test:
   ```bash
   npm test
   ```
   Or directly:
   ```bash
   npx tsx test-delegation-imports.ts
   ```

## Notes

- The import path `@metamask/smart-accounts-kit/utils` may need to be adjusted based on the actual package exports
- The test uses a placeholder encoded delegation string - you'll need a valid encoded string to fully test `decodeDelegations`
- To test `encodeDelegations`, you'll need to provide a valid delegation object structure

## Troubleshooting

If the import fails, try:
- `import { decodeDelegations, encodeDelegations } from "@metamask/smart-accounts-kit";`
- Check the package documentation for the correct export path
- Verify the package version and exports in `node_modules/@metamask/smart-accounts-kit/package.json`

