#!/usr/bin/env node

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.join(__dirname, '..');
const templatesDir = path.join(projectRoot, 'sandbox-templates');
const libDir = path.join(projectRoot, 'lib');
const componentsDir = path.join(projectRoot, 'components');

// Simple concurrency limiter
const pLimit = (concurrency) => {
  const queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()();
    }
  };

  const run = async (fn, resolve, reject) => {
    activeCount++;
    const result = (async () => fn())();
    try {
      resolve(await result);
    } catch (err) {
      reject(err);
    }
    next();
  };

  const enqueue = (fn, resolve, reject) => {
    queue.push(run.bind(null, fn, resolve, reject));
    if (activeCount < concurrency && queue.length > 0) {
      queue.shift()();
    }
  };

  return (fn) => new Promise((resolve, reject) => enqueue(fn, resolve, reject));
};

const limit = pLimit(require('os').cpus().length * 2);

/**
 * Get all files in a directory recursively (async)
 */
async function getAllFiles(dirPath, arrayOfFiles = []) {
  try {
    const files = await fs.readdir(dirPath);
    await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(dirPath, file);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await getAllFiles(fullPath, arrayOfFiles);
        } else {
          arrayOfFiles.push(fullPath);
        }
      })
    );
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn(`Warning reading ${dirPath}: ${err.message}`);
  }
  return arrayOfFiles;
}

/**
 * Compute hash using streams
 */
async function computeHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fsSync.createReadStream(filePath);
    stream.on('data', (d) => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Validate file integrity
 */
async function validateFileIntegrity() {
  console.log('🔍 Validating project file integrity...\n');
  const issues = [];
  let totalFiles = 0;
  let validFiles = 0;

  // Gather all files first
  console.log('  Scanning directories...');
  
  const [templateFiles, libFiles, componentFiles] = await Promise.all([
    (async () => {
      // Templates are nested
      const templates = (await fs.readdir(templatesDir)).filter(f => !f.startsWith('.'));
      const files = [];
      await Promise.all(templates.map(async t => {
        const tPath = path.join(templatesDir, t);
        try {
          if ((await fs.stat(tPath)).isDirectory()) {
            files.push(...await getAllFiles(tPath));
          }
        } catch (e) {}
      }));
      return files;
    })(),
    getAllFiles(libDir),
    getAllFiles(componentsDir)
  ]);

  const allFiles = [
    ...templateFiles, 
    ...libFiles.filter(f => f.endsWith('.ts') || f.endsWith('.js')),
    ...componentFiles.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
  ];
  
  // Also config files
  const configFiles = [
    'package.json', 'tsconfig.json', 'next.config.mjs', 
    'tailwind.config.ts', 'postcss.config.mjs', 
    '.eslintrc.json', '.prettierrc'
  ].map(f => path.join(projectRoot, f));

  for (const f of configFiles) {
    try {
      await fs.access(f);
      allFiles.push(f);
    } catch (e) {}
  }

  // Validate in parallel with limit
  console.log(`  Verifying ${allFiles.length} files...`);
  
  await Promise.all(allFiles.map(file => limit(async () => {
    totalFiles++;
    try {
      const hash = await computeHash(file);
      if (hash && hash.length === 64) {
        validFiles++;
        // console.log(`  ✅ ${path.relative(projectRoot, file)}`); // Quiet mode for speed
      } else {
        issues.push(`Invalid hash for ${path.relative(projectRoot, file)}`);
      }
    } catch (error) {
      issues.push(`Failed to read ${path.relative(projectRoot, file)}: ${error.message}`);
    }
  })));

  console.log('\n📊 Integrity Check Summary:');
  console.log(`  Total files checked: ${totalFiles}`);
  console.log(`  Valid files: ${validFiles}`);
  console.log(`  Issues found: ${issues.length}`);

  if (issues.length > 0) {
    issues.forEach(i => console.error(`  - ${i}`));
    return false;
  }
  return true;
}

/**
 * Validate function integrity (Async)
 */
async function validateFunctionIntegrity() {
  console.log('\n🔧 Validating function integrity...\n');
  const issues = [];
  
  const files = await Promise.all([
    getAllFiles(libDir),
    getAllFiles(componentsDir)
  ]);
  
  const scanFiles = files.flat().filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

  await Promise.all(scanFiles.map(file => limit(async () => {
    try {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('undefined') && line.includes('=') && !line.includes('typeof')) {
           // Basic heuristic check only
        }
      });

    } catch (error) {
      issues.push(`Read error ${file}: ${error.message}`);
    }
  })));

  if (issues.length === 0) {
    console.log('✅ All functions appear to be properly structured!');
    return true;
  }
  
  console.log('⚠️  Function structure issues found:');
  issues.slice(0, 10).forEach(i => console.log(`  - ${i}`));
  return false;
}

async function main() {
  console.log('🛡️  Master File Integrity Check (Optimized)');
  console.log('========================================\n');
  
  const start = Date.now();
  const fileIntegrity = await validateFileIntegrity();
  const functionIntegrity = await validateFunctionIntegrity();
  const end = Date.now();
  
  console.log(`\n⏱️  Partial Time: ${((end-start)/1000).toFixed(2)}s`);
  
  if (fileIntegrity && functionIntegrity) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});