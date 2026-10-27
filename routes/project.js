import express from 'express';
import validate from 'express-zod-safe';
import { authMiddleware } from '../middleware/auth-middleware.js';
import {
  createProject,
  getProjectTasks,
  getProjectDetails,
} from '../controllers/project.js';
import { projectSchema } from '../libs/validate-schema.js';
import { z } from 'zod';

const router = express.Router();

router.post(
  '/:workspaceId/create-project',
  authMiddleware,
  validate({
    params: z.object({ workspaceId: z.string() }),
    body: projectSchema,
  }),
  createProject,
);

router.get(
  '/:projectId',
  authMiddleware,
  validate({
    params: z.object({ projectId: z.string() }),
  }),
  getProjectDetails,
);

router.get(
  '/:projectId/tasks',
  authMiddleware,
  validate({ params: z.object({ projectId: z.string() }) }),
  getProjectTasks,
);

export default router;
