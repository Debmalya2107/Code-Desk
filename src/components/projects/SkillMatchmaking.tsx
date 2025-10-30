'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Target, Star, TrendingUp, AlertCircle } from 'lucide-react'

interface SkillMatchmakingProps {
  userId: string
}

interface ProjectRecommendation {
  id: string
  title: string
  description: string
  teamSize: number
  matchScore: number
  matchedSkills: Array<{
    skill: string
    userProficiency: number
    requiredLevel: number
    matchPercentage: number
  }>
  urgencyScore: number
  members: Array<{
    user: {
      name: string
      avatar?: string
    }
  }>
  _count: {
    members: number
  }
}

export default function SkillMatchmaking({ userId }: SkillMatchmakingProps) {
  const [recommendations, setRecommendations] = useState<ProjectRecommendation[]>([])
  const [userSkills, setUserSkills] = useState<Array<{ skill: string; proficiency: number }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRecommendations()
  }, [userId])

  const fetchRecommendations = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/matchmaking?userId=${userId}`)
      const data = await response.json()

      if (response.ok) {
        setRecommendations(data.recommendations)
        setUserSkills(data.userSkills)
      } else {
        setError(data.error || 'Failed to fetch recommendations')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinProject = async (projectId: string) => {
    try {
      const response = await fetch('/api/projects/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          userId
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh recommendations
        fetchRecommendations()
      } else {
        setError(data.error || 'Failed to join project')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match'
    if (score >= 60) return 'Good Match'
    if (score >= 40) return 'Fair Match'
    return 'Low Match'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Finding Your Perfect Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (userSkills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Skill-Based Matchmaking
          </CardTitle>
          <CardDescription>
            Get personalized project recommendations based on your skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Skills Found</h3>
            <p className="text-gray-600 mb-4">
              Add your skills to your profile to get personalized project recommendations.
            </p>
            <Button>Add Skills to Profile</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Skills Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Your Skills
          </CardTitle>
          <CardDescription>
            These skills are used to find your perfect project matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {userSkills.map((skill, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {skill.skill}
                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                  L{skill.proficiency}
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recommended Projects
          </h3>
          <Button variant="outline" size="sm" onClick={fetchRecommendations}>
            Refresh
          </Button>
        </div>

        {recommendations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
              <p className="text-gray-600">
                No matching projects found at the moment. Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recommendations.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-sm font-medium ${getMatchScoreColor(project.matchScore)}`}>
                        {project.matchScore}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {getMatchScoreLabel(project.matchScore)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Match Score Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Match Score</span>
                        <span className="text-sm font-medium">{project.matchScore}%</span>
                      </div>
                      <Progress value={project.matchScore} className="h-2" />
                    </div>

                    {/* Matched Skills */}
                    {project.matchedSkills.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Matched Skills:</div>
                        <div className="flex flex-wrap gap-1">
                          {project.matchedSkills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill.skill} ({skill.matchPercentage}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Project Info */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{project._count.members}/{project.teamSize} members</span>
                        </div>
                        {project.urgencyScore > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {project.urgencyScore} spots open
                          </Badge>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleJoinProject(project.id)}
                      >
                        Join Project
                      </Button>
                    </div>

                    {/* Current Members */}
                    {project.members.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Current Team:</div>
                        <div className="flex -space-x-2">
                          {project.members.slice(0, 5).map((member, index) => (
                            <Avatar key={index} className="w-8 h-8 border-2 border-white">
                              <AvatarImage src={member.user.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.user.name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {project.members.length > 5 && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                              <span className="text-xs text-gray-600">+{project.members.length - 5}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}