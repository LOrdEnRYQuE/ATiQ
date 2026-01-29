'use client'

import { ArrowLeft, Code, Zap, Database, Globe, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const templates = [
  {
    id: 'react-app',
    name: 'React Application',
    description: 'Modern React app with TypeScript and Tailwind CSS',
    icon: Code,
    color: 'cyan',
    files: {
      'App.tsx': `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold text-center pt-20">
        Welcome to React App
      </h1>
    </div>
  )
}

export default App`,
      'package.json': `{
  "name": "react-app",
  "version": "0.1.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`
    }
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'RESTful API with Express and MongoDB',
    icon: Zap,
    color: 'yellow',
    files: {
      'server.js': `const express = require('express')
const mongoose = require('mongoose')

const app = express()
app.use(express.json())

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myapp')

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`)
})`,
      'package.json': `{
  "name": "node-api",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^6.0.0"
  }
}`
    }
  },
  {
    id: 'fullstack',
    name: 'Full Stack App',
    description: 'Complete MERN stack application',
    icon: Database,
    color: 'green',
    files: {
      'frontend/src/App.tsx': `import React from 'react'
import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Full Stack App</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export default App`,
      'backend/server.js': `const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from API!' })
})

const PORT = 5000
app.listen(PORT, () => console.log(\`Server on port \${PORT}\`))`
    }
  },
  {
    id: 'website',
    name: 'Static Website',
    description: 'Modern website with HTML, CSS, and JavaScript',
    icon: Globe,
    color: 'blue',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
  </header>
  <main>
    <section>
      <h2>About Us</h2>
      <p>Modern web development at its finest.</p>
    </section>
  </main>
  <script src="script.js"></script>
</body>
</html>`,
      'styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  background: #f4f4f4;
}

header {
  background: #333;
  color: white;
  text-align: center;
  padding: 1rem;
}`,
      'script.js': `document.addEventListener('DOMContentLoaded', () => {
  console.log('Website loaded!')
  
  const header = document.querySelector('header')
  header.addEventListener('click', () => {
    alert('Welcome to our website!')
  })
})`
    }
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description: 'React Native mobile application',
    icon: Smartphone,
    color: 'purple',
    files: {
      'App.tsx': `import React from 'react'
import { View, Text, StyleSheet, Button } from 'react-native'

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile App</Text>
      <Button 
        title="Press Me" 
        onPress={() => alert('Hello from Mobile!')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  }
})`,
      'package.json': `{
  "name": "mobile-app",
  "version": "0.0.1",
  "dependencies": {
    "react": "18.0.0",
    "react-native": "0.69.0"
  }
}`
    }
  }
]

export default function Templates() {
  const router = useRouter()

  const handleTemplateSelect = (template: typeof templates[0]) => {
    // Store template data in sessionStorage for workspace to use
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template))
    router.push('/workspace/new')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/90 backdrop-blur-sm border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard">
              <button className="flex items-center text-gray-300 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Project Templates</h1>
          <p className="text-gray-400 text-lg">
            Choose a template to get started with your AI-powered coding project
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const IconComponent = template.icon
            return (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6 hover:border-${template.color}-400/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center text-lg font-bold text-white mb-3">
                  <IconComponent className={`h-5 w-5 mr-2 text-${template.color}-400`} />
                  {template.name}
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {template.description}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>{Object.keys(template.files).length} files</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
