import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: 'Vibe Coding',
    short_name: 'VibeCoding',
    description: 'AI-powered code generation and collaboration platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['productivity', 'developer', 'education'],
    lang: 'en',
    dir: 'ltr',
    prefer_related_applications: [],
    screenshots: [
      {
        src: '/screenshots/desktop-1.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Desktop workspace view',
      },
      {
        src: '/screenshots/mobile-1.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Mobile workspace view',
      },
    ],
    shortcuts: [
      {
        name: 'New Project',
        short_name: 'New',
        description: 'Create a new coding project',
        url: '/dashboard?action=new',
        icons: [{ src: '/icons/new-project.png', sizes: '96x96' }],
      },
      {
        name: 'AI Assistant',
        short_name: 'AI',
        description: 'Open AI coding assistant',
        url: '/ai-chat',
        icons: [{ src: '/icons/ai-assistant.png', sizes: '96x96' }],
      },
    ],
    related_applications: [],
    edge_side_panel: {
      preferred_width: 400,
    },
    launch_handler: {
      client_mode: ['navigate-existing', 'focus-existing'],
    },
    handle_links: 'preferred',
    capture_links: 'existing-client-navigate',
    protocol_handlers: [
      {
        protocol: 'web+vibecoding',
        url: '/handle-protocol?url=%s',
      },
    ],
    file_handlers: [
      {
        action: '/open-file',
        accept: {
          'text/javascript': ['.js', '.jsx', '.ts', '.tsx'],
          'text/html': ['.html', '.htm'],
          'text/css': ['.css'],
          'text/plain': ['.txt', '.md'],
        },
      },
    ],
    share_target: [
      {
        action: '/share-code',
        method: 'POST',
        enctype: 'multipart/form-data',
        params: {
          title: 'title',
          text: 'text',
          url: 'url',
          files: [
            {
              name: 'code',
              accept: ['text/*'],
            },
          ],
        },
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': 'application/manifest+json',
    },
  })
}
