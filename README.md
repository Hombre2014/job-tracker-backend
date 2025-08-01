# Job Tracker Backend

Job Tracker Backend is a Nest.js application designed to manage job tracking efficiently. It utilizes TypeScript, Nest.js framework, and PostgreSQL for database interactions.

## Frontend repository
[Job Tracker Frontend](https://github.com/Hombre2014/job-tracker-frontend)

## Prerequisites

### Required Software

1. Node 21 (or later)
2. yarn
3. Docker

### Configuration

Create `.env` file in the root directory. Copy and populate all content from `.env.example` file. Make sure `.env` file is full filled (including db credentials).

### Build API

```bash
yarn install
yarn build
```

### Start Postgres DB

```bash
docker compose up postgres_dev
```

### Run DB migration

Make sure all previous steps are completed.
If you have added a new migration, you may need to run the application before running this command.

```bash
yarn run typeorm migration:run -d src/data-source.ts
```

## Running the app

```bash
# development
yarn run start

# watch mode
yarn run start:dev

# production mode
yarn run start:prod
```

## Test

```bash
# unit tests
yarn run test

# e2e tests
yarn run test:e2e

# test coverage
yarn run test:cov
```

## How to

### Create a new DB migration

```bash
yarn run migration:generate {name}
```

### Revert the last migration

```bash
yarn run migration:revert
```

### Create an empty migration

```bash
yarn run migration:create {name}
```

### Remove all project related Docker data from the computer

```bash
docker-compose down -v --rmi all && docker system prune -a -f
```

### To run the project and rebuild everything while enabling watch mode

```bash
docker-compose up --build --watch
```

## Watch mode on WSL on Windows

Don't clone the project to `/mnt/**/` folders. Clone to WSL native folders like `/home/<username>/projects/` instead.
