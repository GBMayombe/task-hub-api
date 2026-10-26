import express from 'express';
import validate from 'express-zod-safe';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { createProject } from '../controllers/project.js';
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

export default router;
