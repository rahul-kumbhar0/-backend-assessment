create extension if not exists pgcrypto;
CREATE TABLE if not exists websites (
  id uuid primary key default gen_random_uuid(),
  url text UNIQUE not null,
  brand_name text,
  description text,
  enhanced_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
