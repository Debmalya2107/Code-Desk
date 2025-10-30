import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const taskId = searchParams.get('taskId')
    const revieweeId = searchParams.get('revieweeId')

    let whereClause: any = {}

    if (projectId) whereClause.projectId = projectId
    if (taskId) whereClause.taskId = taskId
    if (revieweeId) whereClause.revieweeId = revieweeId

    const reviews = await db.review.findMany({
      where: whereClause,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      taskId, 
      projectId, 
      reviewerId, 
      revieweeId, 
      rating, 
      comments, 
      anonymous 
    } = await request.json()

    if ((!taskId && !projectId) || !reviewerId || !revieweeId || !rating) {
      return NextResponse.json(
        { error: 'Task/Project ID, reviewer ID, reviewee ID, and rating are required' },
        { status: 400 }
      )
    }

    // Verify reviewer is a member of the project
    if (projectId) {
      const membership = await db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: reviewerId
          }
        }
      })

      if (!membership) {
        return NextResponse.json(
          { error: 'Reviewer is not a member of this project' },
          { status: 403 }
        )
      }
    }

    // Check if review already exists
    const existingReview = await db.review.findFirst({
      where: {
        taskId,
        projectId,
        reviewerId,
        revieweeId
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this combination' },
        { status: 400 }
      )
    }

    const review = await db.review.create({
      data: {
        taskId,
        projectId,
        reviewerId,
        revieweeId,
        rating,
        comments,
        anonymous: anonymous || false
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Review submitted successfully',
      review
    })
  } catch (error) {
    console.error('Review creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}