import AuthGuard from '@/components/auth/auth-guard'
import WorkspaceLayout from '@/components/workspace/workspace-layout'

export default async function WorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  return (
    <AuthGuard>
      <WorkspaceLayout projectId={projectId} />
    </AuthGuard>
  )
}
