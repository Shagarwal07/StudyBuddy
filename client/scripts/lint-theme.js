import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');
const baselineFile = path.resolve(__dirname, 'theme-baseline.json');

const EXEMPT_FILES = new Set([
  path.resolve(srcDir, 'styles/theme.css'),
  path.resolve(srcDir, 'index.css'),
]);

const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

// Raw color matchers
const HEX_REGEX = /#(?:[0-9a-fA-F]{3,8})\b/g;
const RGB_REGEX = /\brgba?\s*\([^)]*\)/g;
const HSL_REGEX = /\bhsla?\s*\([^)]*\)/g;
const ARBITRARY_COLOR_REGEX = /\b(?:bg|text|border|ring|fill|stroke)-\[#(?:[0-9a-fA-F]{3,8})\]/g;

// Tailwind classes (with optional dark: prefix)
const TW_PALETTE_REGEX = /\b(dark:)?(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)(?:\/[0-9]+)?\b/g;
const BLACK_WHITE_REGEX = /\b(dark:)?(?:bg|text|border|ring|fill|stroke)-(?:black|white)(?:\/[0-9]+)?\b/g;

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (EXTENSIONS.has(path.extname(fullPath))) {
      results.push(fullPath);
    }
  }
  return results;
}

function isStrictFile(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  return norm.includes('/src/components/web/');
}

function isPairedClass(classListStr, cls) {
  const isDark = cls.startsWith('dark:');
  const baseName = isDark ? cls.slice(5) : cls;
  const prefix = baseName.split('-')[0];

  if (isDark) {
    const regex = new RegExp(`\\b(?<!dark:)${prefix}-[a-zA-Z0-9_/]+`, 'g');
    return regex.test(classListStr);
  } else {
    const regex = new RegExp(`\\bdark:${prefix}-[a-zA-Z0-9_/]+`, 'g');
    return regex.test(classListStr);
  }
}

function stripComments(content) {
  // Replace multi-line comments with spaces preserving newlines
  let res = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    return match.replace(/[^\n]/g, ' ');
  });
  // Replace single-line comments with spaces
  res = res.replace(/\/\/.*$/gm, (match) => {
    return ' '.repeat(match.length);
  });
  return res;
}

function lintFile(filePath) {
  if (EXEMPT_FILES.has(filePath)) {
    return { strictIssues: [], basicIssues: [] };
  }

  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const content = stripComments(rawContent);
  const lines = content.split('\n');
  const rawLines = rawContent.split('\n');
  const strictIssues = [];
  const basicIssues = [];
  const isEntirelyStrict = isStrictFile(filePath);

  let braceDepth = 0;
  let webBlockDepth = null;
  let basicBlockDepth = null;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const rawLine = rawLines[index];

    // Track block scope
    if (line.includes('if (isWeb)') || line.includes('if (skin === "web")') || line.includes("if (skin === 'web')")) {
      webBlockDepth = braceDepth + 1;
    } else if (line.includes('if (!isWeb)') || line.includes('if (skin !== "web")') || line.includes("if (skin !== 'web')")) {
      basicBlockDepth = braceDepth + 1;
    }

    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceDepth += openBraces - closeBraces;

    if (webBlockDepth !== null && braceDepth < webBlockDepth) {
      webBlockDepth = null;
    }
    if (basicBlockDepth !== null && braceDepth < basicBlockDepth) {
      basicBlockDepth = null;
    }

    const isInWebBlock = webBlockDepth !== null;
    const isInBasicBlock = basicBlockDepth !== null;

    // Filter out common SVG false positives
    const cleanedLine = line
      .replace(/url\(#[a-zA-Z0-9_-]+\)/g, '')
      .replace(/id=["'][a-zA-Z0-9_-]+["']/g, '')
      .replace(/href=["']#["']/g, '')
      .replace(/stopColor="white"/g, '');

    const hexMatches = cleanedLine.match(HEX_REGEX) || [];
    const rgbMatches = cleanedLine.match(RGB_REGEX) || [];
    const hslMatches = cleanedLine.match(HSL_REGEX) || [];
    const arbMatches = cleanedLine.match(ARBITRARY_COLOR_REGEX) || [];
    const twMatches = cleanedLine.match(TW_PALETTE_REGEX) || [];
    const bwMatches = cleanedLine.match(BLACK_WHITE_REGEX) || [];

    const rawColorTokens = [
      ...hexMatches.map((m) => ({ type: 'hex', match: m })),
      ...rgbMatches.map((m) => ({ type: 'rgb', match: m })),
      ...hslMatches.map((m) => ({ type: 'hsl', match: m })),
      ...arbMatches.map((m) => ({ type: 'arbitrary-bracket', match: m })),
    ];

    // 1. Fully strict file (e.g. src/components/web/**)
    if (isEntirelyStrict) {
      // In web component files, if there's an if (!isWeb) branch, that branch is basic
      if (isInBasicBlock) {
        // basic branch
        return;
      }
      for (const item of rawColorTokens) {
        strictIssues.push({ line: lineNum, type: item.type, match: item.match, text: rawLine.trim() });
      }
      for (const cls of [...twMatches, ...bwMatches]) {
        strictIssues.push({ line: lineNum, type: 'tailwind-in-web', match: cls, text: rawLine.trim() });
      }
      return;
    }

    // 2. Inside a guarded web block: if (isWeb) { ... }
    if (isInWebBlock) {
      for (const item of rawColorTokens) {
        strictIssues.push({ line: lineNum, type: item.type, match: item.match, text: rawLine.trim() });
      }
      for (const cls of [...twMatches, ...bwMatches]) {
        strictIssues.push({ line: lineNum, type: 'tailwind-in-web', match: cls, text: rawLine.trim() });
      }
      return;
    }

    // 3. Line with isWeb ternary: isWeb ? (web) : (basic) OR !isWeb ? (basic) : (web)
    const hasIsWeb = line.includes('isWeb ?') || line.includes('isWeb?');
    const hasNotIsWeb = line.includes('!isWeb ?') || line.includes('!isWeb?');

    if (hasIsWeb || hasNotIsWeb) {
      const parts = line.split(/\?|:/);
      let webPart = '';
      let basicPart = '';

      if (hasIsWeb && parts.length >= 3) {
        webPart = parts[1] || '';
        basicPart = parts.slice(2).join(':') || '';
      } else if (hasNotIsWeb && parts.length >= 3) {
        basicPart = parts[1] || '';
        webPart = parts.slice(2).join(':') || '';
      }

      // Audit web branch strictly
      const webHex = webPart.match(HEX_REGEX) || [];
      const webRgb = webPart.match(RGB_REGEX) || [];
      const webArb = webPart.match(ARBITRARY_COLOR_REGEX) || [];
      const webTw = [...(webPart.match(TW_PALETTE_REGEX) || []), ...(webPart.match(BLACK_WHITE_REGEX) || [])];

      for (const m of [...webHex, ...webRgb, ...webArb, ...webTw]) {
        strictIssues.push({ line: lineNum, type: 'web-branch-raw-color', match: m, text: rawLine.trim() });
      }

      // Audit basic branch with pairing allowance
      for (const cls of (basicPart.match(TW_PALETTE_REGEX) || [])) {
        if (!isPairedClass(basicPart, cls)) {
          basicIssues.push({ line: lineNum, type: 'unpaired-tailwind', match: cls, text: rawLine.trim() });
        }
      }
      for (const cls of (basicPart.match(BLACK_WHITE_REGEX) || [])) {
        if (!isPairedClass(basicPart, cls)) {
          basicIssues.push({ line: lineNum, type: 'unpaired-black-white', match: cls, text: rawLine.trim() });
        }
      }
      for (const item of (basicPart.match(HEX_REGEX) || [])) {
        basicIssues.push({ line: lineNum, type: 'basic-hex', match: item, text: rawLine.trim() });
      }
      return;
    }

    // 4. Regular basic code line:
    for (const item of rawColorTokens) {
      basicIssues.push({ line: lineNum, type: item.type, match: item.match, text: rawLine.trim() });
    }
    for (const cls of twMatches) {
      if (!isPairedClass(cleanedLine, cls)) {
        basicIssues.push({ line: lineNum, type: 'unpaired-tailwind', match: cls, text: rawLine.trim() });
      }
    }
    for (const cls of bwMatches) {
      if (!isPairedClass(cleanedLine, cls)) {
        basicIssues.push({ line: lineNum, type: 'unpaired-black-white', match: cls, text: rawLine.trim() });
      }
    }
  });

  return { strictIssues, basicIssues };
}

function run() {
  const isUpdateBaseline = process.argv.includes('--update-baseline');
  console.log('====================================================');
  console.log('     THEME LINTER: Strict Mode + Baseline Audit     ');
  console.log('====================================================\n');

  const allFiles = getFiles(srcDir);
  let existingBaseline = {};
  if (fs.existsSync(baselineFile)) {
    try {
      existingBaseline = JSON.parse(fs.readFileSync(baselineFile, 'utf-8'));
    } catch (e) {
      existingBaseline = {};
    }
  }

  const currentCounts = {};
  let totalStrictViolations = 0;
  const filesWithStrictIssues = {};
  const regressedFiles = [];

  for (const file of allFiles) {
    const relPath = path.relative(path.resolve(srcDir, '..'), file).replace(/\\/g, '/');
    const { strictIssues, basicIssues } = lintFile(file);

    if (strictIssues.length > 0) {
      filesWithStrictIssues[relPath] = strictIssues;
      totalStrictViolations += strictIssues.length;
    }

    currentCounts[relPath] = basicIssues.length;

    const baseCount = existingBaseline[relPath] !== undefined ? existingBaseline[relPath] : 0;
    if (basicIssues.length > baseCount && !isUpdateBaseline && Object.keys(existingBaseline).length > 0) {
      regressedFiles.push({ file: relPath, current: basicIssues.length, baseline: baseCount });
    }
  }

  if (isUpdateBaseline || !fs.existsSync(baselineFile)) {
    fs.writeFileSync(baselineFile, JSON.stringify(currentCounts, null, 2));
    console.log(`✓ Baseline updated/saved to ${path.relative(process.cwd(), baselineFile)}\n`);
  }

  // 1. Report Strict Mode Violations
  console.log(`[STRICT MODE AUDIT] (src/components/web/** and isWeb branches):`);
  if (totalStrictViolations === 0) {
    console.log(`  ✓ 0 strict-mode violations! Web skin code paths are 100% token-clean.\n`);
  } else {
    console.log(`  ✗ Found ${totalStrictViolations} strict-mode violation(s):`);
    for (const [relPath, issues] of Object.entries(filesWithStrictIssues)) {
      console.log(`    --- ${relPath} (${issues.length} violation(s)) ---`);
      for (const issue of issues.slice(0, 10)) {
        console.log(`      L${issue.line} [${issue.type}] ${issue.match} => ${issue.text.slice(0, 75)}`);
      }
      if (issues.length > 10) {
        console.log(`      ... and ${issues.length - 10} more`);
      }
    }
    console.log('');
  }

  // 2. Report Baseline Status
  console.log(`[BASELINE AUDIT] (Basic code unpaired styling):`);
  if (regressedFiles.length > 0) {
    console.log(`  ✗ REGRESSION DETECTED: ${regressedFiles.length} file(s) exceeded baseline:`);
    for (const r of regressedFiles) {
      console.log(`    - ${r.file}: ${r.current} (baseline: ${r.baseline}, +${r.current - r.baseline})`);
    }
    console.log('');
  } else {
    console.log(`  ✓ All files within baseline thresholds. No basic styling regressions.\n`);
  }

  if (totalStrictViolations > 0 || regressedFiles.length > 0) {
    console.log('====================================================');
    console.log('LINT FAILED');
    console.log('====================================================');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('LINT PASSED: Web skin is pure & basic styling within baseline.');
  console.log('====================================================');
  process.exit(0);
}

run();
