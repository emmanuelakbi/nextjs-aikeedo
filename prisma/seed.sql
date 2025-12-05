-- Seed data for development
-- Password for all users: password123

-- Insert admin user
INSERT INTO users (id, email, "emailVerified", "passwordHash", "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@aikeedo.com',
  NOW(),
  '$2b$12$HVAkzV/31z8m8RuLN6Yp3umwC1sAjhlTsXfNtL8JOKk0BoXZepz36',
  'Admin',
  'User',
  'ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert test user
INSERT INTO users (id, email, "emailVerified", "passwordHash", "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'user@example.com',
  NOW(),
  '$2b$12$HVAkzV/31z8m8RuLN6Yp3umwC1sAjhlTsXfNtL8JOKk0BoXZepz36',
  'Test',
  'User',
  'USER',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
