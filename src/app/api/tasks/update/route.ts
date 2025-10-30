import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const { taskId, status, assigneeId, userId } = await request.json()

    if (!taskId || !userId) {
      return NextResponse.json(
        { error: 'Task ID and user ID are required' },
        { status: 400 }
      )
    }

    // Get the task to verify permissions
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify user is a member of the project
    const isMember = task.project.members.some(member => member.userId === userId)
    if (!isMember) {
      return NextResponse.json(
        { error: 'User is not a member of this project' },
        { status: 403 }
      )
    }

    // Update task
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Task updated successfully',
      task: updatedTask
    })
  } catch (error) {
    console.error('Task update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}