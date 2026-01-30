export type ProjectType = 'web_app' | 'landing_page' | 'mobile_app' | 'api_service' | 'desktop_app';
export type Framework = 'react' | 'vue' | 'nextjs' | 'node' | 'electron';
export type Styling = 'tailwind' | 'css_modules' | 'styled_components';

export interface ProjectBlueprint {
  name: string;
  type: ProjectType;
  framework: Framework;
  styling: Styling;
  description: string;
  features: string[];
  rationale?: string;
}

export const STACK_PRESETS: Record<ProjectType, Framework[]> = {
  web_app: ['react', 'vue', 'nextjs'],
  landing_page: ['react', 'nextjs'],
  mobile_app: ['react'], // React Native (via Expo web for now)
  api_service: ['node'],
  desktop_app: ['electron'] // Electron + React
};

export const FEATURE_OPTIONS = [
  { id: 'auth', label: 'Authentication', icon: '🔐' },
  { id: 'database', label: 'Database', icon: '🗄️' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'api', label: 'API Integration', icon: '🔌' },
  { id: 'realtime', label: 'Real-time', icon: '⚡' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'cms', label: 'CMS', icon: '📝' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' }
];
