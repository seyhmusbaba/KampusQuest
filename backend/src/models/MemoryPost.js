const mongoose = require("mongoose");

const MemoryPostSchema = new mongoose.Schema({
  locationId: { type:String, required:true, index:true },
  author: {
    userId:   mongoose.Schema.Types.ObjectId,
    username: String,
    avatar:   { color:String, emoji:String },
    faculty:  String,
    graduationYear: Number,
  },
  content:  { type:String, required:true, maxlength:280 },
  mood:     { type:String, enum:["😊","😂","🥺","🔥","💯","🎓","💪","❤️"], default:"😊" },
  likes:    [{ type:mongoose.Schema.Types.ObjectId, ref:"User" }],
  isPinned: { type:Boolean, default:false },
}, { timestamps:true });

module.exports = mongoose.model("MemoryPost", MemoryPostSchema);
