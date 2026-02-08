# Migration Guide: Company Deduplication System (v1.0.2 / v1.4.4)

## Overview

This release introduces strict unique constraints on company names and domains to prevent duplicate records. Deploying this update requires careful execution to ensure existing data is cleaned up before applying database constraints.

## Pre-Deployment Checklist

1.  [ ] **Backup Database**: Create a full backup of the production database.
2.  [ ] **Maintenance Window**: Schedule a short downtime window (est. 15-30 mins) as the migration will lock the `companies` table.

## Migration Steps

### 1. Data Cleanup (Crucial)

Before running the schema migration, you must resolve existing duplicates. The migration will FAIL if duplicates exist.

**Case Sensitivity Notice:**
The default PostgreSQL UNIQUE constraint is case-sensitive. This means "Google" and "google" are considered different values and can both be inserted after migration. The cleanup queries below use LOWER(name) and LOWER(url) to detect duplicates, implying case-insensitive uniqueness. If you want to enforce case-insensitive uniqueness, you must use a unique index on LOWER(name) or LOWER(url) instead of a plain UNIQUE constraint.

Run the following SQL check query:

```sql
SELECT LOWER(name), COUNT(*)
FROM companies
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;

SELECT LOWER(url), COUNT(*)
FROM companies
WHERE url IS NOT NULL
GROUP BY LOWER(url)
HAVING COUNT(*) > 1;
```

If these queries return any rows, you must merge or delete duplicate records.

**To enforce case-insensitive uniqueness, use:**

```sql
CREATE UNIQUE INDEX unique_company_name_ci ON companies (LOWER(name));
CREATE UNIQUE INDEX unique_company_url_ci ON companies (LOWER(url));
```

If you prefer case-sensitive uniqueness, document this in your migration and adjust the cleanup queries to remove LOWER().

### 2. Backend Deployment

Deploy the backend code. The application will automatically attempt to run migrations on startup (if configured).

**Manual Migration Command:**

```bash
# Navigate to your project root directory (adjust path as needed)
cd <your-project-root>
yarn migration:run
```

**What this does:**

- Adds unique constraint to `name` column
- Adds unique constraint to `url` column
- Creates index `idx_company_url`

### 3. Frontend Deployment

Deploy the frontend code. There are no breaking changes for the frontend, but it relies on the backend for validation.

### 4. Verification

After deployment, verify the system:

1.  Try to create a company with a name that already exists -> Should link to existing.
2.  Try to create a company with a domain that already exists -> Should link to existing.

## Rollback Plan

If the migration fails or causes issues:

1.  **Revert Migration:**
    ```bash
    yarn migration:revert
    ```
2.  **Redeploy Previous Version**: Rollback backend code to v1.0.1.

## Troubleshooting

**Error: `duplicate key value violates unique constraint` during migration**

- **Cause**: Data cleanup was incomplete.
- **Fix**: Run the cleanup queries again and ensure NO duplicates exist before retrying the migration.
