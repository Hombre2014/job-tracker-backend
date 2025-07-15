# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Document File Size Tracking**: Added automatic file size tracking for uploaded documents
  - New `fileSize` field in Document entity to store file size in bytes
  - Automatic capture of file size during document creation and updates
  - File size is extracted from `Express.Multer.File.size` property during upload
  - Database migration to add `fileSize` column to `documents` table
  - Backward compatibility: existing documents have `fileSize: null`
  - API responses now include `fileSize` field for all document endpoints

### Changed

- **Documents Service**: Enhanced document creation and update logic
  - Modified `create()` method to capture and store file size automatically
  - Modified `update()` method to update file size when files are replaced
  - File size is stored alongside other document metadata (URL, title, category)

### Technical Details

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
