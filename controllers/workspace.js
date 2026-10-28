import Workspace from '../models/workspace.js';
import WorkspaceInvite from '../models/workspace-invite.js';
import Project from '../models/project.js';
import User from '../models/user.js';

import jwt from 'jsonwebtoken';
import { sendEmail } from '../libs/send-email.js';
import { recordActivity } from '../libs/index.js';

export const createWorkspace = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    const workspace = await Workspace.create({
      name,
      description,
      color,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: 'Workspace not found',
      });
    }

    const projects = await Project.find({ workspace: workspaceId }).select(
      '_id tasks',
    );

    const projectIds = projects.map((project) => project._id);
    const taskIds = projects.flatMap((project) => project.tasks);

    await Promise.all([
      Task.deleteMany({
        $or: [{ _id: { $in: taskIds } }, { project: { $in: projectIds } }],
      }),
      Project.deleteMany({ workspace: workspaceId }),
      Workspace.findByIdAndDelete(workspaceId),
    ]);

    return res.status(200).json({
      message:
        'Workspace and its associated projects and tasks deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json(workspaces);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const getWorkspaceDetails = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById({
      _id: workspaceId,
    }).populate('members.user', 'name email profilePicture');

    if (!workspace) {
      return res.status(404).json({
        message: 'Workspace not found',
      });
    }

    res.status(200).json(workspace);
  } catch (error) {}
};

export const getWorkspaceProjects = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      'members.user': req.user._id,
    }).populate('members.user', 'name email profilePicture');

    if (!workspace) {
      return res.status(404).json({
        message: 'Workspace not found',
      });
    }

    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: false,
      members: { $elemMatch: { user: req.user._id } },
    })
      .populate('tasks', 'status')
      .sort({ createdAt: -1 });

    res.status(200).json({ projects, workspace });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const getWorkspaceStats = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: 'Workspace not found',
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: 'You are not a member of this workspace',
      });
    }

    // Get workspace projects and their tasks
    const [totalProjects, projects] = await Promise.all([
      Project.countDocuments({ workspace: workspaceId }),
      Project.find({ workspace: workspaceId })
        .populate(
          'tasks',
          'title status dueDate project updatedAt isArchived priority',
        )
        .sort({ createdAt: -1 }),
    ]);

    // Total tasks
    const totalTasks = projects.reduce(
      (total, project) => total + project.tasks.length,
      0,
    );

    // Project statistics
    const totalProjectInProgress = projects.filter(
      (project) => project.status === 'In Progress',
    ).length;

    // Flatten tasks from workspace projects
    const tasks = projects.flatMap((project) => project.tasks);

    // Task statistics
    const totalTaskCompleted = tasks.filter(
      (task) => task.status === 'Done',
    ).length;

    const totalTaskToDo = tasks.filter(
      (task) => task.status === 'To Do',
    ).length;

    const totalTaskInProgress = tasks.filter(
      (task) => task.status === 'In Progress',
    ).length;

    // Upcoming tasks due within the next 7 days
    const today = new Date();
    const nextSevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;

      const taskDate = new Date(task.dueDate);

      return taskDate > today && taskDate <= nextSevenDays;
    });

    // Task trends for the last 7 days, including today
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const taskTrendsData = last7Days.map((date) => ({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: 0,
      inProgress: 0,
      toDo: 0,
    }));

    for (const task of tasks) {
      if (!task.updatedAt) continue;

      const taskDate = new Date(task.updatedAt);
      taskDate.setHours(0, 0, 0, 0);

      const dayIndex = last7Days.findIndex(
        (date) => date.getTime() === taskDate.getTime(),
      );

      if (dayIndex === -1) continue;

      switch (task.status) {
        case 'Done':
          taskTrendsData[dayIndex].completed++;
          break;
        case 'In Progress':
          taskTrendsData[dayIndex].inProgress++;
          break;
        case 'To Do':
          taskTrendsData[dayIndex].toDo++;
          break;
      }
    }

    // Project status distribution for this workspace
    const projectStatusColors = {
      Completed: '#10b981',
      'In Progress': '#3b82f6',
      Planning: '#f59e0b',
      'On Hold': '#f97316',
      Cancelled: '#ef4444',
    };

    const projectStatusCounts = projects.reduce(
      (counts, project) => {
        if (Object.hasOwn(counts, project.status)) {
          counts[project.status]++;
        }

        return counts;
      },
      {
        Completed: 0,
        'In Progress': 0,
        Planning: 0,
        'On Hold': 0,
        Cancelled: 0,
      },
    );

    const projectStatusData = Object.entries(projectStatusCounts).map(
      ([name, value]) => ({
        name,
        value,
        color: projectStatusColors[name],
      }),
    );

    // Task priority distribution
    const taskPriorityColors = {
      High: '#ef4444',
      Medium: '#f59e0b',
      Low: '#6b7280',
    };

    const taskPriorityCounts = tasks.reduce(
      (counts, task) => {
        if (Object.hasOwn(counts, task.priority)) {
          counts[task.priority]++;
        }

        return counts;
      },
      {
        High: 0,
        Medium: 0,
        Low: 0,
      },
    );

    const taskPriorityData = Object.entries(taskPriorityCounts).map(
      ([name, value]) => ({
        name,
        value,
        color: taskPriorityColors[name],
      }),
    );

    // Workspace productivity per project
    const workspaceProductivityData = projects.map((project) => {
      const projectTasks = project.tasks;

      const completedTasks = projectTasks.filter(
        (task) => task.status === 'Done' && !task.isArchived,
      );

      return {
        name: project.title,
        completed: completedTasks.length,
        total: projectTasks.length,
      };
    });

    // Summary statistics
    const stats = {
      totalProjects,
      totalTasks,
      totalProjectInProgress,
      totalTaskCompleted,
      totalTaskToDo,
      totalTaskInProgress,
    };

    return res.status(200).json({
      stats,
      taskTrendsData,
      projectStatusData,
      taskPriorityData,
      workspaceProductivityData,
      upcomingTasks,
      recentProjects: projects.slice(0, 5),
    });
  } catch (error) {
    console.error('Error fetching workspace stats:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const inviteUserToWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: 'Workspace not found',
      });
    }

    const userMemberInfo = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!userMemberInfo || !['admin', 'owner'].includes(userMemberInfo.role)) {
      return res.status(403).json({
        message: 'You are not authorized to invite members to this workspace',
      });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(400).json({
        message: 'User not found',
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === existingUser._id.toString(),
    );

    if (isMember) {
      return res.status(400).json({
        message: 'User already a member of this workspace',
      });
    }

    const isInvited = await WorkspaceInvite.findOne({
      user: existingUser._id,
      workspaceId: workspaceId,
    });

    if (isInvited && isInvited.expiresAt > new Date()) {
      return res.status(400).json({
        message: 'User already invited to this workspace',
      });
    }

    if (isInvited && isInvited.expiresAt < new Date()) {
      await WorkspaceInvite.deleteOne({ _id: isInvited._id });
    }

    const inviteToken = jwt.sign(
      {
        user: existingUser._id,
        workspaceId: workspaceId,
        role: role || 'member',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    await WorkspaceInvite.create({
      user: existingUser._id,
      workspaceId: workspaceId,
      token: inviteToken,
      role: role || 'member',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const invitationLink = `${process.env.FRONTEND_URL}/workspace-invite/${workspace._id}?tk=${inviteToken}`;

    const emailContent = `
      <p>You have been invited to join ${workspace.name} workspace</p>
      <p>Click here to join: <a href="${invitationLink}">${invitationLink}</a></p>
    `;

    await sendEmail(
      email,
      'You have been invited to join a workspace',
      emailContent,
    );

    res.status(200).json({
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const acceptGenerateInvite = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: 'Workspace not found',
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (isMember) {
      return res.status(400).json({
        message: 'You are already a member of this workspace',
      });
    }

    workspace.members.push({
      user: req.user._id,
      role: 'member',
      joinedAt: new Date(),
    });

    await workspace.save();

    await recordActivity(
      req.user._id,
      'joined_workspace',
      'Workspace',
      workspaceId,
      {
        description: `Joined ${workspace.name} workspace`,
      },
    );

    res.status(200).json({
      message: 'Invitation accepted successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const acceptInviteByToken = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { user, workspaceId, role } = decoded;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: 'Workspace not found',
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === user.toString(),
    );

    if (isMember) {
      return res.status(400).json({
        message: 'User already a member of this workspace',
      });
    }

    const inviteInfo = await WorkspaceInvite.findOne({
      user,
      workspaceId,
      token,
    });

    if (!inviteInfo) {
      return res.status(404).json({
        message: 'Invitation not found',
      });
    }

    if (inviteInfo.expiresAt < new Date()) {
      return res.status(400).json({
        message: 'Invitation has expired',
      });
    }

    // Add the user to the workspace.
    workspace.members.push({
      user,
      role: role || 'member',
      joinedAt: new Date(),
    });

    await workspace.save();

    // Find all projects referencing this workspace.
    const projects = await Project.find({
      workspace: workspace._id,
    });

    // Add the user to every project, avoiding duplicates.
    await Promise.all(
      projects.map(async (project) => {
        const isProjectMember = project.members.some(
          (member) => member.user.toString() === user.toString(),
        );

        if (!isProjectMember) {
          project.members.push({
            user,
            role: role === 'viewer' ? 'viewer' : 'contributor',
          });

          await project.save();
        }
      }),
    );

    await Promise.all([
      WorkspaceInvite.deleteOne({ _id: inviteInfo._id }),
      recordActivity(user, 'joined_workspace', 'Workspace', workspaceId, {
        description: `Joined ${workspace.name} workspace`,
      }),
    ]);

    return res.status(200).json({
      message: 'Invitation accepted successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
