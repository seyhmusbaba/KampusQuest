const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true
    },
    sender: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      username: { type: String, required: true },
      avatar: {
        color: String,
        emoji: String
      },
      level: Number
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true
    },
    type: {
      type: String,
      enum: ["text", "system", "xp_gain", "quest_complete"],
      default: "text"
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// TTL index — mesajlar 7 günde silinir
MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model("Message", MessageSchema);
