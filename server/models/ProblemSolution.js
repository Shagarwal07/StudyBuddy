const mongoose = require("mongoose");

const ProblemSolutionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    slug: { type: String, index: true },
    title: { type: String, required: true },
    platform: { type: String, default: "LeetCode" },
    platformUrl: { type: String, default: "" },
    problemStatement: { type: String, default: "" },
    constraints: [{ type: String }],
    examples: { type: String, default: "" },
    testCases: [
      {
        id: { type: Number },
        input: { type: String },
        expectedOutput: { type: String },
        explanation: { type: String },
      },
    ],
    approaches: [
      {
        name: { type: String, default: "Optimal" },
        isLeetCode: { type: Boolean, default: false },
        isTuf: { type: Boolean, default: false },
        isCodeforces: { type: Boolean, default: false },
        timeComplexity: { type: String, default: "O(N)" },
        spaceComplexity: { type: String, default: "O(1)" },
        intuition: { type: String, default: "" },
        code: { type: String, default: "" },
        codes: {
          java: { type: String, default: "" },
          cpp: { type: String, default: "" },
          python: { type: String, default: "" },
          javascript: { type: String, default: "" },
        },
        url: { type: String },
      },
    ],
    defaultCode: { type: String, default: "" },
    aliases: [{ type: String, index: true }],
  },
  {
    timestamps: true,
  }
);

ProblemSolutionSchema.index({ key: 1, slug: 1 });

module.exports = mongoose.model("ProblemSolution", ProblemSolutionSchema);
