import { useEffect, useState } from 'react';
import { X, RefreshCw, Youtube } from 'lucide-react';

interface YouTubePopupProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

export function YouTubePopup({ isOpen, onClose, videoId }: YouTubePopupProps) {
  const [embedError, setEmbedError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
      // Reset states when opening
      setEmbedError(false);
      setLoading(true);
      setRetryCount(0);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleIframeLoad = () => {
    setLoading(false);
    setEmbedError(false);
  };

  const handleIframeError = () => {
    setEmbedError(true);
    setLoading(false);
  };

  const openYouTubeDirectly = () => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
  };

  const retryEmbed = () => {
    setEmbedError(false);
    setLoading(true);
    setRetryCount(prev => prev + 1);
  };

  // Auto-fallback to YouTube link after 5 seconds of loading
  useEffect(() => {
    if (loading && !embedError) {
      const timer = setTimeout(() => {
        if (loading) {
          setEmbedError(true);
          setLoading(false);
        }
      }, 5000); // Fixed: Use 5000ms instead of dependency array

      return () => clearTimeout(timer);
    }
  }, [loading, embedError, retryCount]);

  if (!isOpen) return null;

  // Try different embed approaches based on retry count
  const getEmbedUrl = () => {
    const baseParams = {
      autoplay: '1',
      rel: '0',
      modestbranding: '1',
      fs: '1',
      cc_load_policy: '0',
      iv_load_policy: '3',
      autohide: '0',
      enablejsapi: '1'
    };

    if (retryCount === 0) {
      // First try: youtube-nocookie with origin
      return `https://www.youtube-nocookie.com/embed/${videoId}?` + 
        new URLSearchParams({
          ...baseParams,
          origin: window.location.origin,
          widget_referrer: window.location.href
        }).toString();
    } else if (retryCount === 1) {
      // Second try: regular youtube.com
      return `https://www.youtube.com/embed/${videoId}?` + 
        new URLSearchParams(baseParams).toString();
    } else {
      // Third try: minimal parameters
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      {/* Backdrop - click to close */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close video popup"
      />
      
      {/* Video Container */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Kube Composer Demo</h3>
              <p className="text-sm text-red-100">Learn how to use Kube Composer in minutes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10"
            aria-label="Close video"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Content */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
          {/* Loading State */}
          {loading && !embedError && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading video...</p>
                <p className="text-sm text-gray-500 mt-2">
                  {retryCount > 0 && `Attempt ${retryCount + 1}`}
                </p>
              </div>
            </div>
          )}

          {/* Iframe Embed */}
          {!embedError && (
            <iframe
              key={retryCount} // Force re-render on retry
              className="absolute top-0 left-0 w-full h-full"
              src={getEmbedUrl()}
              title="Kube Composer Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
              loading="lazy"
            />
          )}

          {/* Fallback content when embed fails */}
          {embedError && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center p-8 max-w-md">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Youtube className="w-10 h-10 text-red-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Let's Watch on YouTube!</h4>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Due to browser security settings, we'll open the video directly on YouTube for the best viewing experience.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={openYouTubeDirectly}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-lg"
                  >
                    <Youtube className="w-5 h-5 mr-2" />
                    Watch on YouTube
                  </button>
                  
                  {retryCount < 2 && (
                    <button
                      onClick={retryEmbed}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Embedding Again
                    </button>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Why YouTube?</strong> Some browsers block embedded videos for security. 
                    YouTube provides the best quality and fastest loading experience.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-600">
              <p className="flex items-center">
                <span className="mr-2">🎯</span>
                Learn how to create Kubernetes deployments visually
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={openYouTubeDirectly}
                className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
              >
                <Youtube className="w-3 h-3 mr-1" />
                Open in YouTube
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}