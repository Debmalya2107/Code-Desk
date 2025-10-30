import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const tasks = await db.task.findMany({
      where: { projectId },
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
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Group tasks by status
    const tasksByStatus = {
      todo: tasks.filter(task => task.status === 'todo'),
      in_progress: tasks.filter(task => task.status === 'in_progress'),
      review: tasks.filter(task => task.status === 'review'),
      done: tasks.filter(task => task.status === 'done')
    }

    return NextResponse.json({ tasks: tasksByStatus })
  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      description, 
      priority, 
      projectId, 
      assigneeId, 
      creatorId,
      dueDate 
    } = await request.json()

    if (!title || !projectId || !creatorId) {
      return NextResponse.json(
        { error: 'Title, project ID, and creator ID are required' },
        { status: 400 }
      )
    }

    // Verify user is a member of the project
    const membership = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: creatorId
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not a member of this project' },
        { status: 403 }
      )
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        status: 'todo',
        projectId,
        assigneeId,
        creatorId,
        dueDate: dueDate ? new Date(dueDate) : null
      },
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
      message: 'Task created successfully',
      task
    })
  } catch (error) {
    console.error('Task creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}