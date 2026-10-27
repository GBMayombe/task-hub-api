import express from 'express';
import { authenticateUser } from '../middleware/auth-middleware.js';
import {
  changePassword,
  getUserProfile,
  updateUserProfile,
} from '../controllers/user.js';
import { z } from 'zod';
import validate from 'express-zod-safe';

const router = express.Router();

router.get('/profile', authenticateUser, getUserProfile);
router.put(
  '/profile',
  authenticateUser,
  validate({
    body: z.object({
      name: z.string(),
      profilePicture: z.string().optional(),
    }),
  }),
  updateUserProfile,
);

router.put(
  '/change-password',
  authenticateUser,
  validate({
    body: z.object({
      currentPassword: z.string(),
      newPassword: z.string(),
      confirmPassword: z.string(),
    }),
  }),
  changePassword,
);

export default router;
