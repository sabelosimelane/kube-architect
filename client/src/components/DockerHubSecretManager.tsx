import React, { useState } from 'react';
import { Plus, X, Key, Trash2, AlertTriangle, Eye, EyeOff, Copy, Check, Shield, Info } from 'lucide-react';
import type { DockerHubSecret } from '../types';

interface DockerHubSecretManagerProps {
  dockerHubSecrets: DockerHubSecret[];
  namespaces: string[];
  onAddSecret: (secret: DockerHubSecret) => void;
  onDeleteSecret: (secretName: string) => void;
  onClose: () => void;
}

export function DockerHubSecretManager({ 
  dockerHubSecrets, 
  namespaces,
  onAddSecret, 
  onDeleteSecret, 
  onClose 
}: DockerHubSecretManagerProps) {
  const [newSecret, setNewSecret] = useState({
    name: '',
    namespace: 'default',
    dockerServer: 'https://index.docker.io/v1/',
    username: '',
    password: '',
    email: '',
    description: '',
    labels: {} as Record<string, string>,
    annotations: {} as Record<string, string>
  });
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showKubectlCommand, setShowKubectlCommand] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const validateSecretName = (name: string): string[] => {
    const errors: string[] = [];
    
    if (!name) {
      errors.push('Secret name is required');
      return errors;
    }
    
    if (name.length > 253) {
      errors.push('Name must be 253 characters or less');
    }
    
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(name)) {
      errors.push('Use only lowercase letters, numbers, dots, and hyphens');
    }
    
    if (name.startsWith('-') || name.endsWith('-') || name.startsWith('.') || name.endsWith('.')) {
      errors.push('Cannot start or end with hyphen or dot');
    }
    
    if (dockerHubSecrets.some(s => s.name === name)) {
      errors.push('Secret already exists');
    }
    
    return errors;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!newSecret.name) {
      errors.push('Secret name is required');
    } else {
      errors.push(...validateSecretName(newSecret.name));
    }
    
    if (!newSecret.username) {
      errors.push('Username is required');
    }
    
    if (!newSecret.password) {
      errors.push('Password is required');
    }
    
    if (!newSecret.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSecret.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!newSecret.dockerServer) {
      errors.push('Docker server URL is required');
    }
    
    return errors.filter(error => error !== 'Secret name is required' || errors.length === 1);
  };

  const handleSecretNameChange = (name: string) => {
    setNewSecret(prev => ({ ...prev, name }));
    setErrors(validateForm());
  };

  const addLabel = () => {
    if (newLabel.key && newLabel.value) {
      setNewSecret(prev => ({
        ...prev,
        labels: { ...prev.labels, [newLabel.key]: newLabel.value }
      }));
      setNewLabel({ key: '', value: '' });
    }
  };

  const removeLabel = (key: string) => {
    setNewSecret(prev => {
      const { [key]: removed, ...rest } = prev.labels;
      return { ...prev, labels: rest };
    });
  };

  const handleCreateSecret = () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const secret: DockerHubSecret = {
      ...newSecret,
      createdAt: new Date().toISOString()
    };

    onAddSecret(secret);
    setNewSecret({ 
      name: '', 
      namespace: 'default', 
      dockerServer: 'https://index.docker.io/v1/',
      username: '',
      password: '',
      email: '',
      description: '',
      labels: {}, 
      annotations: {} 
    });
    setErrors([]);
  };

  const handleDeleteSecret = (secretName: string) => {
    onDeleteSecret(secretName);
    setDeleteConfirm(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const generateKubectlCommand = (secret: DockerHubSecret) => {
    return `kubectl create secret docker-registry ${secret.name} \\
  --docker-server=${secret.dockerServer} \\
  --docker-username=${secret.username} \\
  --docker-password=${secret.password} \\
  --docker-email=${secret.email} \\
  --namespace=${secret.namespace}`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const generateYaml = (secret: DockerHubSecret) => {
    const dockerConfig = {
      auths: {
        [secret.dockerServer]: {
          username: secret.username,
          password: secret.password,
          email: secret.email,
          auth: btoa(`${secret.username}:${secret.password}`)
        }
      }
    };
    
    const dockerConfigJson = btoa(JSON.stringify(dockerConfig));
    
    return `apiVersion: v1
kind: Secret
metadata:
  name: ${secret.name}
  namespace: ${secret.namespace}
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: ${dockerConfigJson}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Docker Hub Secret Manager</h3>
              <p className="text-sm text-gray-500">Create and manage Docker Hub registry secrets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Create New Secret */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Create New Docker Hub Secret</h4>

              {/* Security Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-yellow-800 mb-1">Security Best Practices</h5>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      <li>• Use Docker Hub access tokens instead of passwords when possible</li>
                      <li>• Rotate credentials regularly</li>
                      <li>• Never commit secrets to version control</li>
                      <li>• Use RBAC to limit access to secrets</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Secret Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret Name *
                </label>
                <input
                  type="text"
                  value={newSecret.name}
                  onChange={(e) => handleSecretNameChange(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleCreateSecret)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.some(e => e.includes('name')) ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="docker-hub-secret"
                />
              </div>

              {/* Namespace and Docker Server */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Namespace
                  </label>
                  <select
                    value={newSecret.namespace}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, namespace: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {namespaces.map(namespace => (
                      <option key={namespace} value={namespace}>
                        {namespace}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Docker Server *
                  </label>
                  <input
                    type="text"
                    value={newSecret.dockerServer}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, dockerServer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://index.docker.io/v1/"
                  />
                </div>
              </div>

              {/* Username and Password */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={newSecret.username}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your-username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password/Token *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newSecret.password}
                      onChange={(e) => setNewSecret(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your-password-or-token"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newSecret.email}
                  onChange={(e) => setNewSecret(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-email@example.com"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newSecret.description}
                  onChange={(e) => setNewSecret(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description of this secret's purpose"
                  rows={2}
                />
              </div>

              {/* Labels */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Labels (Optional)
                  </label>
                  <button
                    onClick={addLabel}
                    disabled={!newLabel.key || !newLabel.value}
                    className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newLabel.key}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, key: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addLabel)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="key"
                  />
                  <input
                    type="text"
                    value={newLabel.value}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addLabel)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="value"
                  />
                </div>
                
                {Object.entries(newSecret.labels).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(newSecret.labels).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="text-sm text-gray-900">
                          <span className="font-medium">{key}</span>: {value}
                        </span>
                        <button
                          onClick={() => removeLabel(key)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Display */}
              {errors.length > 0 && (
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleCreateSecret}
                disabled={!newSecret.name || !newSecret.username || !newSecret.password || !newSecret.email || errors.length > 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Docker Hub Secret</span>
              </button>
            </div>

            {/* Existing Secrets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Existing Docker Hub Secrets</h4>
                <span className="text-sm text-gray-500">{dockerHubSecrets.length} total</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dockerHubSecrets.map((secret) => (
                  <div key={secret.name} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Key className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{secret.name}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {secret.namespace}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowKubectlCommand(showKubectlCommand === secret.name ? null : secret.name)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="Show kubectl command"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        {deleteConfirm === secret.name ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteSecret(secret.name)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(secret.name)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-2 flex items-center space-x-2">
                      <span>Created: {new Date(secret.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Docker Hub
                      </span>
                    </div>

                    {/* Secret Details */}
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Server:</span> {secret.dockerServer}</div>
                      <div><span className="font-medium">Username:</span> {secret.username}</div>
                      <div><span className="font-medium">Email:</span> {secret.email}</div>
                      {secret.description && (
                        <div><span className="font-medium">Description:</span> {secret.description}</div>
                      )}
                    </div>

                    {/* Labels */}
                    {Object.keys(secret.labels).length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">Labels:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(secret.labels).map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* kubectl Command */}
                    {showKubectlCommand === secret.name && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">kubectl Command:</span>
                          <button
                            onClick={() => copyToClipboard(generateKubectlCommand(secret), 'kubectl')}
                            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                          >
                            {copied === 'kubectl' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied === 'kubectl' ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {generateKubectlCommand(secret)}
                        </pre>
                      </div>
                    )}

                    {/* YAML Preview */}
                    {showKubectlCommand === secret.name && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">YAML:</span>
                          <button
                            onClick={() => copyToClipboard(generateYaml(secret), 'yaml')}
                            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                          >
                            {copied === 'yaml' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied === 'yaml' ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {generateYaml(secret)}
                        </pre>
                      </div>
                    )}

                    {/* Delete confirmation warning */}
                    {deleteConfirm === secret.name && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <div className="flex items-center space-x-1 mb-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-medium">Confirm deletion</span>
                        </div>
                        <div>
                          This will remove the Docker Hub Secret and any references to it in deployments.
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {dockerHubSecrets.length === 0 && (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No Docker Hub Secrets</h5>
                    <p className="text-sm text-gray-500">
                      Create your first Docker Hub Secret to store registry credentials
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 