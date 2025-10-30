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

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        skills: {
          include: {
            skill: true
          }
        },
        projects: {
          include: {
            project: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, name, bio, avatar, skills } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name,
        bio,
        avatar
      }
    })

    // Update skills if provided
    if (skills) {
      // Delete existing skills
      await db.userSkill.deleteMany({
        where: { userId }
      })

      // Add new skills
      for (const skillData of skills) {
        const skill = await db.skill.upsert({
          where: { name: skillData.name },
          update: {},
          create: {
            name: skillData.name,
            category: skillData.category || 'General'
          }
        })

        await db.userSkill.create({
          data: {
            userId,
            skillId: skill.id,
            proficiency: skillData.proficiency
          }
        })
      }
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}