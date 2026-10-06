const mongoose = require("mongoose");

const UserCodingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    solvedProblemKeys: {
      type: [String],
      default: [],
    },
    starredProblemKeys: {
      type: [String],
      default: [],
    },
    activeSheets: {
      type: [String],
      default: [],
    },
    customSheets: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: "" },
        sourceUrl: { type: String, default: "" },
        lastSyncedAt: { type: Date, default: null },
        problems: [
          {
            id: String,
            number: String,
            title: String,
            module: String,
            platform: { type: String, default: "" },
            platformUrl: { type: String, default: "" },
            leetcodeId: String,
            leetcodeDifficulty: String,
            leetcodeUrl: String,
            questionUrl: { type: String, default: "" },
            solutionUrl: { type: String, default: "" },
            instructorUrl: { type: String, default: "" },
            hasNotes: { type: Boolean, default: false },
            key: String,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserCodingProgress", UserCodingProgressSchema);
