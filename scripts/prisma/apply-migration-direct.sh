#!/bin/bash

# Script to apply the column migration directly
# Run this after stopping your dev server

cd "$(dirname "$0")/.."

echo "Applying migration to add XXXX column..."

# Wait a moment for any locks to clear
sleep 2

# Apply the migration directly
sqlite3 prisma/dev.db <<EOF
PRAGMA busy_timeout = 10000;
ALTER TABLE "Department" ADD COLUMN "appDescription" TEXT;
SELECT "Migration applied successfully!" as result;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo "You can now restart your dev server."
else
    echo "❌ Migration failed. Database may still be locked."
    echo "Please ensure your dev server is stopped and try again."
fi

