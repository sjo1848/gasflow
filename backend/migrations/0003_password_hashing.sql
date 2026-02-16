CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Migra contraseñas legadas en texto plano a bcrypt.
UPDATE users
SET password = crypt(password, gen_salt('bf', 12))
WHERE password IS NOT NULL
  AND password NOT LIKE '$2a$%'
  AND password NOT LIKE '$2b$%'
  AND password NOT LIKE '$2y$%';
