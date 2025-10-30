'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X, Target, Calendar, Users } from 'lucide-react'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onProjectCreated: (project: any) => void
}

export default function CreateProjectModal({ isOpen, onClose, userId, onProjectCreated }: CreateProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [projectLink, setProjectLink] = useState('')

  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    teamSize: 3
  })

  const [requiredSkills, setRequiredSkills] = useState<Array<{ name: string; category: string; level: number }>>([])
  const [newSkill, setNewSkill] = useState({ name: '', category: 'General', level: 3 })

  const [milestones, setMilestones] = useState<Array<{ title: string; description: string; dueDate: string }>>([])
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', dueDate: '' })

  const skillCategories = ['General', 'Frontend', 'Backend', 'Mobile', 'Data Science', 'Design', 'DevOps', 'AI/ML']

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setRequiredSkills([...requiredSkills, { ...newSkill }])
      setNewSkill({ name: '', category: 'General', level: 3 })
    }
  }

  const removeSkill = (index: number) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== index))
  }

  const addMilestone = () => {
    if (newMilestone.title.trim()) {
      setMilestones([...milestones, { ...newMilestone }])
      setNewMilestone({ title: '', description: '', dueDate: '' })
    }
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!projectData.title.trim() || !projectData.description.trim()) {
      setError('Title and description are required')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...projectData,
          requiredSkills,
          userId,
          milestones
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Project created successfully!')
        const link = `${window.location.origin}/project/${data.project.id}`
        setProjectLink(link)
        onProjectCreated(data.project)
        
        setTimeout(() => {
          handleClose()
          setSuccess('')
          setProjectLink('')
        }, 5000) // Give more time to copy the link
      } else {
        setError(data.error || 'Failed to create project')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setProjectData({ title: '', description: '', teamSize: 3 })
      setRequiredSkills([])
      setMilestones([])
      setNewSkill({ name: '', category: 'General', level: 3 })
      setNewMilestone({ title: '', description: '', dueDate: '' })
      setError('')
      setSuccess('')
      setProjectLink('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Create New Project
          </CardTitle>
          <CardDescription>
            Start a collaborative project and invite talented students to join your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={projectData.title}
                  onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                  placeholder="Enter a catchy project title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  placeholder="Describe your project, goals, and what makes it exciting..."
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Select 
                  value={projectData.teamSize.toString()} 
                  onValueChange={(value) => setProjectData({ ...projectData, teamSize: parseInt(value) })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size} members
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Required Skills */}
            <div className="space-y-4">
              <div>
                <Label>Required Skills</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Add the technical skills needed for this project
                </p>
              </div>
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
                    {skillCategories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newSkill.level.toString()} onValueChange={(value) => setNewSkill({ ...newSkill, level: parseInt(value) })}>
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
                <Button type="button" onClick={addSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {requiredSkills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{skill.name}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {skill.category}
                      </Badge>
                      <span className="text-sm text-gray-600">Level {skill.level}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkill(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Milestones (Optional)
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  Define key milestones and deadlines for your project
                </p>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Milestone title"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                />
                <Textarea
                  placeholder="Milestone description"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  rows={2}
                />
                <Input
                  type="date"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                />
                <Button type="button" onClick={addMilestone} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Milestone
                </Button>
              </div>

              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{milestone.title}</h4>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                        )}
                        {milestone.dueDate && (
                          <p className="text-xs text-gray-500 mt-2">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(index)}
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
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{success}</p>
                    {projectLink && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={projectLink}
                          readOnly
                          className="flex-1 p-2 text-xs border rounded bg-gray-50"
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(projectLink)
                            // You could add a toast notification here
                          }}
                        >
                          Copy Link
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-600">
                      Share this link with team members to invite them to your project!
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}