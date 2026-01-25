# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-01-25

### Fixed

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

### Changed

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
