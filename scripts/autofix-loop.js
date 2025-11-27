#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const filePath = process.argv[2];
if (!filePath || !filePath.trim()) {
    process.exit(0);
}

const MAX_ITERATIONS = 10;
const TIMEOUT_MS = 15000; // 15 seconds per iteration

let iteration = 0;
let hadIssues = false;

console.log(`\x1b[36m[Autofixer] Starting purity ritual for ${path.basename(filePath)}\x1b[0m`);

main: do {
    iteration++;

    if (iteration > MAX_ITERATIONS) {
        console.error(`\x1b[31m[Autofixer] Maximum iterations (${MAX_ITERATIONS}) exceeded — possible divergent rule. Aborting.\x1b[0m`);
        break;
    }

    let output = '';

    try {
        output = execSync(`node ./autofixer "${filePath}"`, {
            encoding: 'utf-8',
            timeout: TIMEOUT_MS,
        }).trim();
    } catch (error) {
        output = error.stdout?.toString().trim() || '';
    }

    if (output) {
        hadIssues = true;
        console.log(`\x1b[33m[Autofixer] Iteration ${iteration}: issues detected\x1b[0m`);

        try {
            execSync(`node ./autofixer --apply "${filePath}"`, {
                stdio: 'inherit',
                timeout: TIMEOUT_MS,
            });
        } catch (applyError) {
            console.error('\x1b[31m[Autofixer] Automatic application failed. Manual intervention required.\x1b[0m');
            break main;
        }
    } else {
        // No output → clean
        if (hadIssues) {
            console.log(`\x1b[32m[Autofixer] ✓ ${path.basename(filePath)} has achieved ceremonial purity.\x1b[0m`);
        }
        break main;
    }
} while (true);
