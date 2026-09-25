#!/usr/bin/env bash
# Runs all migrations + seed on a throwaway local Postgres DB and executes the SQL test-suite.
set -e
cd "$(dirname "$0")/../.."
psql -qc 'drop database if exists yaz_test' -c 'create database yaz_test' postgres
for f in tests/sql/00_supabase_stub.sql supabase/migrations/*.sql supabase/seed.sql; do
  psql -v ON_ERROR_STOP=1 -q -d yaz_test -f "$f"
done
psql -q -d yaz_test -f tests/sql/10_tests.sql 2>&1 | grep -E "PASS|FAIL"
! psql -q -d yaz_test -f tests/sql/10_tests.sql 2>&1 | grep -q FAIL
