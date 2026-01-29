import AuthGuard from '@/components/auth/auth-guard'
import WorkspaceLayout from '@/components/workspace/workspace-layout'

export default function WorkspacePage({ params }: { params: { projectId: string } }) {
  return (
    <AuthGuard>
      <WorkspaceLayout projectId={params.projectId} />
    </AuthGuard>
  )
}
