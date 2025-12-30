import { useState } from 'react';
import { X, Copy, Check, ExternalLink, Download, Play, Terminal, Container as Docker } from 'lucide-react';

interface DockerRunPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DockerRunPopup({ isOpen, onClose }: DockerRunPopupProps) {
  const [copied, setCopied] = useState(false);
  
  const dockerCommand = 'docker pull same7ammar/kube-composer && docker run -d -p 8080:80 same7ammar/kube-composer';

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(dockerCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = dockerCommand;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Backdrop - click to close */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close Docker popup"
      />
      
      {/* Popup Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-auto overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Docker className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-semibold truncate">Run Locally with Docker</h3>
              <p className="text-xs sm:text-sm text-blue-100 hidden sm:block">Get Kube Composer running on your machine in seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10 flex-shrink-0"
            aria-label="Close popup"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Quick Start */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 sm:p-4 border border-green-200 dark:bg-gradient-to-r dark:from-green-900 dark:to-emerald-900 dark:border-green-800">
            <div className="flex items-center space-x-2 mb-3">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <h4 className="font-semibold text-green-900 text-sm sm:text-base dark:text-green-200">Quick Start</h4>
            </div>
            <p className="text-xs sm:text-sm text-green-800 mb-3 sm:mb-4 dark:text-green-200">
              Run this single command to pull and start Kube Composer locally in the background:
            </p>
            
            {/* Command Box */}
            <div className="bg-gray-900 rounded-lg p-3 sm:p-4 relative dark:bg-gray-800 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 text-xs sm:text-sm font-mono">Terminal</span>
                </div>
                <button
                  onClick={handleCopyCommand}
                  className="inline-flex items-center justify-center space-x-1 px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs sm:text-sm transition-colors duration-200 w-full sm:w-auto"
                  title="Copy command to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <code className="text-green-400 font-mono text-xs sm:text-sm block break-all leading-relaxed">
                {dockerCommand}
              </code>
            </div>
          </div>

          {/* Step by Step Instructions */}
          <div className="space-y-3 sm:space-y-4 dark:text-gray-200">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm sm:text-base dark:text-gray-200">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">1</span>
              <span>Prerequisites</span>
            </h4>
            <div className="ml-6 sm:ml-8 space-y-2">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-200">
                Make sure you have Docker installed on your system:
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <a
                  href="https://docs.docker.com/get-docker/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
                >
                  <Download className="w-3 h-3 flex-shrink-0" />
                  <span>Install Docker</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <a
                  href="https://docs.docker.com/desktop/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
                >
                  <span>Docker Desktop</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            </div>

            <h4 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm sm:text-base dark:text-gray-200">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">2</span>
              <span>Run the Command</span>
            </h4>
            <div className="ml-6 sm:ml-8 space-y-2">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-200">
                Open your terminal and run the command above. This will:
              </p>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside ml-2 sm:ml-4 dark:text-gray-200">
                <li>Pull the latest Kube Composer Docker image</li>
                <li>Start the container in detached mode (background)</li>
                <li>Make it accessible at <code className="bg-gray-100 px-1 rounded text-xs dark:bg-gray-700">http://localhost:8080</code></li>
              </ul>
            </div>

            <h4 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm sm:text-base dark:text-gray-200">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">3</span>
              <span>Access the Application</span>
            </h4>
            <div className="ml-6 sm:ml-8 space-y-2">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-200">
                Once the container is running, open your browser and navigate to:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-700 dark:border-blue-600">
                <a
                  href="http://localhost:8080"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-700 hover:text-blue-800 font-medium text-sm sm:text-base break-all dark:text-blue-200"
                >
                  <span>http://localhost:8080</span>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                </a>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-purple-200 dark:bg-gradient-to-r dark:from-purple-900 dark:to-indigo-900 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 mb-3 text-sm sm:text-base dark:text-purple-200">Why Run Locally?</h4>
            <ul className="text-xs sm:text-sm text-purple-800 space-y-1 dark:text-purple-200">
              <li>• <strong>Privacy:</strong> Your data never leaves your machine</li>
              <li>• <strong>Speed:</strong> No network latency, instant responses</li>
              <li>• <strong>Offline:</strong> Works without internet connection</li>
              <li>• <strong>Customization:</strong> Modify and extend as needed</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-t border-gray-200 bg-gray-50 dark:bg-gray-800 space-y-3 sm:space-y-0 flex-shrink-0">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-200">
            <p className="flex items-center">
              <Docker className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-600 flex-shrink-0" />
              <span className="mr-1">Image:</span>
              <code className="bg-gray-200 px-1 rounded text-xs break-all dark:bg-gray-700 dark:text-gray-200">same7ammar/kube-composer</code>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <a
              href="https://hub.docker.com/r/same7ammar/kube-composer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center sm:justify-start text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>View on Docker Hub</span>
              <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs sm:text-sm font-medium w-full sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}