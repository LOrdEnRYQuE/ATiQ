export const WORKFLOW_TEMPLATES = {
  // Mobile deployment workflow for Expo
  mobile: `name: Deploy Mobile App

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Setup Expo CLI
      uses: expo/expo-github-action@v9
      with:
        expo-version: latest
        token: \${{ secrets.EXPO_TOKEN }}
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build and submit to app stores
      run: eas build --platform all --auto-submit
      env:
        EXPO_TOKEN: \${{ secrets.EXPO_TOKEN }}`,

  // Web deployment workflow for Vercel
  web: `name: Deploy Web App

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'`,

  // Desktop deployment workflow for Electron
  desktop: `name: Build Desktop App

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        
    runs-on: \${{ matrix.os }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Setup Rust
      uses: dtolnay/rust-toolchain@stable
      
    - name: Install dependencies (Ubuntu)
      if: matrix.os == 'ubuntu-latest'
      run: |
        sudo apt-get update
        sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build Electron app
      run: npm run build
      env:
        GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        
    - name: Upload artifacts
      uses: actions/upload-artifact@v4
      with:
        name: desktop-app-\${{ matrix.os }}
        path: dist/`,

  // Expo configuration template
  expoConfig: `{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoSubmit": {
        "production": {
          "ios": {
            "appleId": "your-apple-id@example.com",
            "ascAppId": "your-app-id",
            "appleTeamId": "your-team-id"
          },
          "android": {
            "serviceAccountKeyPath": "./google-service-account.json"
          }
        }
      },
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "resourceClass": "medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}`,

  // Vercel configuration template
  vercelConfig: `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`
}

export type WorkflowType = keyof typeof WORKFLOW_TEMPLATES

export function getWorkflowTemplate(type: WorkflowType): string {
  return WORKFLOW_TEMPLATES[type]
}

export function getWorkflowFiles(target: 'mobile' | 'web' | 'desktop'): Array<{path: string, content: string}> {
  const files: Array<{path: string, content: string}> = []
  
  switch (target) {
    case 'mobile':
      files.push({
        path: '.github/workflows/deploy-mobile.yml',
        content: WORKFLOW_TEMPLATES.mobile
      })
      files.push({
        path: 'eas.json',
        content: WORKFLOW_TEMPLATES.expoConfig
      })
      break
      
    case 'web':
      files.push({
        path: '.github/workflows/deploy-web.yml',
        content: WORKFLOW_TEMPLATES.web
      })
      files.push({
        path: 'vercel.json',
        content: WORKFLOW_TEMPLATES.vercelConfig
      })
      break
      
    case 'desktop':
      files.push({
        path: '.github/workflows/deploy-desktop.yml',
        content: WORKFLOW_TEMPLATES.desktop
      })
      break
  }
  
  return files
}
