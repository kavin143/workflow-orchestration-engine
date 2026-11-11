
import { Schema, model } from "mongoose";

/**
 * TypeScript representation of a platform admin document.
 *
 * An admin is independent of any tenant and can view and manage
 * users across every tenant in the system.
 */
export interface Admin {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<Admin>(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
      minlength: [2, "Admin name must contain at least 2 characters"],
      maxlength: [100, "Admin name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      unique: true,
    },

    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

const AdminModel = model<Admin>("Admin", adminSchema);

export default AdminModel;
