import { z } from 'zod';
import express from 'express';
import validate from 'express-zod-safe';
import {
  inviteMemberSchema,
  workspaceSchema,
  tokenSchema,
} from '../libs/validate-schema.js';
import {
  authenticateUser,
  authorizeUser,
} from '../middleware/auth-middleware.js';
import {
  acceptGenerateInvite,
  acceptInviteByToken,
  createWorkspace,
  getWorkspaceDetails,
  getWorkspaceProjects,
  getWorkspaces,
  getWorkspaceStats,
  inviteUserToWorkspace,
  deleteWorkspace,
} from '../controllers/workspace.js';

const router = express.Router();

router.post(
  '/',
  authenticateUser,
  authorizeUser,
  validate({ body: workspaceSchema }),
  createWorkspace,
);

router.post(
  '/accept-invite-token',
  authenticateUser,
  validate({ body: tokenSchema }),
  acceptInviteByToken,
);

router.post(
  '/:workspaceId/invite-member',
  authenticateUser,
  validate({
    params: z.object({ workspaceId: z.string() }),
    body: inviteMemberSchema,
  }),
  inviteUserToWorkspace,
);

router.post(
  '/:workspaceId/accept-generate-invite',
  authenticateUser,
  validate({ params: z.object({ workspaceId: z.string() }) }),
  acceptGenerateInvite,
);

router.delete(
  '/:workspaceId',
  authenticateUser,
  authorizeUser,
  validate({
    params: z.object({ workspaceId: z.string() }),
  }),
  deleteWorkspace,
);

router.get('/', authenticateUser, getWorkspaces);

router.get('/:workspaceId', authenticateUser, getWorkspaceDetails);
router.get('/:workspaceId/projects', authenticateUser, getWorkspaceProjects);
router.get('/:workspaceId/stats', authenticateUser, getWorkspaceStats);

export default router;
