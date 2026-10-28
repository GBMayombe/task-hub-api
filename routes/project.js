import express from 'express';
import validate from 'express-zod-safe';
import {
  authenticateUser,
  authorizeUser,
} from '../middleware/auth-middleware.js';
import {
  createProject,
  getProjectTasks,
  getProjectDetails,
  deleteProject,
} from '../controllers/project.js';
import { projectSchema } from '../libs/validate-schema.js';
import { z } from 'zod';

const router = express.Router();

router.post(
  '/:workspaceId/create-project',
  authenticateUser,
  validate({
    params: z.object({ workspaceId: z.string() }),
    body: projectSchema,
  }),
  createProject,
);

router.delete(
  '/:projectId',
  authenticateUser,
  authorizeUser,
  validate({
    params: z.object({ projectId: z.string() }),
  }),
  deleteProject,
);

router.get(
  '/:projectId',
  authenticateUser,
  validate({
    params: z.object({ projectId: z.string() }),
  }),
  getProjectDetails,
);

router.get(
  '/:projectId/tasks',
  authenticateUser,
  validate({ params: z.object({ projectId: z.string() }) }),
  getProjectTasks,
);

export default router;
