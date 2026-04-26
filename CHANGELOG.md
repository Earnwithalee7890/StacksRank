# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-04-26

### Added
- **Core SDK**: Added `getBalance` helper and unified exports in `index.js`.
- **Validation**: Introduced a new data validation library in the SDK.
- **Frontend Infrastructure**: Integrated a centralized `SRLogger` and `SRStorage` utility.
- **Network Management**: Centralized network configuration in `SRNetwork`.
- **Formatting**: Added `SRFormatters` for consistent UI data display.
- **Smart Contracts**: Added a shared `math.clar` library and enhanced documentation for all core contracts.
- **Security**: Added `SECURITY.md` and configured `audit-ci` for dependency auditing.
- **Documentation**: Expanded `ARCHITECTURE.md` with system diagrams and security architecture details.
- **SEO**: Improved meta tags, added `robots.txt`, and updated project metadata.

### Improved
- Refactored `app-leather.js` to use the new centralized logging and formatting system.
- Enhanced SDK type definitions for better developer experience.
- Improved `.gitignore` with comprehensive patterns for modern development environments.

### Fixed
- Fixed trailing syntax issues in `price-oracle.clar`.
- Standardized SPDX identifiers across all Clarity contracts.

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
