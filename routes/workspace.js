import express from 'express';
import validate from 'express-zod-safe';
import { workspaceSchema } from '../libs/validate-schema.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceDetails,
  getWorkspaceProjects,
} from '../controllers/workspace.js';

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  validate({ body: workspaceSchema }),
  createWorkspace,
);

router.get('/', authMiddleware, getWorkspaces);

router.get('/:workspaceId', authMiddleware, getWorkspaceDetails);
router.get('/:workspaceId/projects', authMiddleware, getWorkspaceProjects);
// router.get("/:workspaceId/stats", authMiddleware, getWorkspaceStats);

export default router;
