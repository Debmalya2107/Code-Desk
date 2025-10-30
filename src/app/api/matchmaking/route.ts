import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's skills
    const userSkills = await db.userSkill.findMany({
      where: { userId },
      include: {
        skill: true
      }
    })

    if (userSkills.length === 0) {
      return NextResponse.json({
        message: 'No skills found for user. Please add skills to get recommendations.',
        recommendations: []
      })
    }

    // Get all open projects
    const projects = await db.project.findMany({
      where: { 
        status: 'open',
        members: {
          none: {
            userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    })

    // Calculate match scores for each project
    const recommendations = projects.map(project => {
      let matchScore = 0
      let matchedSkills = []

      for (const projectSkill of project.skills) {
        const userSkill = userSkills.find(us => us.skillId === projectSkill.skillId)
        if (userSkill) {
          // Calculate skill match score based on proficiency
          const skillScore = Math.min(userSkill.proficiency, projectSkill.level) / projectSkill.level * 100
          matchScore += skillScore
          matchedSkills.push({
            skill: projectSkill.skill.name,
            userProficiency: userSkill.proficiency,
            requiredLevel: projectSkill.level,
            matchPercentage: Math.round(skillScore)
          })
        }
      }

      // Normalize match score
      if (project.skills.length > 0) {
        matchScore = matchScore / project.skills.length
      }

      // Bonus points for projects with fewer members (more urgent)
      const memberBonus = Math.max(0, (project.teamSize - project._count.members) * 10)
      matchScore += memberBonus

      return {
        ...project,
        matchScore: Math.round(matchScore),
        matchedSkills,
        urgencyScore: project.teamSize - project._count.members
      }
    })

    // Sort by match score (highest first)
    recommendations.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({
      recommendations: recommendations.slice(0, 10), // Top 10 recommendations
      userSkills: userSkills.map(us => ({
        skill: us.skill.name,
        proficiency: us.proficiency
      }))
    })
  } catch (error) {
    console.error('Matchmaking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}