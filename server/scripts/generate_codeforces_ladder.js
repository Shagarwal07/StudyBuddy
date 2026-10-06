const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/codeforces/codeforces-solutions.json');
const CATALOG_PATH = path.join(__dirname, '../data/codeforces/codeforces-catalog.json');
const OUTPUT_PATH = path.join(__dirname, '../data/codeforces/codeforces-ladder.json');

const solutionsRaw = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
const catalogRaw = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

// Build lookup map from catalog
const catalogMap = new Map();
catalogRaw.forEach(item => {
  if (item.id) catalogMap.set(String(item.id).toUpperCase(), item);
});

// Extract unique 269 problems from solutions
const uniqueSolutions = new Map();
Object.values(solutionsRaw).forEach(sol => {
  if (sol && sol.id && !uniqueSolutions.has(sol.id.toUpperCase())) {
    uniqueSolutions.set(sol.id.toUpperCase(), sol);
  }
});

function determineModule(problem) {
  const rating = problem.rating || 800;
  const tags = (problem.tags || []).join(' ').toLowerCase();

  if (rating >= 1200) return 'Ladder 1200+: Div 2 Contest Mastery';
  if (rating >= 1100) return 'Ladder 1100: Advanced Greedy & Search';
  if (rating >= 1000) return 'Ladder 1000: Intermediate Patterns';
  if (rating >= 900) return 'Ladder 900: Elementary Problem Solving';
  
  // Rating 800 sub-modules
  if (tags.includes('string') || tags.includes('expression')) {
    return 'Ladder 800: Strings & Parsing';
  }
  if (tags.includes('math') || tags.includes('number theory')) {
    return 'Ladder 800: Math & Number Theory';
  }
  if (tags.includes('greedy') || tags.includes('sorting')) {
    return 'Ladder 800: Greedy & Sortings';
  }
  return 'Ladder 800: Implementation & Simulation';
}

function getDifficulty(rating) {
  if (rating < 1100) return 'Easy';
  if (rating < 1400) return 'Medium';
  return 'Hard';
}

const moduleOrder = [
  'Ladder 800: Implementation & Simulation',
  'Ladder 800: Math & Number Theory',
  'Ladder 800: Strings & Parsing',
  'Ladder 800: Greedy & Sortings',
  'Ladder 900: Elementary Problem Solving',
  'Ladder 1000: Intermediate Patterns',
  'Ladder 1100: Advanced Greedy & Search',
  'Ladder 1200+: Div 2 Contest Mastery'
];

const moduleBuckets = new Map();
moduleOrder.forEach(m => moduleBuckets.set(m, []));

// Sort problems by contestId and rating
const problemList = Array.from(uniqueSolutions.values()).sort((a, b) => {
  const rDiff = (a.rating || 800) - (b.rating || 800);
  if (rDiff !== 0) return rDiff;
  return (a.contestId || 0) - (b.contestId || 0);
});

let globalIdx = 1;
const flattenedProblems = [];

problemList.forEach(sol => {
  const catItem = catalogMap.get(sol.id.toUpperCase()) || {};
  const contestId = sol.contestId || catItem.contestId;
  const index = sol.index || catItem.index || 'A';
  const rating = sol.rating || catItem.rating || 800;
  const tags = sol.tags || catItem.tags || ['implementation'];
  const title = sol.title || catItem.title || sol.name || `Problem ${sol.id}`;
  const url = sol.url || (contestId ? `https://codeforces.com/problemset/problem/${contestId}/${index}` : '');
  const moduleName = determineModule({ rating, tags });

  const problemObj = {
    id: sol.id,
    number: String(globalIdx),
    title: title,
    module: moduleName,
    platform: 'Codeforces',
    platformUrl: url,
    questionUrl: url,
    solutionUrl: url,
    leetcodeDifficulty: getDifficulty(rating),
    rating: rating,
    tags: tags,
    hasNotes: true,
    key: title.toLowerCase().replace(/[^a-z0-9]/g, ''),
  };

  flattenedProblems.push(problemObj);
  moduleBuckets.get(moduleName).push(problemObj);
  globalIdx++;
});

const modulesArray = moduleOrder.map((modTitle, idx) => ({
  moduleId: `cf-ladder-mod-${idx + 1}`,
  moduleTitle: modTitle,
  items: moduleBuckets.get(modTitle) || [],
}));

const ladderData = {
  id: 'codeforces-ladder',
  sheetId: 'codeforces-ladder',
  title: 'Codeforces Ladder',
  slug: 'codeforces-ladder',
  description: 'Contest rating ladders (800–1600+) featuring 269 classic problems with accepted C++ solutions & 1-click judge forwarding.',
  category: 'Competitive Programming',
  badge: 'Contests',
  isOfficial: true,
  uploadedBy: 'Developer / Admin',
  sourceUrl: 'https://codeforces.com/problemset',
  lastSyncedAt: new Date().toISOString(),
  totalModules: modulesArray.length,
  totalItems: flattenedProblems.length,
  modules: modulesArray,
  problems: flattenedProblems,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(ladderData, null, 2), 'utf8');
console.log(`Successfully generated Codeforces Ladder at ${OUTPUT_PATH}`);
console.log(`Total Problems: ${flattenedProblems.length}, Total Modules: ${modulesArray.length}`);
modulesArray.forEach(m => console.log(`  - ${m.moduleTitle}: ${m.items.length} problems`));
