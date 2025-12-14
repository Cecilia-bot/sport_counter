-- Add is_deleted column to table_resorts. 0 == not deleted, 1 == deleted
ALTER TABLE table_resorts ADD is_deleted INTEGER DEFAULT 0;