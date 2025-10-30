'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, File, Download, Trash2, X, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface FileUploadProps {
  projectId: string
  userId: string
  isOwner?: boolean
}

interface UploadedFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  createdAt: string
  uploader: {
    id: string
    name: string
    avatar?: string
  }
}

export default function FileUpload({ projectId, userId, isOwner = false }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/files?projectId=${projectId}`)
      const data = await response.json()
      
      if (response.ok) {
        // Ensure we have an array
        const filesArray = Array.isArray(data.files) ? data.files : []
        setFiles(filesArray)
      } else {
        setFiles([])
      }
    } catch (error) {
      console.error('Failed to fetch files:', error)
      setFiles([])
    }
  }

  const handleFileUpload = async (fileList: FileList) => {
    if (fileList.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('projectId', projectId)
        formData.append('uploaderId', userId)

        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          setUploadProgress(((i + 1) / fileList.length) * 100)
        } else {
          console.error('Failed to upload file:', file.name)
        }
      }

      await fetchFiles()
    } catch (error) {
      console.error('File upload error:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️'
    if (mimeType.includes('code') || mimeType.includes('text')) return '💻'
    return '📁'
  }

  const downloadFile = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`/api/files/download/${fileId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchFiles()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  useState(() => {
    fetchFiles()
  }, [projectId])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Team Files
        </CardTitle>
        <CardDescription>
          Upload and share work files with your team members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            {dragActive ? 'Drop files here' : 'Upload work files'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
          >
            {uploading ? 'Uploading...' : 'Choose Files'}
          </Button>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading files...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Files List */}
        <div className="space-y-4">
          <h3 className="font-semibold">Uploaded Files</h3>
          
          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No files uploaded yet</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{file.originalName}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={file.uploader.avatar} />
                              <AvatarFallback className="text-xs">
                                {file.uploader.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{file.uploader.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadFile(file.id, file.originalName)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      {(isOwner || file.uploader.id === userId) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteFile(file.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  )
}