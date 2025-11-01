-- Create is_admin column and set admin users
ALTER TABLE table_users ADD is_admin INTEGER;
UPDATE table_users
SET is_admin = 1
WHERE email IN (
  'barile.cec@gmail.com',
  'vmacarios@gmail.com'
);
