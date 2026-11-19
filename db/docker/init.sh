#!/bin/bash
# Runs once, on the first start of the container (empty volume).
# Loads the schema, then the real content (db/seed.sql, not committed)
# or the fictitious test data when the seed is missing.
set -euo pipefail

load() {
	echo "init: loading $1"
	mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE" < "$1"
}

load /db/schema.sql
if [ -f /db/seed.sql ]; then
	load /db/seed.sql
else
	echo "init: db/seed.sql not found, using test fixtures"
	load /db/test/fixtures.sql
fi
