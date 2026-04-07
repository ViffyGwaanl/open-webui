export type WorkspaceLayout = 'phone' | 'tablet'

export function getWorkspaceLayout({ width }: { width: number; height: number }): WorkspaceLayout {
  return width >= 900 ? 'tablet' : 'phone'
}
