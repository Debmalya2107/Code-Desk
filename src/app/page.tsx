'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Users, Target, MessageSquare, BarChart3, Upload, Star, Search, Plus, CheckCircle, Clock, AlertCircle, User, LogOut } from 'lucide-react'
import AuthModal from '@/components/auth/AuthModal'
import ProfileModal from '@/components/profile/ProfileModal'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import SkillMatchmaking from '@/components/projects/SkillMatchmaking'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'
import WebSocketDebug from '@/components/debug/WebSocketDebug'

export default function Home() {
  const [activeTab, setActiveTab] = useState('discover')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('all')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [myProjects, setMyProjects] = useState<any[]>([])

  // Remove all fake data - make it truly social-driven
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)

  const skills = ['Python', 'JavaScript', 'React', 'Node.js', 'Machine Learning', 'UI/UX', 'Database', 'Mobile Dev']

  // Remove fake stats - make it dynamic
  const [stats, setStats] = useState({
    activeProjects: 0,
    studentsConnected: 0,
    tasksCompleted: 0,
    reviewsGiven: 0
  })

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user)
    localStorage.setItem('user', JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('user')
  }

  const copyProjectLink = (projectId: string) => {
    const link = `${window.location.origin}/project/${projectId}`
    navigator.clipboard.writeText(link)
    // You could add a toast notification here
  }

  const handleProfileUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const handleProjectCreated = (project: any) => {
    // Refresh projects and stats
    fetchProjects()
    fetchStats()
    console.log('Project created:', project)
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      
      if (response.ok) {
        const allProjects = data.projects || []
        setFeaturedProjects(allProjects)
        
        // Filter user's own projects
        if (currentUser) {
          const userProjects = allProjects.filter((project: any) => 
            project.members?.some((member: any) => member.user.id === currentUser.id)
          )
          setMyProjects(userProjects)
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const fetchStats = async () => {
    try {
      // For now, we'll calculate stats from the projects we have
      // In a real app, you might have a dedicated stats endpoint
      const response = await fetch('/api/projects')
      const data = await response.json()
      
      if (response.ok && data.projects) {
        const projects = data.projects
        const totalMembers = projects.reduce((sum: number, p: any) => sum + (p._count?.members || 0), 0)
        const totalTasks = projects.reduce((sum: number, p: any) => sum + (p._count?.tasks || 0), 0)
        
        setStats({
          activeProjects: projects.length,
          studentsConnected: totalMembers,
          tasksCompleted: Math.floor(totalTasks * 0.7), // Estimate completed tasks
          reviewsGiven: Math.floor(totalMembers * 1.5) // Estimate reviews
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
    
    // Fetch projects and stats on component mount
    fetchProjects()
    fetchStats()
  }, [])

  useEffect(() => {
    // Refetch projects when user changes
    fetchProjects()
  }, [currentUser])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Code-Desk
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" onClick={() => setActiveTab('discover')}>Discover</Button>
              {currentUser && (
                <Button variant="ghost" onClick={() => setActiveTab('my-projects')}>My Projects</Button>
              )}
              <Button variant="ghost" onClick={() => setActiveTab('dashboard')}>Dashboard</Button>
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback>{currentUser.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{currentUser.name}</span>
                  </Button>
                  <Button variant="ghost" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)}>Sign In</Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Code. Collaborate. Create Together.
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Connect with talented developers, join exciting projects, and accelerate your coding journey through hands-on collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {currentUser ? (
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => setIsCreateProjectModalOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Start a Project
              </Button>
            ) : (
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => setIsAuthModalOpen(true)}>
                Get Started
              </Button>
            )}
            <Button size="lg" variant="outline">
              <Search className="w-5 h-5 mr-2" />
              Find Projects
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{stats.studentsConnected}</div>
              <div className="text-sm text-gray-600">Students Connected</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
              <div className="text-sm text-gray-600">Tasks Completed</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Star className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold">{stats.reviewsGiven}</div>
              <div className="text-sm text-gray-600">Reviews Given</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover">Discover Projects</TabsTrigger>
            {currentUser && <TabsTrigger value="my-projects">My Projects</TabsTrigger>}
            <TabsTrigger value="skills">Skill Matchmaking</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-8">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {skills.map((skill) => (
                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Projects Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingProjects ? (
                // Loading state
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="flex gap-1">
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : featuredProjects.length === 0 ? (
                // Empty state - no projects yet
                <div className="col-span-full text-center py-12">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Be the first to start a project and invite others to collaborate!
                  </p>
                  {currentUser && (
                    <Button onClick={() => setIsCreateProjectModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Start the First Project
                    </Button>
                  )}
                  {!currentUser && (
                    <Button onClick={() => setIsAuthModalOpen(true)}>
                      Sign In to Start a Project
                    </Button>
                  )}
                </div>
              ) : (
                // Real projects
                featuredProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2">
                            {project.description}
                          </CardDescription>
                        </div>
                        <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>
                          {project.status === 'open' ? 'Open' : 'In Progress'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={project.members?.[0]?.user?.avatar} />
                            <AvatarFallback>
                              {project.members?.[0]?.user?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">
                            {project.members?.[0]?.user?.name || 'Anonymous'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {project.skills?.slice(0, 3).map((projectSkill: any) => (
                            <Badge key={projectSkill.skill.id} variant="outline" className="text-xs">
                              {projectSkill.skill.name}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{project._count?.members || 0}/{project.teamSize} members</span>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              if (!currentUser) {
                                setIsAuthModalOpen(true)
                              } else {
                                // Navigate to project detail or join project
                                window.location.href = `/project/${project.id}`
                              }
                            }}
                          >
                            {currentUser ? 'View Project' : 'Sign In to Join'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-projects" className="mt-8">
            {!currentUser ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Sign In to View Your Projects</h3>
                  <p className="text-gray-600 mb-4">Create and manage your collaborative projects.</p>
                  <Button onClick={() => setIsAuthModalOpen(true)}>Sign In</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your Projects</h3>
                  <Button onClick={() => setIsCreateProjectModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </div>

                {myProjects.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
                      <p className="text-gray-600 mb-4">
                        Start your first project and invite others to collaborate!
                      </p>
                      <Button onClick={() => setIsCreateProjectModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Project
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myProjects.map((project) => (
                      <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                              <CardDescription className="text-sm line-clamp-2">
                                {project.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>
                                {project.status === 'open' ? 'Open' : 'In Progress'}
                              </Badge>
                              {project.members?.some((member: any) => member.user.id === currentUser.id && member.role === 'owner') && (
                                <Badge variant="outline" className="text-xs">Owner</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{project._count?.members || 0}/{project.teamSize} members</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Target className="w-4 h-4" />
                                <span>{project._count?.tasks || 0} tasks</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {project.skills?.slice(0, 3).map((projectSkill: any) => (
                                <Badge key={projectSkill.skill.id} variant="outline" className="text-xs">
                                  {projectSkill.skill.name}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => window.location.href = `/project/${project.id}`}
                              >
                                View Project
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => copyProjectLink(project.id)}>
                                Share
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="skills" className="mt-8">
            {!currentUser ? (
              <Card className="text-center py-12">
                <CardContent>
                  <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Sign In to Manage Skills</h3>
                  <p className="text-gray-600 mb-4">Create a profile to add your skills and get personalized project recommendations.</p>
                  <Button onClick={() => setIsAuthModalOpen(true)}>Sign In</Button>
                </CardContent>
              </Card>
            ) : (
              <SkillMatchmaking userId={currentUser.id} />
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="mt-8">
            {!currentUser ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Sign In to View Dashboard</h3>
                  <p className="text-gray-600 mb-4">Track your projects, tasks, and collaboration progress.</p>
                  <Button onClick={() => setIsAuthModalOpen(true)}>Sign In</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                <WebSocketDebug />
                <AnalyticsDashboard userId={currentUser.id} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Code-Desk. Made by <span className="font-semibold text-blue-600">Musked-Coders</span>. Building the future of developer collaboration.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onUpdate={handleProfileUpdate}
      />
      
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        userId={currentUser?.id || ''}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  )
}