#!/usr/bin/env node

/**
 * Script to find and kill processes locking the Prisma database
 * Usage: node scripts/kill-db-locks.mjs [--force]
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const FORCE_KILL = process.argv.includes('--force');

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  } catch {
    return '';
  }
}

function getLockingProcesses() {
  try {
    const output = exec(`lsof "${DB_PATH}" 2>/dev/null`);
    if (!output.trim()) return [];
    
    const lines = output.trim().split('\n').slice(1); // Skip header
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parts[1],
        command: parts[0],
        user: parts[2],
        fd: parts[3],
      };
    });
  } catch {
    return [];
  }
}

function getPrismaProcesses() {
  try {
    const output = exec('ps aux | grep -E "(prisma|schema-engine)" | grep -v grep | grep -v "kill-db-locks"');
    if (!output.trim()) return [];
    
    const lines = output.trim().split('\n');
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parts[1],
        command: parts.slice(10).join(' '),
        user: parts[0],
      };
    });
  } catch {
    return [];
  }
}

function killProcess(pid) {
  try {
    execSync(`kill ${pid} 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

function isProcessRunning(pid) {
  try {
    execSync(`kill -0 ${pid} 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

console.log('🔍 Checking for processes locking the database...\n');

const lockingProcesses = getLockingProcesses();
const prismaProcesses = getPrismaProcesses();

if (lockingProcesses.length === 0 && prismaProcesses.length === 0) {
  console.log('✅ No processes are locking the database');
  process.exit(0);
}

if (lockingProcesses.length > 0) {
  console.log('⚠️  Found processes locking the database:\n');
  lockingProcesses.forEach(p => {
    console.log(`  - PID: ${p.pid} | Command: ${p.command} | User: ${p.user}`);
  });
  console.log('');
}

if (prismaProcesses.length > 0) {
  console.log('⚠️  Found related Prisma processes:\n');
  prismaProcesses.forEach(p => {
    console.log(`  - PID: ${p.pid} | Command: ${p.command.substring(0, 60)}...`);
  });
  console.log('');
}

// Collect all PIDs to kill
const allPids = new Set();
lockingProcesses.forEach(p => allPids.add(p.pid));
prismaProcesses.forEach(p => allPids.add(p.pid));

if (allPids.size === 0) {
  console.log('✅ No processes to kill');
  process.exit(0);
}

if (!FORCE_KILL) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('❓ Kill these processes? (y/N): ', (answer) => {
    rl.close();
    if (!answer.match(/^[Yy]$/)) {
      console.log('❌ Cancelled');
      process.exit(0);
    }
    killProcesses();
  });
} else {
  killProcesses();
}

function killProcesses() {
  console.log('\n🔪 Killing processes...\n');

  allPids.forEach(pid => {
    if (isProcessRunning(pid)) {
      const command = exec(`ps -p ${pid} -o comm= 2>/dev/null`).trim() || 'unknown';
      if (killProcess(pid)) {
        console.log(`  ✅ Killed PID ${pid} (${command})`);
      } else {
        console.log(`  ⚠️  Failed to kill PID ${pid} (may require sudo)`);
      }
    }
  });

  // Wait a moment for processes to release locks
  setTimeout(() => {
    console.log('\n🔍 Verifying database is unlocked...\n');

    const remaining = getLockingProcesses();
    if (remaining.length > 0) {
      console.log('  ⚠️  Database may still be locked. Remaining processes:');
      remaining.forEach(p => {
        console.log(`    - PID: ${p.pid} | Command: ${p.command}`);
      });
      console.log('\n  💡 Try running with --force or manually kill remaining processes');
      process.exit(1);
    } else {
      console.log('  ✅ Database is now unlocked!');
      process.exit(0);
    }
  }, 1000);
}

