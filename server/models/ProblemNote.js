const mongoose = require("mongoose");

const ProblemNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problemKey: {
      type: String,
      required: true,
      index: true,
    },
    problemTitle: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

ProblemNoteSchema.index({ userId: 1, problemKey: 1 }, { unique: true });

module.exports = mongoose.model("ProblemNote", ProblemNoteSchema);
