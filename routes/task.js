import express from 'express';

import { z } from 'zod';
import validate from 'express-zod-safe';
import { taskSchema } from '../libs/validate-schema.js';
import {
  achievedTask,
  addComment,
  addSubTask,
  createTask,
  deleteTask,
  getActivityByResourceId,
  getCommentsByTaskId,
  getMyTasks,
  getTaskById,
  updateSubTask,
  updateTaskAssignees,
  updateTaskDescription,
  updateTaskPriority,
  updateTaskStatus,
  updateTaskTitle,
  watchTask,
} from '../controllers/task.js';
import {
  authenticateUser,
  authorizeUser,
} from '../middleware/auth-middleware.js';

const router = express.Router();

router.post(
  '/:projectId/create-task',
  authenticateUser,
  validate({
    params: z.object({
      projectId: z.string(),
    }),
    body: taskSchema,
  }),
  createTask,
);

router.delete(
  '/:taskId',
  authenticateUser,
  authorizeUser,
  validate({
    params: z.object({ taskId: z.string() }),
  }),
  deleteTask,
);

router.post(
  '/:taskId/add-subtask',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string() }),
    body: z.object({ title: z.string() }),
  }),
  addSubTask,
);

router.post(
  '/:taskId/add-comment',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string() }),
    body: z.object({ text: z.string() }),
  }),
  addComment,
);

router.post(
  '/:taskId/watch',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string() }),
  }),
  watchTask,
);

router.post(
  '/:taskId/achieved',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string() }),
  }),
  achievedTask,
);

router.put(
  '/:taskId/update-subtask/:subTaskId',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string(), subTaskId: z.string() }),
    body: z.object({ completed: z.boolean() }),
  }),
  updateSubTask,
);

router.put(
  '/:taskId/title',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string() }),
    body: z.object({ title: z.string() }),
  }),
  updateTaskTitle,
);

router.put(
  '/:taskId/description',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string() }),
    body: z.object({ description: z.string() }),
  }),
  updateTaskDescription,
);

router.put(
  '/:taskId/status',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string() }),
    body: z.object({ status: z.string() }),
  }),
  updateTaskStatus,
);

router.put(
  '/:taskId/assignees',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string() }),
    body: z.object({ assignees: z.array(z.string()) }),
  }),
  updateTaskAssignees,
);

router.get('/my-tasks', authenticateUser, getMyTasks);

router.put(
  '/:taskId/priority',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string() }),
    body: z.object({ priority: z.string() }),
  }),
  updateTaskPriority,
);

router.get(
  '/:taskId',
  authenticateUser,
  validate({
    params: z.object({
      taskId: z.string(),
    }),
  }),
  getTaskById,
);

router.get(
  '/:resourceId/activity',
  authenticateUser,
  validate({
    params: z.object({ resourceId: z.string() }),
  }),
  getActivityByResourceId,
);

router.get(
  '/:taskId/comments',
  authenticateUser,
  validate({
    params: z.object({ taskId: z.string() }),
  }),
  getCommentsByTaskId,
);
export default router;
