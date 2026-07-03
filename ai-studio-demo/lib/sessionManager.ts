// Stub: Session manager for demo — generates unique session IDs
export function getCanvasSessionId(): string {
  if (typeof window === 'undefined') return 'demo-ssr';
  
  // Use sessionStorage so it resets when tab/browser closes
  let id = sessionStorage.getItem('demo-canvas-session-id');
  if (!id) {
    id = `demo-canvas-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('demo-canvas-session-id', id);
  }
  return id;
}

export function resetCanvasSessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('demo-canvas-session-id');
  }
}
