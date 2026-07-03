// Stub: Socket client for demo — returns a mock socket that does nothing
// Real-time collaboration is not available in demo mode

interface MockSocket {
  on: (event: string, cb: (...args: any[]) => void) => MockSocket;
  off: (event: string, cb: (...args: any[]) => void) => MockSocket;
  emit: (event: string, ...args: any[]) => MockSocket;
  disconnect: () => void;
  connected: boolean;
}

const mockSocket: MockSocket = {
  on: () => mockSocket,
  off: () => mockSocket,
  emit: () => mockSocket,
  disconnect: () => {},
  connected: false,
};

export function initializeSocket(): MockSocket {
  return mockSocket;
}

export function getSocket(): MockSocket {
  return mockSocket;
}

export default mockSocket;
