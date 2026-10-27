import { z } from 'zod';
import express from 'express';
import validate from 'express-zod-safe';
import {
  inviteMemberSchema,
  workspaceSchema,
  tokenSchema,
} from '../libs/validate-schema.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import {
  acceptGenerateInvite,
  acceptInviteByToken,
  createWorkspace,
  getWorkspaceDetails,
  getWorkspaceProjects,
  getWorkspaces,
  getWorkspaceStats,
  inviteUserToWorkspace,
} from '../controllers/workspace.js';

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  validate({ body: workspaceSchema }),
  createWorkspace,
);

router.post(
  '/accept-invite-token',
  authMiddleware,
  validate({ body: tokenSchema }),
  acceptInviteByToken,
);

router.post(
  '/:workspaceId/invite-member',
  authMiddleware,
  validate({
    params: z.object({ workspaceId: z.string() }),
    body: inviteMemberSchema,
  }),
  inviteUserToWorkspace,
);

router.post(
  '/:workspaceId/accept-generate-invite',
  authMiddleware,
  validate({ params: z.object({ workspaceId: z.string() }) }),
  acceptGenerateInvite,
);

router.get('/', authMiddleware, getWorkspaces);

router.get('/:workspaceId', authMiddleware, getWorkspaceDetails);
router.get('/:workspaceId/projects', authMiddleware, getWorkspaceProjects);
router.get('/:workspaceId/stats', authMiddleware, getWorkspaceStats);

export default router;
