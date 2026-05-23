#!/usr/bin/env node
/**
 * Kill process running on port 9000
 * Works cross-platform (Windows, Linux, macOS)
 */

const { execSync } = require('child_process');

const PORT = 9000;

try {
  if (process.platform === 'win32') {
    // Windows
    try {
      const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });
      const lines = output.trim().split('\n');

      const pids = new Set();
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          pids.add(pid);
        }
      });

      if (pids.size > 0) {
        pids.forEach(pid => {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`✅ Killed process ${pid} on port ${PORT}`);
          } catch (err) {
            // Process might already be dead
          }
        });
      } else {
        console.log(`✓ Port ${PORT} is free`);
      }
    } catch (err) {
      // No process found on port
      console.log(`✓ Port ${PORT} is free`);
    }
  } else {
    // Linux/macOS
    try {
      const output = execSync(`lsof -ti:${PORT}`, { encoding: 'utf8' });
      const pids = output.trim().split('\n').filter(Boolean);

      if (pids.length > 0) {
        pids.forEach(pid => {
          try {
            execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            console.log(`✅ Killed process ${pid} on port ${PORT}`);
          } catch (err) {
            // Process might already be dead
          }
        });
      } else {
        console.log(`✓ Port ${PORT} is free`);
      }
    } catch (err) {
      // No process found on port
      console.log(`✓ Port ${PORT} is free`);
    }
  }
} catch (error) {
  console.error('Error killing port:', error.message);
  process.exit(0); // Don't fail the build
}
