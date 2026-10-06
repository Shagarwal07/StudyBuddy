const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GlobalSheet = require('../models/GlobalSheet');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseLeetcodeSlug(url) {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/problems\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : '';
}

async function run() {
  console.log('--- Fetching NeetCode 150 & Striver A2Z ---');

  // 1. Fetch NeetCode 150
  console.log('Downloading NeetCode 150 raw data...');
  const neetcodeRaw = await fetchUrl(
    'https://raw.githubusercontent.com/krmanik/Anki-NeetCode/main/neetcode-150-list.json'
  );
  const neetcodeParsed = JSON.parse(neetcodeRaw);

  const neetcodeModules = [];
  const neetcodeProblems = [];
  let ncGlobalIdx = 1;

  for (const [moduleTitle, problemsObj] of Object.entries(neetcodeParsed)) {
    const items = [];
    for (const [title, details] of Object.entries(problemsObj)) {
      const lcUrl = details.url || '';
      const lcSlug = parseLeetcodeSlug(lcUrl);
      const diff = details.difficulty || 'Medium';

      const probItem = {
        id: `nc-${ncGlobalIdx}`,
        number: String(ncGlobalIdx),
        title: title.trim(),
        module: moduleTitle,
        platform: 'LeetCode',
        platformUrl: lcUrl || details.nurl || '',
        leetcodeSlug: lcSlug,
        leetcodeDifficulty: diff,
        leetcodeUrl: lcUrl,
        questionUrl: lcUrl || details.nurl || '',
        solutionUrl: details.nurl || '',
        hasNotes: true,
        key: title.trim().toLowerCase(),
      };

      items.push(probItem);
      neetcodeProblems.push(probItem);
      ncGlobalIdx++;
    }

    neetcodeModules.push({
      moduleId: `nc-mod-${neetcodeModules.length + 1}`,
      moduleTitle,
      items,
    });
  }

  const neetcodeData = {
    source: 'NeetCode.io Curated 150',
    sheetName: 'NeetCode 150',
    sourceSlug: 'neetcode-150',
    totalModules: neetcodeModules.length,
    totalItems: neetcodeProblems.length,
    modules: neetcodeModules,
  };

  const neetcodeDir = path.join(__dirname, '../data/neetcode');
  if (!fs.existsSync(neetcodeDir)) fs.mkdirSync(neetcodeDir, { recursive: true });
  fs.writeFileSync(
    path.join(neetcodeDir, 'neetcode-150.json'),
    JSON.stringify(neetcodeData, null, 2),
    'utf8'
  );
  console.log(`Saved neetcode-150.json with ${neetcodeProblems.length} problems across ${neetcodeModules.length} modules!`);

  // 2. Fetch Striver A2Z 455
  console.log('Downloading Striver A2Z raw data...');
  const striverRaw = await fetchUrl(
    'https://raw.githubusercontent.com/hitarth-gg/CP/main/striver-a2z.json'
  );
  const striverParsed = JSON.parse(striverRaw);

  const a2zModules = [];
  const a2zProblems = [];
  let a2zGlobalIdx = 1;

  striverParsed.forEach((step, sIdx) => {
    const stepTitle = `Step ${step.step_no}: ${step.step_title}`;
    const items = [];

    (step.sub_steps || []).forEach((subStep) => {
      (subStep.topics || []).forEach((topic) => {
        const qTitle = (topic.question_title || '').trim();
        if (!qTitle) return;

        let diff = 'Medium';
        if (topic.difficulty === 0 || topic.difficulty === 1) diff = 'Easy';
        else if (topic.difficulty === 2) diff = 'Medium';
        else if (topic.difficulty >= 3) diff = 'Hard';

        const lcUrl = topic.lc_link || '';
        const solUrl = topic.post_link || topic.editorial_link || topic.yt_link || '';
        const lcSlug = parseLeetcodeSlug(lcUrl);

        const probItem = {
          id: `a2z-${a2zGlobalIdx}`,
          number: String(a2zGlobalIdx),
          title: qTitle,
          module: stepTitle,
          subModule: subStep.sub_step_title || '',
          platform: lcUrl ? 'LeetCode' : 'takeUforward',
          platformUrl: lcUrl || topic.plus_link || solUrl || '',
          leetcodeSlug: lcSlug,
          leetcodeDifficulty: diff,
          leetcodeUrl: lcUrl,
          questionUrl: lcUrl || topic.plus_link || '',
          solutionUrl: solUrl,
          instructorUrl: topic.yt_link || '',
          hasNotes: Boolean(solUrl || topic.yt_link),
          key: qTitle.toLowerCase(),
        };

        items.push(probItem);
        a2zProblems.push(probItem);
        a2zGlobalIdx++;
      });
    });

    if (items.length > 0) {
      a2zModules.push({
        moduleId: `a2z-step-${sIdx + 1}`,
        moduleTitle: stepTitle,
        items,
      });
    }
  });

  const a2zData = {
    source: 'takeUforward Striver A2Z DSA',
    sheetName: "Striver's A2Z DSA Sheet",
    sourceSlug: 'strivers-a2z',
    totalModules: a2zModules.length,
    totalItems: a2zProblems.length,
    modules: a2zModules,
  };

  const tufDir = path.join(__dirname, '../data/tuf');
  fs.writeFileSync(
    path.join(tufDir, 'tuf-strivers-a2z.json'),
    JSON.stringify(a2zData, null, 2),
    'utf8'
  );
  console.log(`Saved tuf-strivers-a2z.json with ${a2zProblems.length} problems across ${a2zModules.length} steps!`);

  // 3. Connect to MongoDB and seed GlobalSheet records
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/studybuddy';
    console.log('Connecting to MongoDB at:', mongoUri.replace(/\/\/.*@/, '//<credentials>@'));
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected to MongoDB successfully.');

    // Seed NeetCode 150
    await GlobalSheet.findOneAndUpdate(
      { id: 'neetcode-150' },
      {
        $set: {
          id: 'neetcode-150',
          title: 'NeetCode 150',
          description:
            'The classic 150 LeetCode interview questions curated by NeetCode covering every core coding pattern across 18 modules.',
          category: 'DSA Patterns',
          group: 'dsa',
          badge: 'Popular',
          sourceUrl: 'https://neetcode.io/practice',
          isOfficial: true,
          uploadedBy: {
            name: 'Developer / Admin',
            role: 'admin',
          },
          lastSyncedAt: new Date(),
          problems: neetcodeProblems,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('GlobalSheet neetcode-150 seeded in MongoDB!');

    // Seed Striver A2Z
    await GlobalSheet.findOneAndUpdate(
      { id: 'strivers-a2z' },
      {
        $set: {
          id: 'strivers-a2z',
          title: "Striver's A2Z DSA Sheet",
          description:
            'The comprehensive 455 roadmap from basics, sorting, arrays, and recursion to trees, graphs, and dynamic programming by takeUforward.',
          category: 'DSA Patterns',
          group: 'dsa',
          badge: 'Comprehensive',
          sourceUrl: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/',
          isOfficial: true,
          uploadedBy: {
            name: 'Developer / Admin',
            role: 'admin',
          },
          lastSyncedAt: new Date(),
          problems: a2zProblems,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('GlobalSheet strivers-a2z seeded in MongoDB!');

    console.log('--- SEEDING COMPLETE ---');
    process.exit(0);
  } catch (dbErr) {
    console.warn('MongoDB connection failed or skipped:', dbErr.message);
    console.log('Files are saved locally and will function via file cache fallback.');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
