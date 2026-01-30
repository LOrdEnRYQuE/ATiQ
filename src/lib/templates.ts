/**
 * Boot Templates for ATiQ Vibe Coding IDE
 * 
 * Prevents the "Blank Slate" crash by providing a default project structure
 * for new users opening the app in incognito mode or with empty localStorage.
 */

export const BASE_TEMPLATE = {
  'package.json': JSON.stringify({
    name: "vibe-project",
    type: "module",
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "lucide-react": "^0.344.0"
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.2.1",
      "vite": "^5.1.4"
    },
    scripts: {
      "dev": "vite",
      "build": "vite build"
    }
  }, null, 2),
  
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vibe App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.jsx"></script>
  </body>
</html>`,

  'main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,

  'App.jsx': `import React from 'react';
import { Sparkles } from 'lucide-react';

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <Sparkles size={48} color="#8b5cf6" />
      <h1>Ready to Vibe</h1>
      <p>Describe your app in the chat to get started.</p>
    </div>
  );
}`,

  'index.css': `body { margin: 0; background: #f8fafc; color: #0f172a; }`,

  'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  }
})`
};

/**
 * Advanced template with more features for users who want to start with something richer
 */
export const ADVANCED_TEMPLATE = {
  'package.json': JSON.stringify({
    name: "vibe-project-advanced",
    type: "module",
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "lucide-react": "^0.344.0",
      "react-router-dom": "^6.8.1",
      "clsx": "^1.2.1"
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.2.1",
      "vite": "^5.1.4",
      "tailwindcss": "^3.2.7",
      "autoprefixer": "^10.4.14",
      "postcss": "^8.4.21"
    },
    scripts: {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    }
  }, null, 2),

  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Advanced Vibe App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,

  'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,

  'src/App.jsx': `import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Sparkles, Code, Zap, Globe } from 'lucide-react';
import './App.css';

function Home() {
  return (
    <div className="hero">
      <Sparkles size={64} className="icon" />
      <h1>Welcome to Vibe Coding</h1>
      <p>Start building amazing applications with AI assistance</p>
      <div className="features">
        <div className="feature">
          <Code size={24} />
          <span>Smart Code Generation</span>
        </div>
        <div className="feature">
          <Zap size={24} />
          <span>Lightning Fast</span>
        </div>
        <div className="feature">
          <Globe size={24} />
          <span>Modern Web Stack</span>
        </div>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="page">
      <h1>About</h1>
      <p>This is an advanced template with routing and styling pre-configured.</p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}`,

  'src/App.css': `nav {
  padding: 1rem;
  background: #1f2937;
  display: flex;
  gap: 1rem;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

nav a:hover {
  background: #374151;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 60px);
  text-align: center;
  padding: 2rem;
}

.icon {
  color: #8b5cf6;
  margin-bottom: 2rem;
  animation: pulse 2s infinite;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
  max-width: 800px;
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
}

.page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}`,

  'src/index.css': `body { 
  margin: 0; 
  background: #ffffff; 
  color: #1f2937; 
  font-family: system-ui, -apple-system, sans-serif;
}

* {
  box-sizing: border-box;
}`,

  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,

  'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,

  'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
};

/**
 * Get template by name
 */
export function getTemplate(templateName: 'base' | 'advanced' = 'base') {
  switch (templateName) {
    case 'advanced':
      return ADVANCED_TEMPLATE;
    case 'base':
    default:
      return BASE_TEMPLATE;
  }
}

/**
 * Check if files object is empty or contains only minimal content
 */
export function isEmptyProject(files: Record<string, string>): boolean {
  const fileKeys = Object.keys(files);
  
  // No files at all
  if (fileKeys.length === 0) {
    return true;
  }
  
  // Only has minimal/placeholder files
  const hasSubstantialFiles = fileKeys.some(key => {
    const content = files[key];
    return content && typeof content === 'string' && content.trim().length > 50; // More than just a placeholder
  });
  
  return !hasSubstantialFiles;
}
