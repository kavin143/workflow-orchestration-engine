
import { Schema, model } from "mongoose";

/**
 * Supported tenant account statuses.
 *
 * ACTIVE:
 * The tenant is enabled.
 *
 * DISABLED:
 * The tenant has been disabled and its users must not be
 * allowed to access tenant-protected resources.
 */
export const TENANT_STATUSES = ["ACTIVE", "DISABLED"] as const;

export type TenantStatus = (typeof TENANT_STATUSES)[number];

/**
 * TypeScript representation of a tenant document.
 *
 * A tenant represents an isolated workspace or organization
 * within the Workflow Orchestration Engine.
 *
 * Each tenant can have multiple users, workflows, and executions.
 * Every tenant-owned resource must be scoped to its tenant.
 */
export interface Tenant {
  /** Display name of the workspace or organization. */
  name: string;

  /** URL-friendly identifier for the tenant. */
  slug: string;

  /** Current tenant account status. */
  status: TenantStatus;

  /** Date and time when the tenant was created. */
  createdAt: Date;

  /** Date and time when the tenant was last updated. */
  updatedAt: Date;
}

/**
 * Mongoose schema for tenant documents.
 *
 * Schema validation protects writes performed through Mongoose.
 * Request-level validation must also be applied by the API.
 */
const tenantSchema = new Schema<Tenant>(
  {
    name: {
      type: String,
      required: [true, "Tenant name is required"],
      trim: true,
      minlength: [2, "Tenant name must contain at least 2 characters"],
      maxlength: [100, "Tenant name cannot exceed 100 characters"],
    },

    slug: {
      type: String,
      required: [true, "Tenant slug is required"],
      trim: true,
      lowercase: true,
      minlength: [2, "Tenant slug must contain at least 2 characters"],
      maxlength: [100, "Tenant slug cannot exceed 100 characters"],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Tenant slug must contain only lowercase letters, numbers, and hyphens",
      ],
      // MongoDB enforces uniqueness through this index.
      unique: true,
    },

    status: {
      type: String,
      enum: {
        values: TENANT_STATUSES,
        message: "Invalid tenant status",
      },
      default: "ACTIVE",
      required: true,
    },
  },
  {
    // Automatically maintain createdAt and updatedAt.
    timestamps: true,

    // Reject fields not defined in this schema.
    strict: "throw",
  },
);

/**
 * Mongoose model used by repositories and services to manage tenants.
 */
const TenantModel = model<Tenant>("Tenant", tenantSchema);

export default TenantModel;
