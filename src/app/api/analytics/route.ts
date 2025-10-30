import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')

    if (!userId && !projectId) {
      return NextResponse.json(
        { error: 'User ID or Project ID is required' },
        { status: 400 }
      )
    }

    let analytics: any = {}

    if (userId) {
      // User analytics
      const userProjects = await db.projectMember.findMany({
        where: { userId },
        include: {
          project: {
            include: {
              tasks: true,
              milestones: true,
              members: true
            }
          }
        }
      })

      const userTasks = await db.task.findMany({
        where: { 
          OR: [
            { assigneeId: userId },
            { creatorId: userId }
          ]
        }
      })

      const userReviews = await db.review.findMany({
        where: {
          OR: [
            { reviewerId: userId },
            { revieweeId: userId }
          ]
        }
      })

      // Calculate user stats
      const totalProjects = userProjects.length
      const completedProjects = userProjects.filter(pm => pm.project.status === 'completed').length
      const totalTasks = userTasks.length
      const completedTasks = userTasks.filter(task => task.status === 'done').length
      const totalReviews = userReviews.length
      const averageRating = userReviews
        .filter(review => review.revieweeId === userId)
        .reduce((sum, review, _, arr) => sum + review.rating / arr.length, 0)

      analytics.user = {
        totalProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        totalReviews,
        averageRating: averageRating || 0,
        taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        projectSuccessRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0
      }

      // Recent activity
      analytics.recentActivity = [
        ...userTasks.slice(0, 5).map(task => ({
          type: 'task',
          title: task.title,
          status: task.status,
          date: task.updatedAt,
          project: userProjects.find(pm => pm.projectId === task.projectId)?.project.title
        })),
        ...userReviews.slice(0, 3).map(review => ({
          type: 'review',
          title: `Review for ${review.revieweeId === userId ? 'you' : 'team member'}`,
          rating: review.rating,
          date: review.createdAt
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)
    }

    if (projectId) {
      // Project analytics
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          milestones: true,
          members: {
            include: {
              user: true
            }
          },
          reviews: true
        }
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(task => task.status === 'done').length
      const totalMilestones = project.milestones.length
      const completedMilestones = project.milestones.filter(m => m.completed).length
      const totalReviews = project.reviews.length
      const averageRating = project.reviews.length > 0 
        ? project.reviews.reduce((sum, review) => sum + review.rating, 0) / project.reviews.length 
        : 0

      // Task status distribution
      const taskStatuses = project.tasks.reduce((acc: any, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      }, {})

      // Member contribution analysis
      const memberContributions = project.members.map(member => {
        const memberTasks = project.tasks.filter(task => 
          task.assigneeId === member.userId || task.creatorId === member.userId
        )
        const completedMemberTasks = memberTasks.filter(task => task.status === 'done')
        
        return {
          user: member.user,
          totalTasks: memberTasks.length,
          completedTasks: completedMemberTasks.length,
          contributionRate: memberTasks.length > 0 ? (completedMemberTasks.length / memberTasks.length) * 100 : 0
        }
      })

      analytics.project = {
        totalTasks,
        completedTasks,
        totalMilestones,
        completedMilestones,
        totalReviews,
        averageRating,
        taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        milestoneCompletionRate: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0,
        taskStatuses,
        memberContributions: memberContributions.sort((a, b) => b.contributionRate - a.contributionRate)
      }

      // Timeline data
      analytics.timeline = {
        tasks: project.tasks.map(task => ({
          date: task.createdAt,
          title: task.title,
          status: task.status
        })),
        milestones: project.milestones.map(milestone => ({
          date: milestone.createdAt,
          title: milestone.title,
          completed: milestone.completed
        }))
      }
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}