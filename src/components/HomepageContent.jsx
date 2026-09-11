'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function HomepageContent() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/homepage/content')
        if (!response.ok) {
          throw new Error('Failed to fetch homepage content')
        }
        const data = await response.json()
        setContent(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  if (loading) {
    return (
      <div className="w-full bg-background">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="w-full bg-background">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-500">Error loading content</p>
        </div>
      </div>
    )
  }

  const { intro, sections } = content

  return (
    <div className="w-full bg-background">
      <div className="container mx-auto px-4 py-12 space-y-8 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{intro.title}</h1>
          <p className="text-lg text-muted-foreground">
            {intro.description}
          </p>
        </div>

        {sections.map((section, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="text-2xl text-foreground">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 text-foreground">
                {section.content.split('\n\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
