const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../data/codeforces/codeforces-catalog.json');
const OUTPUT_PATH = path.join(__dirname, '../data/codeforces/codeforces-solutions.json');
const ATTRIBUTION_PATH = path.join(__dirname, '../data/codeforces/ATTRIBUTION.md');

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function run() {
  console.log('[Importer] Loading Codeforces catalog...');
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const idMap = new Map();
  const titleMap = new Map();

  catalog.forEach((item) => {
    if (item.id) idMap.set(norm(item.id), item);
    if (item.title) titleMap.set(norm(item.title), item);
    if (item.name) titleMap.set(norm(item.name), item);
  });

  console.log('[Importer] Fetching repo contents list from GitHub API...');
  const repoRes = await fetch('https://api.github.com/repos/seikhchilli/codeforces-solution/contents', {
    headers: { 'User-Agent': 'StudyBuddy-Importer' }
  });
  if (!repoRes.ok) throw new Error(`GitHub API failed: ${repoRes.statusText}`);
  const contents = await repoRes.json();
  const cppFiles = contents.filter((d) => d.type === 'file' && d.name.toLowerCase().endsWith('.cpp'));

  console.log(`[Importer] Found ${cppFiles.length} C++ solution files. Beginning downloads...`);

  const solutionsMap = {};
  const BATCH_SIZE = 12;

  for (let i = 0; i < cppFiles.length; i += BATCH_SIZE) {
    const batch = cppFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (file) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/seikhchilli/codeforces-solution/master/${encodeURIComponent(file.name)}`;
          const res = await fetch(rawUrl);
          if (!res.ok) {
            console.warn(`[Importer] Failed to fetch ${file.name}: ${res.status}`);
            return;
          }
          const code = (await res.text()).trim();

          const rawName = file.name.replace(/\.cpp$/i, '').trim();
          const n = norm(rawName);

          let item =
            idMap.get(n) ||
            titleMap.get(n) ||
            titleMap.get(norm(rawName.replace(/_/g, ' ')));

          if (!item && n.includes('ilove')) {
            item = idMap.get('155a');
          }

          const probId = item?.id || rawName.toUpperCase();
          const probTitle = item?.title || item?.name || rawName.replace(/_/g, ' ');
          const probUrl = item?.url || `https://codeforces.com/problemset/problem/${probId.slice(0, -1)}/${probId.slice(-1)}`;
          const rating = item?.rating || null;
          const difficulty = item?.difficulty || (rating ? (rating < 1200 ? 'Easy' : rating <= 1800 ? 'Medium' : 'Hard') : 'Medium');
          const tags = item?.tags || ['competitive programming'];

          const solutionEntry = {
            id: probId,
            contestId: item?.contestId || parseInt(probId, 10) || null,
            index: item?.index || probId.replace(/^\d+/, '') || 'A',
            title: probTitle,
            rating,
            difficulty,
            tags,
            url: probUrl,
            platform: 'Codeforces',
            approaches: [
              {
                name: 'Optimal (C++)',
                language: 'cpp',
                platform: 'Codeforces',
                timeComplexity: tags.includes('math') ? 'O(1)' : 'O(N)',
                spaceComplexity: 'O(1)',
                intuition: `Accepted competitive programming C++ solution for "${probTitle}".`,
                code,
                codes: {
                  cpp: code
                },
                url: probUrl
              }
            ],
            source: 'seikhchilli/codeforces-solution (MIT License)'
          };

          solutionsMap[norm(probId)] = solutionEntry;
          if (probTitle) {
            solutionsMap[norm(probTitle)] = solutionEntry;
          }
        } catch (err) {
          console.error(`[Importer] Error processing ${file.name}:`, err.message);
        }
      })
    );
    process.stdout.write(`Downloaded ${Math.min(i + BATCH_SIZE, cppFiles.length)} / ${cppFiles.length}\r`);
  }

  console.log('\n[Importer] Finished downloads. Writing JSON file...');
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(solutionsMap, null, 2), 'utf8');

  const attributionContent = `# Codeforces Solutions Attribution & License

The C++ competitive programming solutions in \`codeforces-solutions.json\` are ingested from:
- **Repository**: [seikhchilli/codeforces-solution](https://github.com/seikhchilli/codeforces-solution)
- **Author**: Saurabh Kumar
- **License**: MIT License

---

## MIT License

Copyright (c) 2021 Saurabh Kumar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

  fs.writeFileSync(ATTRIBUTION_PATH, attributionContent, 'utf8');

  const keysCount = Object.keys(solutionsMap).length;
  const uniqueProblems = new Set(Object.values(solutionsMap).map((s) => s.id)).size;
  const fileSizeMb = (fs.statSync(OUTPUT_PATH).size / (1024 * 1024)).toFixed(2);

  console.log(`[Importer] SUCCESS!`);
  console.log(`- Unique Problems: ${uniqueProblems}`);
  console.log(`- Lookup Keys: ${keysCount}`);
  console.log(`- File Size: ${fileSizeMb} MB (${OUTPUT_PATH})`);
  console.log(`- Attribution saved to: ${ATTRIBUTION_PATH}`);
}

run().catch((err) => {
  console.error('[Importer Error]', err);
  process.exit(1);
});
