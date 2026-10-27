import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Invalid email address').nonempty('Email is required'),
  password: z.string().nonempty('Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    ),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const emailSchema = z.object({
  email: z.email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().nonempty('Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    ),
  confirmPassword: z.string(),
});

export const workspaceSchema = z.object({
  name: z.string().nonempty('Name is required'),
  description: z.string().optional(),
  color: z.string().nonempty('Color is required'),
});

export const projectSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  status: z.enum([
    'Planning',
    'In Progress',
    'On Hold',
    'Completed',
    'Cancelled',
  ]),
  startDate: z.string(),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
  members: z
    .array(
      z.object({
        user: z.string(),
        role: z.enum(['manager', 'contributor', 'viewer']),
      }),
    )
    .optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['To Do', 'In Progress', 'Done']),
  priority: z.enum(['Low', 'Medium', 'High']),
  dueDate: z.string().min(1, 'Due date is required'),
  assignees: z.array(z.string()).min(1, 'At least one assignee is required'),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']),
});

export const tokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});
