/* Development-only migration: align existing seed users with NoOpPasswordEncoder. */
UPDATE Users
SET PasswordHash = 'admin123'
WHERE PasswordHash = 'hashed_password'
   OR PasswordHash LIKE '$2a$%'
   OR PasswordHash LIKE '$2b$%'
   OR PasswordHash LIKE '$2y$%';
