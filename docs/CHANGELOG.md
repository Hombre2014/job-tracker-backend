# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-04-23

### Fixed

- **Request Body Size Limit**: Increased the JSON body size limit from the default 100kb to 10mb to prevent `413 Request Entity Too Large` errors when creating or editing notes with large rich-text (HTML) content.
  - **Root Cause**: NestJS/Express applies a 100kb default body parser limit with no explicit override configured.
  - **Fix**: Disabled NestJS's built-in body parser (`bodyParser: false`) and registered explicit `express.json({ limit: '10mb' })` and `express.urlencoded({ limit: '10mb', extended: true })` parsers to avoid middleware duplication.
  - **Impact**: Notes (and all other endpoints) now accept request bodies up to 10mb; all existing functionality is unaffected.
  - **File**: `src/main.ts`

## [1.1.0] - 2026-02-08

### Added - Logo Backfill & Integration

- **Logo Column Migration**: Introduced a dedicated logo column in the database for storing high-quality company logos.
- **Brandfetch Integration**: Implemented automated logo fetching from Brandfetch API with SSL verification and request timeouts.
- **Backfill Script**: Added backfill-logos.ts script to restore and update company logos in bulk, including error handling and API key validation.
- **Manual Logo Support**: Enabled manual logo overrides and reset functionality via backend endpoints.

### Fixed

- **Logo Rendering**: Fixed a bug where manual logos wouldn't display for companies without a valid domain name.
- **API Key Validation**: Added early validation for missing Brandfetch API key to prevent unnecessary 401 errors.

## [1.0.2] - 2026-02-07

### Added - Company Deduplication System

- **Duplicate Prevention Logic**: Implemented robust company deduplication based on name and domain
  - **Constraints**: Added unique constraints to `name` and `url` columns in `companies` table
  - **Service Logic**: `create` method now checks for existing companies by name or domain before creation
  - **Domain Validation**: Added `findByNameOrDomain` and `validateDomainOwnership` methods
  - **Case-Insensitive Matching**: All lookups use `LOWER()` for consistent matching
  - **Files**: `src/modules/companies/companies.service.ts`, `src/modules/companies/entities/company.entity.ts`

- **Brandfetch Integration**: Added service to validate domains and fetch company data
  - **Service**: `BrandfetchService` communicates with Brandfetch API
  - **Validation**: Verifies if a domain is registered and retrieves official company name/logo
  - **Endpoints**: `POST /companies/find-by-name-or-domain`, `POST /companies/validate-domain`
  - **Files**: `src/modules/companies/brandfetch.service.ts`, `src/modules/companies/companies.controller.ts`

### Changed

- **Company Creation Flow**:
  - Requesting to create a company that already exists now returns the existing record instead of failing or creating a duplicate
  - Updates existing company URL if a new valid URL is provided during "creation" of existing company

## [1.0.1] - 2026-01-25

### Fixed - Password Reset Endpoints and Email Service

- **Email Service Error Handling**: Enhanced email sending with proper error handling
  - **Issue**: Email service silently failed without throwing errors, causing API to return success even when emails weren't sent
  - **Fix**: Added validation for `RESEND_TOKEN` and `NOTIFICATION_EMAIL`, throws errors on failure
  - **Impact**: API now properly fails with error messages when email configuration is missing or sending fails
  - **Files**: `src/modules/email-sender/email-sender.service.ts`

- **Password Reset Endpoints**: Added proper response messages and status codes
  - **Issue**: Endpoints returned `204 No Content` causing frontend confusion
  - **Fix**: Now return `200` with `{ message: 'Verification code sent successfully' }` and `{ message: 'Password reset successfully' }`
  - **Impact**: Clear success responses for password reset operations
  - **Files**: `src/modules/users/users.controller.ts`

### Changed - User Creation and Login

- **Code Cleanup**: Removed debug console.log statements
  - **Removed**: Unnecessary profilePic logging in user creation
  - **Benefits**: Cleaner production logs
  - **Files**: `src/modules/users/users.controller.ts`

## [Unreleased]

### Added - Password Strength Validation (25/01/2026)

- **Password Strength Utility**: Created server-side password strength validation
  - **File**: `src/utils/password-strength.util.ts`
  - **Function**: `isStrongPassword(password: string): boolean`
  - **Validation Regex**: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`
  - **Requirements**: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number
  - **Purpose**: Server-side validation during login to detect weak passwords
  - **Security**: Eliminates need for client-side password storage and validation

- **Login Response Enhancement**: Added `passwordStrength` field to login response
  - **DTO Updated**: `JwtTokensDto` now includes optional `passwordStrength?: 'strong' | 'weak'`
  - **File**: `src/modules/auth/dtos/jwt-tokens.dto.ts`
  - **Response Format**:

    ```json
    {
      "accessToken": "...",
      "refreshToken": "...",
      "passwordStrength": "strong" // or "weak"
    }
    ```

  - **Use Case**: Frontend uses this flag to trigger password update flow for weak passwords

### Changed - Authentication Service (25/01/2026)

- **Sign In Method**: Enhanced to validate password strength during authentication
  - **File**: `src/modules/auth/auth.service.ts`
  - **Flow**: Authentication → Password Strength Check → Return tokens + strength flag
  - **Validation**: Checks plain-text password before comparing with hash
  - **Non-Breaking**: Authentication still succeeds regardless of password strength
  - **User Experience**: Weak password users can still login but are guided to update
- **Token Generation**: Updated to accept optional `passwordStrength` parameter
  - **Method**: `generateTokens(userId, email, passwordStrength?)`
  - **Refresh Token**: Does not include `passwordStrength` (not needed on refresh)
  - **Type Safety**: Proper TypeScript typing for optional parameter

### Security Benefits

- ✅ **Server-Side Validation**: Password strength validated on backend, not client
- ✅ **No Client Password Storage**: Frontend no longer needs to store passwords
- ✅ **Reduced Attack Surface**: Eliminates XSS risk from password in React state
- ✅ **DevTools Security**: Passwords not exposed in browser DevTools
- ✅ **Centralized Logic**: Password requirements enforced consistently on server

### Technical Details

- **Plain-Text Validation**: Password strength checked before bcrypt comparison
- **Hash Integrity**: Hashed password in database remains unchanged
- **Backward Compatible**: Existing authentication flow unchanged
- **Optional Field**: `passwordStrength` only returned on login, not refresh
- **Type Definitions**: Full TypeScript support for new field

### Added

- **Document File Size Tracking**: Added automatic file size tracking for uploaded documents
  - New `fileSize` field in Document entity to store file size in bytes
  - Automatic capture of file size during document creation and updates
  - File size is extracted from `Express.Multer.File.size` property during upload
  - Database migration to add `fileSize` column to `documents` table
  - Backward compatibility: existing documents have `fileSize: null`
  - API responses now include `fileSize` field for all document endpoints

### Changed - Document Service (25/01/2026)

- **Documents Service**: Enhanced document creation and update logic
  - Modified `create()` method to capture and store file size automatically
  - Modified `update()` method to update file size when files are replaced
  - File size is stored alongside other document metadata (URL, title, category)

### Technical Details and Considerations

- **Database Schema**: Added `fileSize` column as `bigint` type to handle large files
- **Entity Model**: Updated `Document` entity with optional `fileSize?: number` field
- **Migration**: Created migration `AddFileSizeToDocuments1752564722535`
- **Data Type**: Uses `bigint` in PostgreSQL to support files up to ~9 exabytes
- **Nullable Design**: Column is nullable to maintain compatibility with existing data

### Migration Information

- **Migration File**: `1752564722535-add-fileSize-to-documents.ts`
- **SQL Statement**: `ALTER TABLE "documents" ADD "fileSize" bigint`
- **Rollback Support**: Includes down migration to remove column if needed
- **Production Safe**: Non-breaking change with null values for existing records

### API Impact

- **Response Format**: All document API endpoints now return `fileSize` field
- **File Size Units**: File size is returned in bytes (integer)
- **Existing Documents**: Legacy documents return `fileSize: null`
- **New Documents**: Include accurate file size from upload metadata

### Implementation Notes

- File size is automatically captured from multipart form uploads
- No client-side calculation required - server authoritative
- Supports file sizes from 0 bytes to PostgreSQL bigint limit
- TypeORM entity validation ensures data integrity
- No breaking changes to existing API contracts
- **Error Handling**: Graceful fallback to `null` if `file.size` is undefined, with warning logs for debugging

### Affected Endpoints

- `POST /documents` - Now stores and returns file size
- `GET /documents/:id` - Response includes fileSize field
- `GET /documents` - Paginated results include fileSize for each document
- `GET /documents/user` - User's documents include fileSize field
- `GET /documents/board/:boardId` - Board documents include fileSize field
- `PATCH /documents/:id` - Updates file size when file is replaced

### Database Schema Changes

```sql
-- Added column
ALTER TABLE "documents" ADD "fileSize" bigint;

-- Column properties
-- Type: bigint (supports large files)
-- Nullable: true (backward compatibility)
-- Default: NULL (for existing records)
```

### Code Changes Summary

- **Entity**: Added `@Column({ type: 'bigint', nullable: true }) fileSize?: number;`
- **Service**: Added `fileSize: file.size` to document creation and update payloads
- **Migration**: Auto-generated TypeORM migration for schema change
- **Testing**: Verified with real file upload (28KB .doc file)
