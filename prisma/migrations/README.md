# Database Migrations

This directory contains Prisma database migrations for the AIKEEDO Next.js application.

## Initial Migration

The `20251129001702_init` migration creates the initial database schema including:

- **users** table: User accounts with authentication and profile information
- **workspaces** table: Multi-tenant workspaces for organizing users and data
- **workspace_members** table: Join table for workspace membership
- **sessions** table: User session management for authentication
- **accounts** table: OAuth and external authentication provider accounts
- **verification_tokens** table: Email verification and password reset tokens

## Running Migrations

### Apply all pending migrations

```bash
npm run db:migrate
```

### Create a new migration

```bash
npx prisma migrate dev --name your_migration_name
```

### Reset database (WARNING: Deletes all data)

```bash
npx prisma migrate reset
```

### Apply migrations in production

```bash
npx prisma migrate deploy
```

## Seeding the Database

After running migrations, you can seed the database with test data:

```bash
npm run db:seed
```

This will create:

- Admin user: admin@aikeedo.com / password123
- Test user: user@example.com / password123
- Unverified user: unverified@example.com / password123
- Personal workspaces for each user
- A shared "Team Workspace" with the test user as a member

## Database Setup

### Local Development with Docker

1. Start a PostgreSQL container:

```bash
docker run --name aikeedo-postgres \
  -e POSTGRES_USER=aikeedo \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=aikeedo_dev \
  -p 5433:5432 \
  -d postgres:16-alpine
```

2. Update your `.env` file:

```
DATABASE_URL="postgresql://aikeedo:password@localhost:5433/aikeedo_dev"
```

3. Run migrations:

```bash
npm run db:migrate
```

4. Seed the database:

```bash
npm run db:seed
```

### Using an Existing PostgreSQL Instance

If you have PostgreSQL installed locally or want to use a remote instance:

1. Create a database:

```sql
CREATE DATABASE aikeedo_dev;
```

2. Update your `.env` file with your connection string:

```
DATABASE_URL="postgresql://username:password@host:port/database"
```

3. Run migrations and seed as above.

## Prisma Studio

To view and edit your database data with a GUI:

```bash
npm run db:studio
```

This will open Prisma Studio in your browser at http://localhost:5555

## Notes

- All migrations are tracked in the `migration_lock.toml` file
- Never edit migration files after they've been applied
- Always create new migrations for schema changes
- Test migrations in development before applying to production
- Back up your database before running migrations in production
