import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { projectId, userId } = await request.json()

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'Project ID and user ID are required' },
        { status: 400 }
      )
    }

    // Check if project exists and is open
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.status !== 'open') {
      return NextResponse.json(
        { error: 'Project is not accepting new members' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 400 }
      )
    }

    // Check if project has reached team size limit
    if (project._count.members >= project.teamSize) {
      return NextResponse.json(
        { error: 'Project has reached its team size limit' },
        { status: 400 }
      )
    }

    // Add user to project
    const member = await db.projectMember.create({
      data: {
        projectId,
        userId,
        role: 'member'
      }
    })

    // Update project status if team is full
    if (project._count.members + 1 >= project.teamSize) {
      await db.project.update({
        where: { id: projectId },
        data: { status: 'in_progress' }
      })
    }

    return NextResponse.json({
      message: 'Successfully joined the project',
      member
    })
  } catch (error) {
    console.error('Project join error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}