import mongoose from "mongoose";

const { Schema } = mongoose;

const jwtSchema = Schema(
  {
    userId: { type: String, requried: true },
    token: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("RefreshToken", jwtSchema, "token");
