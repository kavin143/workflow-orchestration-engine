
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
const SAMPLE_WORKFLOW_NAME = "Live Weather Alert";

/**
 * A real, working workflow that needs no API keys:
 *   1. geocode a city name (Open-Meteo geocoding API)
 *   2. fetch the live temperature for those coordinates (Open-Meteo forecast API)
 *   3. POST a summary to an echo service (httpbin) using values from steps 1-2
 *   4. branch on the live temperature: heat alert vs. normal
 */
const SAMPLE_DEFINITION: WorkflowDefinition = {
  nodes: [
    { id: "start", type: "START", name: "start", position: { x: 40, y: 200 }, config: {} },
    {
      id: "geocodeCity",
      type: "API_REQUEST",
      name: "geocodeCity",
      position: { x: 270, y: 200 },
      config: {
        method: "GET",
        url: "https://geocoding-api.open-meteo.com/v1/search?name=Chennai&count=1",
      },
    },
    {
      id: "fetchWeather",
      type: "API_REQUEST",
      name: "fetchWeather",
      position: { x: 500, y: 200 },
      config: {
        method: "GET",
        url: "https://api.open-meteo.com/v1/forecast?latitude={{geocodeCity.body.results.0.latitude}}&longitude={{geocodeCity.body.results.0.longitude}}&current=temperature_2m,relative_humidity_2m,wind_speed_10m",
      },
    },
    {
      id: "sendReport",
      type: "API_REQUEST",
      name: "sendReport",
      position: { x: 730, y: 200 },
      config: {
        method: "POST",
        url: "https://httpbin.org/post",
        body: '{"city":"{{geocodeCity.body.results.0.name}}","temperatureC":{{fetchWeather.body.current.temperature_2m}},"humidity":{{fetchWeather.body.current.relative_humidity_2m}}}',
      },
    },
    {
      id: "checkHeat",
      type: "CONDITION",
      name: "checkHeat",
      position: { x: 960, y: 200 },
      config: { expression: "{{fetchWeather.body.current.temperature_2m}} >= 30" },
    },
    { id: "heatAlert", type: "END", name: "Heat alert raised", position: { x: 1230, y: 70 }, config: {} },
    {
      id: "coolDown",
      type: "DELAY",
      name: "coolDown",
      position: { x: 1230, y: 330 },
      config: { ms: 2000 },
    },
    { id: "allClear", type: "END", name: "Weather normal", position: { x: 1460, y: 330 }, config: {} },
  ],
  edges: [
    { id: "e1", source: "start", target: "geocodeCity" },
    { id: "e2", source: "geocodeCity", target: "fetchWeather" },
    { id: "e3", source: "fetchWeather", target: "sendReport" },
    { id: "e4", source: "sendReport", target: "checkHeat" },
    { id: "e5", source: "checkHeat", target: "heatAlert", sourceHandle: "yes" },
    { id: "e6", source: "checkHeat", target: "coolDown", sourceHandle: "no" },
    { id: "e7", source: "coolDown", target: "allClear" },
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
          "Real workflow, no API keys: geocode a city, fetch its live temperature from Open-Meteo, post a report, then branch on a heat threshold.",
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
