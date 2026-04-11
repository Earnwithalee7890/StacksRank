# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-04-12

### Added
- TypeScript type definitions (`types/index.d.ts`)
- Full ESM support with entry point at `esm/index.js`
- New API utilities: `getTransactionStatus`, `readContract`, `getBlockHeight`, `microToStx`, `stxToMicro`
- Comprehensive contract registry in `lib/contracts.js`

### Fixed
- Fixed missing exports in the main entry point
- Improved contract metadata structure for better SDK integration
- Updated test suite for improved coverage and structure
