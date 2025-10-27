'use client'

import React from 'react'
import { useBrandingValue } from '@/components/providers/branding-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Logo } from './logo'
import { cn } from '@/lib/utils'

interface ThemePreviewProps {
  className?: string
}

export function ThemePreview({ className }: ThemePreviewProps) {
  const colors = useBrandingValue('colors')
  const typography = useBrandingValue('typography')
  const appName = useBrandingValue('appName')

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center space-y-2">
        <Logo size="lg" />
        <h2 className="text-2xl font-bold" style={{ fontFamily: typography.fontFamily }}>
          {appName} Theme Preview
        </h2>
        <p className="text-muted-foreground" style={{ fontFamily: typography.fontFamily }}>
          See how your branding will look across the application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dashboard Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Logo size="sm" />
              Dashboard
            </CardTitle>
            <CardDescription>
              Overview of your learning progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-muted-foreground">Student</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Course Progress</span>
                <span className="text-sm font-medium">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            
            <div className="flex gap-2">
              <Badge variant="default">Active</Badge>
              <Badge variant="secondary">Enrolled</Badge>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm">Continue Learning</Button>
              <Button variant="outline" size="sm">View Progress</Button>
            </div>
          </CardContent>
        </Card>

        {/* Course Card Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Course Management</CardTitle>
            <CardDescription>
              Manage your courses and content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Introduction to React</h3>
                <Badge variant="outline">Published</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Learn the fundamentals of React development
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>12 lessons</span>
                <span>•</span>
                <span>3 modules</span>
                <span>•</span>
                <span>2 hours</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">AI</AvatarFallback>
                </Avatar>
                <span className="text-sm">Created by Author</span>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>
              Main navigation elements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <nav className="space-y-1">
              <Button variant="ghost" className="w-full justify-start">
                Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Courses
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Progress
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Settings
              </Button>
            </nav>
            
            <Separator />
            
            <div className="space-y-2">
              <Button className="w-full">Primary Action</Button>
              <Button variant="outline" className="w-full">Secondary Action</Button>
              <Button variant="ghost" className="w-full">Tertiary Action</Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Forms & Inputs</CardTitle>
            <CardDescription>
              Form elements and validation states
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <input
                type="email"
                placeholder="john@example.com"
                className="w-full px-3 py-2 border rounded-md bg-background"
                style={{ fontFamily: typography.fontFamily }}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-3 py-2 border rounded-md bg-background"
                style={{ fontFamily: typography.fontFamily }}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="rounded"
              />
              <label htmlFor="remember" className="text-sm">
                Remember me
              </label>
            </div>
            
            <Button className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>
            Your custom color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div
                className="h-16 rounded-md border"
                style={{ backgroundColor: colors.primary }}
              />
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground font-mono">
                {colors.primary}
              </p>
            </div>
            <div className="space-y-2">
              <div
                className="h-16 rounded-md border"
                style={{ backgroundColor: colors.secondary }}
              />
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground font-mono">
                {colors.secondary}
              </p>
            </div>
            <div className="space-y-2">
              <div
                className="h-16 rounded-md border"
                style={{ backgroundColor: colors.accent }}
              />
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground font-mono">
                {colors.accent}
              </p>
            </div>
            <div className="space-y-2">
              <div
                className="h-16 rounded-md border"
                style={{ backgroundColor: colors.success }}
              />
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-muted-foreground font-mono">
                {colors.success}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Font family and text styles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h1 style={{ fontFamily: typography.fontFamily }} className="text-4xl font-bold">
              Heading 1
            </h1>
            <h2 style={{ fontFamily: typography.fontFamily }} className="text-3xl font-semibold">
              Heading 2
            </h2>
            <h3 style={{ fontFamily: typography.fontFamily }} className="text-2xl font-medium">
              Heading 3
            </h3>
            <h4 style={{ fontFamily: typography.fontFamily }} className="text-xl font-medium">
              Heading 4
            </h4>
            <p style={{ fontFamily: typography.fontFamily }} className="text-base">
              This is a paragraph of text showing how your chosen font family will appear in regular content.
            </p>
            <p style={{ fontFamily: typography.fontFamily }} className="text-sm text-muted-foreground">
              This is smaller text, often used for descriptions and captions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
