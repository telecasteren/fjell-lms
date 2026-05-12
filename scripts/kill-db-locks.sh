#!/bin/bash

# Script to find and kill processes locking the Prisma database
# Usage: ./scripts/kill-db-locks.sh [--force]

cd "$(dirname "$0")/.."

DB_PATH="prisma/dev.db"
FORCE_KILL=false

# Check for --force flag
if [[ "$1" == "--force" ]]; then
    FORCE_KILL=true
fi

echo "🔍 Checking for processes locking the database..."
echo ""

# Find processes locking the database
LOCKING_PROCESSES=$(lsof "$DB_PATH" 2>/dev/null)

if [ -z "$LOCKING_PROCESSES" ]; then
    echo "✅ No processes are locking the database"
    exit 0
fi

echo "⚠️  Found processes locking the database:"
echo ""
echo "$LOCKING_PROCESSES" | tail -n +2 | while read -r line; do
    PID=$(echo "$line" | awk '{print $2}')
    COMMAND=$(echo "$line" | awk '{print $1}')
    USER=$(echo "$line" | awk '{print $3}')
    echo "  - PID: $PID | Command: $COMMAND | User: $USER"
done

echo ""

# Also check for related Prisma/Node processes
echo "🔍 Checking for related Prisma/Node processes..."
echo ""

PRISMA_PROCESSES=$(ps aux | grep -E "(prisma|schema-engine)" | grep -v grep | grep -v "$0")

if [ -n "$PRISMA_PROCESSES" ]; then
    echo "⚠️  Found related Prisma processes:"
    echo ""
    echo "$PRISMA_PROCESSES" | while read -r line; do
        PID=$(echo "$line" | awk '{print $2}')
        COMMAND=$(echo "$line" | awk '{print $11, $12, $13, $14, $15, $16, $17, $18, $19, $20}' | sed 's/[[:space:]]*$//')
        echo "  - PID: $PID | Command: $COMMAND"
    done
    echo ""
fi

# Extract PIDs to kill
PIDS_TO_KILL=$(echo "$LOCKING_PROCESSES" | tail -n +2 | awk '{print $2}' | sort -u)
PRISMA_PIDS=$(echo "$PRISMA_PROCESSES" | awk '{print $2}' | sort -u)
ALL_PIDS=$(echo -e "$PIDS_TO_KILL\n$PRISMA_PIDS" | sort -u)

if [ -z "$ALL_PIDS" ]; then
    echo "✅ No processes to kill"
    exit 0
fi

if [ "$FORCE_KILL" = false ]; then
    echo "❓ Kill these processes? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled"
        exit 0
    fi
fi

echo ""
echo "🔪 Killing processes..."

for PID in $ALL_PIDS; do
    if kill -0 "$PID" 2>/dev/null; then
        COMMAND=$(ps -p "$PID" -o comm= 2>/dev/null)
        if kill "$PID" 2>/dev/null; then
            echo "  ✅ Killed PID $PID ($COMMAND)"
        else
            echo "  ⚠️  Failed to kill PID $PID (may require sudo)"
        fi
    fi
done

# Wait a moment for processes to release locks
sleep 1

echo ""
echo "🔍 Verifying database is unlocked..."

if lsof "$DB_PATH" 2>/dev/null | grep -q .; then
    echo "  ⚠️  Database may still be locked. Remaining processes:"
    lsof "$DB_PATH" 2>/dev/null | tail -n +2
    echo ""
    echo "  💡 Try running with --force or manually kill remaining processes"
    exit 1
else
    echo "  ✅ Database is now unlocked!"
    exit 0
fi

