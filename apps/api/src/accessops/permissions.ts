export type Permission = 'read' | 'write' | 'review' | 'manage'
export function grantsAccess(granted: string, needed: Permission) {
  return (
    ['read', 'write', 'review', 'manage'].indexOf(granted) >=
      ['read', 'write', 'review', 'manage'].indexOf(needed) &&
    ['read', 'write', 'review', 'manage'].includes(granted)
  )
}
