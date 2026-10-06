const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GlobalSheet = require('../models/GlobalSheet');

async function seed() {
  const ladderPath = path.join(__dirname, '../data/codeforces/codeforces-ladder.json');
  if (!fs.existsSync(ladderPath)) {
    console.error('codeforces-ladder.json not found');
    process.exit(1);
  }

  const ladderData = JSON.parse(fs.readFileSync(ladderPath, 'utf8'));

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected to MongoDB');

    const updated = await GlobalSheet.findOneAndUpdate(
      { id: 'codeforces-ladder' },
      {
        $set: {
          id: 'codeforces-ladder',
          title: ladderData.title,
          slug: 'codeforces-ladder',
          description: ladderData.description,
          category: ladderData.category,
          badge: ladderData.badge,
          sourceUrl: ladderData.sourceUrl,
          isOfficial: true,
          uploadedBy: ladderData.uploadedBy,
          lastSyncedAt: new Date(),
          problems: ladderData.problems,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`GlobalSheet 'codeforces-ladder' successfully seeded with ${updated.problems.length} problems!`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding to MongoDB:', err.message);
    process.exit(0); // non-fatal because server also has file-based fallback
  }
}

seed();
