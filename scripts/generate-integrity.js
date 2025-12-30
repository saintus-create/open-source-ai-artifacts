#!/usr/bin/env node

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Worker } = require('worker_threads');
const os = require('os');

const templatesDir = path.join(__dirname, '..', 'sandbox-templates');

/**
 * Get all files in a directory recursively (async)
 */
async function getAllFiles(dirPath, arrayOfFiles = []) {
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

  return arrayOfFiles;
}

/**
 * Compute hash for a single file using streams for better memory efficiency
 */
async function computeHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fsSync.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Process a single template directory
 */
async function processTemplate(template) {
  const templatePath = path.join(templatesDir, template);
  const files = (await getAllFiles(templatePath)).sort(); // sort for consistent order
  const hashSum = crypto.createHash('sha256');

  // Process files sequentially for hash consistency
  for (const file of files) {
    const fileHash = await computeHash(file);
    hashSum.update(fileHash);
  }

  return { template, hash: hashSum.digest('hex') };
}

/**
 * Generate integrity hashes for all templates with parallel processing
 */
async function generateIntegrity() {
  try {
    const templatesDirStat = await fs.stat(templatesDir);
    if (!templatesDirStat.isDirectory()) {
      throw new Error(`${templatesDir} is not a directory`);
    }

    const items = await fs.readdir(templatesDir);
    const templates = [];

    // Filter to get only directories
    await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(templatesDir, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          templates.push(item);
        }
      })
    );

    // Process all templates in parallel for maximum throughput
    const cpuCount = os.cpus().length;
    const chunkSize = Math.ceil(templates.length / cpuCount);
    const templateChunks = [];
    
    for (let i = 0; i < templates.length; i += chunkSize) {
      templateChunks.push(templates.slice(i, i + chunkSize));
    }

    // Process chunks in parallel
    const results = await Promise.all(
      templates.map(template => processTemplate(template))
    );

    // Build integrity object
    const integrity = {};
    results.forEach(({ template, hash }) => {
      integrity[template] = hash;
    });

    console.log(JSON.stringify(integrity, null, 2));
  } catch (error) {
    console.error('Error generating integrity:', error);
    process.exit(1);
  }
}

generateIntegrity();