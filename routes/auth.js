import { z } from 'zod';
import express from 'express';
import validate from 'express-zod-safe';
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  emailSchema,
} from '../libs/validate-schema.js';
import {
  loginUser,
  verifyEmail,
  registerUser,
  resetPasswordRequest,
  resetPassword,
} from '../controllers/auth-controller.js';

const router = express.Router();

router.post('/register', validate({ body: registerSchema }), registerUser);
router.post('/login', validate({ body: loginSchema }), loginUser);

router.post(
  '/verify-email',
  validate({ body: verifyEmailSchema }),
  verifyEmail,
);

router.post(
  '/reset-password-request',
  validate({ body: emailSchema }),
  resetPasswordRequest,
);

router.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  resetPassword,
);

export default router;
