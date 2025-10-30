import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const messages = await db.chatMessage.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error('Chat messages fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, userId, projectId } = await request.json()

    if (!content || !userId || !projectId) {
      return NextResponse.json(
        { error: 'Content, user ID, and project ID are required' },
        { status: 400 }
      )
    }

    // Verify user is a member of the project
    const membership = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not a member of this project' },
        { status: 403 }
      )
    }

    const message = await db.chatMessage.create({
      data: {
        content,
        userId,
        projectId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Emit real-time message via WebSocket
    // This would integrate with your WebSocket server
    if (global.io) {
      global.io.to(`project_${projectId}`).emit('new_message', message)
    }

    return NextResponse.json({
      message: 'Message sent successfully',
      chatMessage: message
    })
  } catch (error) {
    console.error('Chat message send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}