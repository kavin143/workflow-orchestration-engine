
/**
 * One-time script that creates a demo tenant/user with one ready-made
 * sample workflow (already built and saved) and runs it once, so you can
 * log in and immediately see a real, working example instead of a blank
 * canvas.
 *
 * Run with: npm run seed:sample
 *
 * Safe to run more than once — it reuses the demo tenant/user/workflow if
 * they already exist instead of duplicating them.
 */
import type { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import {
  createTenantRegistration,
  findTenantBySlug,
  findUserByEmail,
} from "../repositories/auth.repository.js";
import { hashPassword } from "../utils/password.js";
import UserModel from "../models/user.model.js";
import { workflowRepository } from "../repositories/workflow.repository.js";
import type { Workflow } from "../models/workflow.model.js";
import { workflowService } from "../services/workflow.service.js";
import { executionService } from "../services/execution.service.js";
import { claimNextJob } from "../repositories/job.repository.js";
import { processJob } from "../engine/executor.js";
import type { WorkflowDefinition } from "../engine/types.js";

type WorkflowWithId = Workflow & { _id: Types.ObjectId };

const DEMO_TENANT_SLUG = "demo-workspace";
const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "DemoPass123!";
const SAMPLE_WORKFLOW_NAME = "Customer Onboarding (Sample)";

const SAMPLE_DEFINITION: WorkflowDefinition = {
  nodes: [
    { id: "start", type: "START", name: "start", position: { x: 40, y: 160 }, config: {} },
    {
      id: "createCustomer",
      type: "API_REQUEST",
      name: "createCustomer",
      position: { x: 260, y: 160 },
      config: { method: "GET", url: "https://httpbin.org/get" },
    },
    {
      id: "sendWelcomeEmail",
      type: "API_REQUEST",
      name: "sendWelcomeEmail",
      position: { x: 480, y: 160 },
      config: { method: "GET", url: "https://httpbin.org/get" },
    },
    {
      id: "checkVerification",
      type: "CONDITION",
      name: "checkVerification",
      position: { x: 700, y: 160 },
      config: { expression: "{{createCustomer.status}} == 200" },
    },
    { id: "completed", type: "END", name: "Completed", position: { x: 940, y: 60 }, config: {} },
    {
      id: "waitBeforeRetry",
      type: "DELAY",
      name: "Wait before retry",
      position: { x: 940, y: 260 },
      config: { ms: 2000 },
    },
    { id: "needsFollowUp", type: "END", name: "Needs follow-up", position: { x: 1160, y: 260 }, config: {} },
  ],
  edges: [
    { id: "e1", source: "start", target: "createCustomer" },
    { id: "e2", source: "createCustomer", target: "sendWelcomeEmail" },
    { id: "e3", source: "sendWelcomeEmail", target: "checkVerification" },
    { id: "e4", source: "checkVerification", target: "completed", sourceHandle: "yes" },
    { id: "e5", source: "checkVerification", target: "waitBeforeRetry", sourceHandle: "no" },
    { id: "e6", source: "waitBeforeRetry", target: "needsFollowUp" },
  ],
};

async function drainJobQueue(): Promise<void> {
  for (;;) {
    const job = await claimNextJob();

    if (!job) {
      break;
    }

    await processJob(job);
  }
}

async function seedSampleWorkflow(): Promise<void> {
  await connectDatabase();

  try {
    let tenantId: string;
    let userId: string;

    const existingTenant = await findTenantBySlug(DEMO_TENANT_SLUG);

    if (existingTenant) {
      tenantId = existingTenant._id.toString();

      const passwordHash = await hashPassword(DEMO_PASSWORD);
      const existingUser = await findUserByEmail(DEMO_EMAIL);

      if (!existingUser) {
        // The tenant survived but its user is gone (e.g. deleted via the
        // admin panel). Recreate it under the existing tenant instead of
        // aborting, so re-running this script always gets you back to a
        // working demo login.
        const createdUser = await UserModel.create({
          firstName: "Demo",
          lastName: "User",
          email: DEMO_EMAIL,
          passwordHash,
          tenantId: existingTenant._id,
          status: "ACTIVE",
        });

        userId = createdUser._id.toString();
        console.info(`Demo user "${DEMO_EMAIL}" was missing. Recreated it.`);
      } else {
        // Reset the password and re-activate the account every run, so
        // the demo login always works even if it was changed or disabled.
        await UserModel.updateOne(
          { _id: existingUser._id },
          { $set: { passwordHash, status: "ACTIVE" } },
        );

        userId = existingUser._id.toString();
        console.info(`Reusing existing demo tenant "${DEMO_TENANT_SLUG}" (password reset).`);
      }
    } else {
      const passwordHash = await hashPassword(DEMO_PASSWORD);

      const registration = await createTenantRegistration({
        tenantName: "Demo Workspace",
        tenantSlug: DEMO_TENANT_SLUG,
        firstName: "Demo",
        lastName: "User",
        email: DEMO_EMAIL,
        passwordHash,
      });

      tenantId = registration.tenant._id.toString();
      userId = registration.user._id.toString();
      console.info(`Created demo tenant "${DEMO_TENANT_SLUG}".`);
    }

    const existingWorkflows = await workflowRepository.list({
      tenantId,
      search: SAMPLE_WORKFLOW_NAME,
      page: 1,
      limit: 1,
    });

    let workflowId: string;

    if (existingWorkflows.items.length > 0) {
      workflowId = (existingWorkflows.items[0] as WorkflowWithId)._id.toString();
      console.info(`Sample workflow already exists (id ${workflowId}). Skipping creation.`);
    } else {
      const workflow = await workflowRepository.create({
        tenantId,
        createdBy: userId,
        name: SAMPLE_WORKFLOW_NAME,
        description:
          "A ready-made example: fetch a customer, send a welcome email, check verification, then branch to Completed or a delayed follow-up.",
      });

      workflowId = (workflow as WorkflowWithId)._id.toString();

      await workflowService.saveDefinition(tenantId, workflowId, SAMPLE_DEFINITION);
      await workflowRepository.update(tenantId, workflowId, { status: "ACTIVE" });

      console.info(`Created sample workflow "${SAMPLE_WORKFLOW_NAME}" (id ${workflowId}).`);

      console.info("Running the sample workflow once so there's an example execution...");
      const execution = await executionService.run(tenantId, userId, workflowId);
      await drainJobQueue();
      console.info(`Sample execution created and processed (id ${execution._id.toString()}).`);
    }

    console.info("");
    console.info("Log in to the app with:");
    console.info(`  Email:    ${DEMO_EMAIL}`);
    console.info(`  Password: ${DEMO_PASSWORD}`);
  } finally {
    await disconnectDatabase();
  }
}

seedSampleWorkflow().catch((error: unknown) => {
  console.error("Failed to seed sample workflow:", error);
  process.exitCode = 1;
});
