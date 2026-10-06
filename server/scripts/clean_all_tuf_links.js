const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dataDir = path.join(__dirname, '../data');

// 1. Files to sanitize
const jsonFiles = [
  'tuf/tuf-sde-180-mapped.json',
  'tuf/tuf-os-prep.json',
  'tuf/tuf-dbms-prep.json',
  'tuf/tuf-cn-prep.json',
  'tuf/tuf-non-leetcode-problems.json',
];

console.log('--- Cleaning JSON Files on Disk ---');
jsonFiles.forEach((rel) => {
  const full = path.join(dataDir, rel);
  if (!fs.existsSync(full)) {
    console.log(`Skipped (not found): ${rel}`);
    return;
  }

  const raw = fs.readFileSync(full, 'utf8');
  let data = JSON.parse(raw);
  let cleanedCount = 0;

  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (item && item.tufHref !== undefined) {
        delete item.tufHref;
        cleanedCount++;
      }
      if (item && typeof item.solutionUrl === 'string' && item.solutionUrl.includes('takeuforward.org')) {
        item.solutionUrl = '';
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    if (data.source && data.source.includes('takeUforward')) {
      data.source = 'StudyBuddy Curated';
    }
    if (data.sourceSlug) {
      data.sourceSlug = data.sourceSlug.replace(/^strivers-/, 'sde-');
    }

    if (Array.isArray(data.modules)) {
      data.modules.forEach((mod) => {
        if (Array.isArray(mod.items)) {
          mod.items.forEach((item) => {
            if (item && item.tufHref !== undefined) {
              delete item.tufHref;
              cleanedCount++;
            }
            if (item && typeof item.solutionUrl === 'string' && item.solutionUrl.includes('takeuforward.org')) {
              item.solutionUrl = '';
            }
          });
        }
      });
    } else {
      // Key-value problem map (e.g. tuf-non-leetcode-problems)
      Object.values(data).forEach((val) => {
        if (val && typeof val === 'object') {
          if (val.tufHref !== undefined) {
            delete val.tufHref;
            cleanedCount++;
          }
          if (typeof val.solutionUrl === 'string' && val.solutionUrl.includes('takeuforward.org')) {
            val.solutionUrl = '';
          }
        }
      });
    }
  }

  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Cleaned ${rel}: removed ${cleanedCount} tufHref fields.`);
});

// 2. Clean MongoDB GlobalSheet records
async function cleanDatabase() {
  if (!process.env.MONGO_URI) {
    console.log('No MONGO_URI, skipping DB cleanup.');
    process.exit(0);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected to MongoDB for sanitization.');
    const GlobalSheet = require('../models/GlobalSheet');

    const sheets = await GlobalSheet.find({});
    let dbUpdated = 0;

    for (const sheet of sheets) {
      let modified = false;
      if (sheet.sourceUrl && sheet.sourceUrl.includes('takeuforward.org')) {
        sheet.sourceUrl = '';
        modified = true;
      }
      (sheet.problems || []).forEach((p) => {
        if (p.solutionUrl && p.solutionUrl.includes('takeuforward.org')) {
          p.solutionUrl = '';
          modified = true;
        }
        if (p.platformUrl && p.platformUrl.includes('takeuforward.org')) {
          p.platformUrl = p.leetcodeUrl || '';
          modified = true;
        }
        if (p.questionUrl && p.questionUrl.includes('takeuforward.org')) {
          p.questionUrl = p.leetcodeUrl || '';
          modified = true;
        }
      });

      if (modified) {
        await sheet.save();
        dbUpdated++;
      }
    }

    console.log(`Sanitized ${dbUpdated} GlobalSheet documents in MongoDB.`);
    process.exit(0);
  } catch (err) {
    console.error('Database sanitization warning:', err.message);
    process.exit(0);
  }
}

cleanDatabase();
