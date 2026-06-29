import React, { useEffect, useRef, useState } from 'react';

interface CanvasAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CanvasAppDrawer: React.FC<CanvasAppDrawerProps> = ({ isOpen, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [canvasAppUrl, setCanvasAppUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set canvas-studio URL when drawer opens
  // Uses NEXT_PUBLIC_CANVAS_STUDIO_URL env var; falls back to production URL
  useEffect(() => {
    if (!isOpen) return;
    
    const CANVAS_STUDIO_URL = process.env.NEXT_PUBLIC_CANVAS_STUDIO_URL || 'https://studio.mumtaz.ai';
    
    setIsLoading(true);
    setError(null);
    
    // Just set the URL directly - the iframe will show an error if it's not running
    // This avoids CSP issues with fetch detection
    setTimeout(() => {
      setCanvasAppUrl(CANVAS_STUDIO_URL);
      setIsLoading(false);
    }, 500); // Small delay for UX
    
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Communicate with iframe to handle close
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'close-canvas-drawer') {
        onClose();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose]);

  return (
    <div 
      className={`fixed inset-0 z-[300] transition-transform duration-700 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
    >
      {isLoading && (
        <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center gap-2 text-cyan-400 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-gray-400 text-sm">Connecting to Canvas Studio...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-400 mb-2">Canvas Studio Not Running</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Iframe containing the actual canvas app */}
      {canvasAppUrl && !isLoading && !error && (
        <iframe
          ref={iframeRef}
          src={canvasAppUrl}
          className="w-full h-full border-0 bg-[#0a0a0a]"
          title="Canvas Studio"
          allow="camera; microphone; clipboard-write"
        />
      )}
    </div>
  );
};

export default CanvasAppDrawer;
