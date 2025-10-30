'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Mail, Edit2, Plus, X, Star } from 'lucide-react'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onUpdate: (user: any) => void
}

export default function ProfileModal({ isOpen, onClose, user, onUpdate }: ProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    avatar: ''
  })

  const [skills, setSkills] = useState<Array<{ name: string; category: string; proficiency: number }>>([])
  const [newSkill, setNewSkill] = useState({ name: '', category: 'General', proficiency: 3 })

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      })
      // Load user skills if available
      if (user.skills) {
        setSkills(user.skills.map((us: any) => ({
          name: us.skill.name,
          category: us.skill.category,
          proficiency: us.proficiency
        })))
      }
    }
  }, [user])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          ...profileData,
          skills
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        onUpdate({ ...user, ...profileData, skills })
        setTimeout(() => {
          onClose()
          setSuccess('')
        }, 1500)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setSkills([...skills, { ...newSkill }])
      setNewSkill({ name: '', category: 'General', proficiency: 3 })
    }
  }

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const updateSkillProficiency = (index: number, proficiency: number) => {
    const updatedSkills = [...skills]
    updatedSkills[index].proficiency = proficiency
    setSkills(updatedSkills)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Edit Profile
          </CardTitle>
          <CardDescription>
            Update your personal information and skills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profileData.avatar} />
              <AvatarFallback className="text-lg">
                {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                placeholder="https://example.com/avatar.jpg"
                value={profileData.avatar}
                onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
              />
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself, your interests, and what you're looking for in collaborations..."
                rows={3}
              />
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-4">
            <div>
              <Label>Skills</Label>
              <p className="text-sm text-gray-600 mb-2">
                Add your technical skills and proficiency level (1-5)
              </p>
            </div>

            {/* Add New Skill */}
            <div className="flex gap-2">
              <Input
                placeholder="Skill name"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                className="flex-1"
              />
              <Select value={newSkill.category} onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Frontend">Frontend</SelectItem>
                  <SelectItem value="Backend">Backend</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newSkill.proficiency.toString()} onValueChange={(value) => setNewSkill({ ...newSkill, proficiency: parseInt(value) })}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      Level {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addSkill} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Existing Skills */}
            <div className="space-y-2">
              {skills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{skill.name}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      {skill.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Star
                          key={level}
                          className={`w-3 h-3 ${
                            level <= skill.proficiency
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={skill.proficiency.toString()}
                      onValueChange={(value) => updateSkillProficiency(index, parseInt(value))}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            Level {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkill(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}