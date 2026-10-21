
import { Schema, model, Types } from "mongoose";

/**
 * Supported user account statuses.
 *
 * ACTIVE:
 * The account is enabled. Authentication logic must still verify
 * the user's credentials and account status.
 *
 * DISABLED:
 * The account is disabled and must not be allowed to authenticate.
 */
export const USER_STATUSES = ["ACTIVE", "DISABLED"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

/**
 * Supported gender values for a user's optional profile information.
 *
 * This field is optional so users are not required to provide
 * personal information that may not be necessary for the product.
 */
export const USER_GENDERS = [
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

export type UserGender = (typeof USER_GENDERS)[number];

/**
 * TypeScript representation of a user document.
 *
 * Each user belongs to exactly one tenant.
 * Passwords must be stored as secure hashes, never as plaintext.
 *
 * Mongoose manages createdAt and updatedAt automatically because
 * timestamps are enabled in the schema.
 */
export interface User {
  /** User's first name. */
  firstName: string;

  /** User's last name. */
  lastName: string;

  /** Normalized email address used to identify the account. */
  email: string;

  /** Secure password hash; never store the original password. */
  passwordHash: string;

  /** Tenant to which this user belongs. */
  tenantId: Types.ObjectId;

  /** Optional gender information supplied by the user. */
  gender?: UserGender;

  /** Optional date of birth supplied by the user. */
  dateOfBirth?: Date;

  /** Current account status. */
  status: UserStatus;

  /** Date and time when the document was created. */
  createdAt: Date;

  /** Date and time when the document was last updated. */
  updatedAt: Date;
}

/**
 * Mongoose schema for user documents.
 *
 * Schema validation protects writes made through Mongoose.
 * API request validation must also be performed separately.
 */
const userSchema = new Schema<User>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must contain at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [1, "Last name must contain at least 1 character"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
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

      // MongoDB enforces uniqueness through the generated index.
      unique: true,
    },

    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],

      // Exclude the hash from ordinary Mongoose query results.
      // Authentication code must explicitly select it when needed.
      select: false,
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      required: [true, "Tenant ID is required"],
      index: true,

      // A user's tenant assignment cannot be changed through
      // ordinary Mongoose document updates.
      immutable: true,
    },

    gender: {
      type: String,
      enum: {
        values: USER_GENDERS,
        message: "Invalid gender value",
      },
      required: false,
    },

    dateOfBirth: {
      type: Date,
      required: false,
      validate: {
        validator: (value: Date | null | undefined) =>
          value == null || value.getTime() <= Date.now(),
        message: "Date of birth cannot be in the future",
      },
    },

    status: {
      type: String,
      enum: {
        values: USER_STATUSES,
        message: "Invalid user account status",
      },
      default: "ACTIVE",
      required: true,
    },
  },
  {
    // Automatically maintain createdAt and updatedAt.
    timestamps: true,

    // Reject undefined fields rather than silently accepting
    // unexpected properties in Mongoose document writes.
    strict: "throw",
  },
);

/**
 * Mongoose model used by repositories and services to interact
 * with the users collection.
 */
const UserModel = model<User>("User", userSchema);

export default UserModel;
