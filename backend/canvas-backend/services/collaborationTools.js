/**
 * COLLABORATION TOOLS — Team management, threads, tasks, approvals
 * DB models: TeamMember, CommentThread, ReviewComment, TaskItem, ApprovalRequest
 */

import prisma from '../lib/prisma.js';

export const COLLABORATION_TOOL_DEFINITIONS = [
  {
    name: 'team_invite',
    description: 'Invite team members, list team, update roles, remove members.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['invite', 'list', 'remove', 'update'], description: 'Operation' },
        email:     { type: 'string', description: 'Member email (for invite)' },
        memberId:  { type: 'string', description: 'Team member ID' },
        role:      { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'], description: 'Role' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'role_assign',
    description: 'Assign or update roles and permissions for project collaborators.',
    input_schema: {
      type: 'object',
      properties: {
        memberId:    { type: 'string', description: 'Team member ID' },
        role:        { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'], description: 'New role' },
        permissions: { type: 'array', description: 'Custom permission keys', items: { type: 'string' } },
      },
      required: ['memberId', 'role'],
    },
  },
  {
    name: 'comment_thread',
    description: 'Create and manage comment threads on code, files, or canvas elements.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['create', 'reply', 'resolve', 'list', 'delete'], description: 'Operation' },
        threadId:  { type: 'string', description: 'Thread ID (for reply/resolve/delete)' },
        body:      { type: 'string', description: 'Comment body' },
        target:    { type: 'object', description: '{ type, id, line } — what the comment is about' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'task_assign',
    description: 'Create, assign, and manage tasks within a project.',
    input_schema: {
      type: 'object',
      properties: {
        operation:  { type: 'string', enum: ['create', 'assign', 'update', 'complete', 'list', 'delete'], description: 'Operation' },
        taskId:     { type: 'string', description: 'Task ID' },
        title:      { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        assigneeId: { type: 'string', description: 'User ID to assign to' },
        priority:   { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority' },
        dueDate:    { type: 'string', description: 'Due date ISO string' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'approval_flow',
    description: 'Create and manage approval workflows for deployments, reviews, or changes.',
    input_schema: {
      type: 'object',
      properties: {
        operation:   { type: 'string', enum: ['create', 'approve', 'reject', 'list', 'get'], description: 'Operation' },
        approvalId:  { type: 'string', description: 'Approval request ID' },
        title:       { type: 'string', description: 'Approval title' },
        description: { type: 'string', description: 'What needs approval' },
        approvers:   { type: 'array', description: 'List of approver user IDs', items: { type: 'string' } },
        comment:     { type: 'string', description: 'Comment for approve/reject' },
      },
      required: ['operation'],
    },
  },
];

export async function executeCollaborationTool(toolName, input, ctx = {}) {
  const userId = ctx.userId || 'anonymous';
  const projectId = ctx.projectId || ctx.slug || 'default';
  try {
    switch (toolName) {

      case 'team_invite': {
        switch (input.operation) {
          case 'invite': {
            const member = await prisma.teamMember.create({
              data: { projectId, userId: input.email, email: input.email, role: input.role || 'viewer', invitedBy: userId, status: 'pending' },
            });
            return { result: JSON.stringify({ status: 'success', memberId: member.id, email: member.email, role: member.role }) };
          }
          case 'list': {
            const members = await prisma.teamMember.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } });
            return { result: JSON.stringify({ status: 'success', count: members.length, members: members.map(m => ({ id: m.id, email: m.email, role: m.role, status: m.status })) }) };
          }
          case 'remove': {
            await prisma.teamMember.deleteMany({ where: { id: input.memberId, projectId } });
            return { result: JSON.stringify({ status: 'success', removed: input.memberId }) };
          }
          case 'update': {
            await prisma.teamMember.update({ where: { id: input.memberId }, data: { role: input.role } });
            return { result: JSON.stringify({ status: 'success', memberId: input.memberId, newRole: input.role }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'role_assign': {
        const member = await prisma.teamMember.update({
          where: { id: input.memberId },
          data: { role: input.role, permissions: input.permissions || [] },
        });
        return { result: JSON.stringify({ status: 'success', memberId: member.id, role: member.role, permissions: member.permissions }) };
      }

      case 'comment_thread': {
        switch (input.operation) {
          case 'create': {
            const thread = await prisma.commentThread.create({
              data: { projectId, userId, body: input.body || '', target: input.target || {}, status: 'open' },
            });
            return { result: JSON.stringify({ status: 'success', threadId: thread.id }) };
          }
          case 'reply': {
            await prisma.reviewComment.create({
              data: { threadId: input.threadId, userId, body: input.body || '' },
            });
            return { result: JSON.stringify({ status: 'success', threadId: input.threadId, action: 'replied' }) };
          }
          case 'resolve': {
            await prisma.commentThread.update({ where: { id: input.threadId }, data: { status: 'resolved', resolvedBy: userId, resolvedAt: new Date() } });
            return { result: JSON.stringify({ status: 'success', threadId: input.threadId, threadStatus: 'resolved' }) };
          }
          case 'list': {
            const threads = await prisma.commentThread.findMany({
              where: { projectId },
              orderBy: { createdAt: 'desc' },
              take: 30,
              include: { _count: { select: { replies: true } } },
            });
            return { result: JSON.stringify({ status: 'success', count: threads.length, threads: threads.map(t => ({ id: t.id, body: t.body?.slice(0, 80), status: t.status, replies: t._count?.replies || 0 })) }) };
          }
          case 'delete': {
            await prisma.commentThread.deleteMany({ where: { id: input.threadId, userId } });
            return { result: JSON.stringify({ status: 'success', deleted: input.threadId }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'task_assign': {
        switch (input.operation) {
          case 'create': {
            const task = await prisma.taskItem.create({
              data: { projectId, userId, title: input.title || 'New Task', description: input.description || null, priority: input.priority || 'medium', status: 'open', dueDate: input.dueDate ? new Date(input.dueDate) : null },
            });
            return { result: JSON.stringify({ status: 'success', taskId: task.id, title: task.title }) };
          }
          case 'assign': {
            await prisma.taskItem.update({ where: { id: input.taskId }, data: { assigneeId: input.assigneeId } });
            return { result: JSON.stringify({ status: 'success', taskId: input.taskId, assignedTo: input.assigneeId }) };
          }
          case 'update': {
            const updateData = {};
            if (input.title) updateData.title = input.title;
            if (input.description) updateData.description = input.description;
            if (input.priority) updateData.priority = input.priority;
            if (input.dueDate) updateData.dueDate = new Date(input.dueDate);
            await prisma.taskItem.update({ where: { id: input.taskId }, data: updateData });
            return { result: JSON.stringify({ status: 'success', taskId: input.taskId, updated: Object.keys(updateData) }) };
          }
          case 'complete': {
            await prisma.taskItem.update({ where: { id: input.taskId }, data: { status: 'completed', completedAt: new Date() } });
            return { result: JSON.stringify({ status: 'success', taskId: input.taskId, taskStatus: 'completed' }) };
          }
          case 'list': {
            const tasks = await prisma.taskItem.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, take: 50 });
            return { result: JSON.stringify({ status: 'success', count: tasks.length, tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, assignee: t.assigneeId })) }) };
          }
          case 'delete': {
            await prisma.taskItem.deleteMany({ where: { id: input.taskId, userId } });
            return { result: JSON.stringify({ status: 'success', deleted: input.taskId }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'approval_flow': {
        switch (input.operation) {
          case 'create': {
            const approval = await prisma.approvalRequest.create({
              data: { projectId, userId, title: input.title || 'Approval Request', description: input.description || null, approvers: input.approvers || [], status: 'pending' },
            });
            return { result: JSON.stringify({ status: 'success', approvalId: approval.id, title: approval.title }) };
          }
          case 'approve': {
            await prisma.approvalRequest.update({
              where: { id: input.approvalId },
              data: { status: 'approved', decidedBy: userId, decidedAt: new Date(), comment: input.comment || null },
            });
            return { result: JSON.stringify({ status: 'success', approvalId: input.approvalId, approvalStatus: 'approved' }) };
          }
          case 'reject': {
            await prisma.approvalRequest.update({
              where: { id: input.approvalId },
              data: { status: 'rejected', decidedBy: userId, decidedAt: new Date(), comment: input.comment || null },
            });
            return { result: JSON.stringify({ status: 'success', approvalId: input.approvalId, approvalStatus: 'rejected' }) };
          }
          case 'list': {
            const approvals = await prisma.approvalRequest.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: approvals.length, approvals: approvals.map(a => ({ id: a.id, title: a.title, status: a.status })) }) };
          }
          case 'get': {
            const approval = await prisma.approvalRequest.findFirst({ where: { id: input.approvalId } });
            if (!approval) return { result: JSON.stringify({ status: 'error', error: 'Not found' }) };
            return { result: JSON.stringify({ status: 'success', approval }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isCollaborationTool = (name) => COLLABORATION_TOOL_DEFINITIONS.some(t => t.name === name);
