import React, { useState, useEffect } from 'react';
import { Plus, X, Key, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import type { Secret } from '../types';

interface SecretManagerProps {
  secrets: Secret[];
  namespaces: string[];
  onAddSecret: (secret: Secret) => void;
  onUpdateSecret: (secret: Secret, index: number) => void;
  onClose: () => void;
  editingIndex?: number;
}

export function SecretManager({ 
  secrets,
  namespaces,
  onAddSecret, 
  onUpdateSecret,
  onClose,
  editingIndex
}: SecretManagerProps) {
  const [newSecret, setNewSecret] = useState({
    name: '',
    namespace: 'default',
    type: 'Opaque' as Secret['type'],
    labels: {} as Record<string, string>,
    annotations: {} as Record<string, string>,
    data: {} as Record<string, string>
  });
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [newDataEntry, setNewDataEntry] = useState({ key: '', value: '' });
  const [errors, setErrors] = useState<string[]>([]);
  
  // Docker Hub specific state
  const [dockerHubFields, setDockerHubFields] = useState({
    dockerServer: 'https://index.docker.io/v1/',
    username: '',
    password: '',
    email: '',
    showPassword: false
  });

  // TLS specific state
  const [tlsFields, setTlsFields] = useState({
    tlsCert: '',
    tlsKey: '',
    showTlsKey: false
  });

  const isEditing = editingIndex !== undefined;

  // Populate form when editing
  useEffect(() => {
    if (isEditing && secrets[editingIndex]) {
      const secret = secrets[editingIndex];
      setNewSecret({
        name: secret.name,
        namespace: secret.namespace,
        type: secret.type,
        labels: { ...secret.labels },
        annotations: { ...secret.annotations },
        data: { ...secret.data }
      });

      if (secret.type === 'kubernetes.io/dockerconfigjson') {
        try {
          const dockerConfig = JSON.parse(secret.data['.dockerconfigjson']);
          const auth = dockerConfig.auths[Object.keys(dockerConfig.auths)[0]];
          setDockerHubFields({
            dockerServer: Object.keys(dockerConfig.auths)[0] || 'https://index.docker.io/v1/',
            username: auth.username || '',
            password: auth.password || '',
            email: auth.email || '',
            showPassword: false
          });
        } catch (e) {
          // If parsing fails, keep default values
          setDockerHubFields({
            dockerServer: 'https://index.docker.io/v1/',
            username: '',
            password: '',
            email: '',
            showPassword: false
          });
        }
      } else if (secret.type === 'kubernetes.io/tls') {
        setTlsFields({
          tlsCert: secret.data['tls.crt'] || '',
          tlsKey: secret.data['tls.key'] || '',
          showTlsKey: false
        });
      }
    }
  }, [isEditing, editingIndex, secrets]);

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
    
    // Check for duplicate names only when creating new secret
    if (!isEditing && secrets.some(s => s.name === name)) {
      errors.push('Secret already exists');
    }
    
    return errors;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    // Validate secret name
    if (!newSecret.name.trim()) {
      errors.push('Secret name is required');
    } else {
      const nameErrors = validateSecretName(newSecret.name);
      errors.push(...nameErrors);
    }
    
    if (newSecret.type === 'kubernetes.io/dockerconfigjson') {
      // Docker Hub specific validation
      if (!dockerHubFields.dockerServer.trim()) {
        errors.push('Docker Server is required');
      }
      if (!dockerHubFields.username.trim()) {
        errors.push('Username is required');
      }
      if (!dockerHubFields.password.trim()) {
        errors.push('Password/Token is required');
      }
      if (dockerHubFields.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dockerHubFields.email.trim())) {
        errors.push('Please enter a valid email address');
      }
    } else if (newSecret.type === 'kubernetes.io/tls') {
      // TLS specific validation
      if (!tlsFields.tlsCert.trim()) {
        errors.push('TLS Certificate is required');
      } else {
        // Basic PEM format validation for certificate
        const cert = tlsFields.tlsCert.trim();
        if (!cert.includes('-----BEGIN CERTIFICATE-----') && !cert.includes('-----END CERTIFICATE-----')) {
          errors.push('TLS Certificate must be in PEM format');
        }
      }
      
      if (!tlsFields.tlsKey.trim()) {
        errors.push('TLS Private Key is required');
      } else {
        // Basic PEM format validation for private key
        const key = tlsFields.tlsKey.trim();
        if (!key.includes('-----BEGIN') && !key.includes('-----END')) {
          errors.push('TLS Private Key must be in PEM format');
        }
      }
    } else {
      // Regular secret validation
      if (Object.keys(newSecret.data).length === 0) {
        errors.push('At least one data entry is required');
      }
    }
    
    return errors;
  };

  const handleSecretNameChange = (name: string) => {
    setNewSecret(prev => ({ ...prev, name }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
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

  const addDataEntry = () => {
    if (newDataEntry.key && newDataEntry.value) {
      setNewSecret(prev => ({
        ...prev,
        data: { ...prev.data, [newDataEntry.key]: newDataEntry.value }
      }));
      setNewDataEntry({ key: '', value: '' });
      if (errors.length > 0) {
        setErrors([]);
      }
    }
  };

  const removeDataEntry = (key: string) => {
    setNewSecret(prev => {
      const { [key]: removed, ...rest } = prev.data;
      return { ...prev, data: rest };
    });
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleCreateSecret = () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    let secret: Secret;

    if (newSecret.type === 'kubernetes.io/dockerconfigjson') {
      // Create Docker Hub secret
      const dockerConfig = {
        auths: {
          [dockerHubFields.dockerServer]: {
            username: dockerHubFields.username,
            password: dockerHubFields.password,
            email: dockerHubFields.email,
            auth: btoa(`${dockerHubFields.username}:${dockerHubFields.password}`)
          }
        }
      };
      
      secret = {
        ...newSecret,
        data: {
          '.dockerconfigjson': JSON.stringify(dockerConfig)
        },
        createdAt: isEditing ? secrets[editingIndex!].createdAt : new Date().toISOString()
      };
    } else if (newSecret.type === 'kubernetes.io/tls') {
      // Create TLS secret following Kubernetes standards
      // Clean and normalize the certificate and private key data
      let cleanCert = tlsFields.tlsCert.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      let cleanKey = tlsFields.tlsKey.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // Remove any extra whitespace and ensure proper line breaks
      cleanCert = cleanCert.replace(/\n\s*\n/g, '\n').replace(/^\s+|\s+$/gm, '');
      cleanKey = cleanKey.replace(/\n\s*\n/g, '\n').replace(/^\s+|\s+$/gm, '');
      
      // Ensure proper PEM format with correct headers and footers
      if (!cleanCert.includes('-----BEGIN CERTIFICATE-----')) {
        cleanCert = `-----BEGIN CERTIFICATE-----\n${cleanCert}\n-----END CERTIFICATE-----`;
      }
      
      // Handle different private key formats
      if (!cleanKey.includes('-----BEGIN PRIVATE KEY-----') && 
          !cleanKey.includes('-----BEGIN RSA PRIVATE KEY-----') &&
          !cleanKey.includes('-----BEGIN EC PRIVATE KEY-----')) {
        cleanKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
      }
      
      // Validate certificate format (basic check)
      if (!cleanCert.match(/-----BEGIN CERTIFICATE-----\n[\s\S]*\n-----END CERTIFICATE-----/)) {
        throw new Error('Invalid certificate format. Please ensure the certificate is in PEM format.');
      }
      
      // Validate private key format (basic check)
      if (!cleanKey.match(/-----BEGIN (PRIVATE KEY|RSA PRIVATE KEY|EC PRIVATE KEY)-----\n[\s\S]*\n-----END (PRIVATE KEY|RSA PRIVATE KEY|EC PRIVATE KEY)-----/)) {
        throw new Error('Invalid private key format. Please ensure the private key is in PEM format.');
      }
      
      secret = {
        ...newSecret,
        data: {
          'tls.crt': cleanCert,
          'tls.key': cleanKey
        },
        createdAt: isEditing ? secrets[editingIndex!].createdAt : new Date().toISOString()
      };
    } else {
      // Create regular secret
      if (Object.keys(newSecret.data).length === 0) {
        setErrors(['At least one data entry is required']);
        return;
      }
      
      secret = {
        ...newSecret,
        createdAt: isEditing ? secrets[editingIndex!].createdAt : new Date().toISOString()
      };
    }

    if (isEditing) {
      onUpdateSecret(secret, editingIndex!);
    } else {
      onAddSecret(secret);
    }
    
    // Reset form
    setNewSecret({ 
      name: '', 
      namespace: 'default', 
      type: 'Opaque',
      labels: {}, 
      annotations: {}, 
      data: {} 
    });
    setDockerHubFields({
      dockerServer: 'https://index.docker.io/v1/',
      username: '',
      password: '',
      email: '',
      showPassword: false
    });
    setTlsFields({
      tlsCert: '',
      tlsKey: '',
      showTlsKey: false
    });
    setErrors([]);
  };



  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const handleSecretTypeChange = (type: Secret['type']) => {
    setNewSecret(prev => ({ ...prev, type }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 dark:bg-opacity-80">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Secret Manager</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? 'Edit existing Kubernetes Secret' : 'Create and manage Kubernetes Secrets'}
              </p>
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
          <div className="p-8">
            {/* Create New Secret */}
            <div className="max-w-2xl mx-auto space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Secret' : 'Create New Secret'}
              </h4>
              
              {/* Validation Errors Summary */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 dark:bg-red-700 dark:border-red-800 dark:text-red-100">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-100 flex-shrink-0" />
                    <span className="text-sm font-semibold text-red-800 dark:text-red-100">
                      Please fix the following {errors.length} error{errors.length > 1 ? 's' : ''}:
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-6">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-100">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Secret Name */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Secret Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newSecret.name}
                    onChange={(e) => handleSecretNameChange(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleCreateSecret)}
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      errors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="my-secret"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Key className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                {errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 px-2 py-1 rounded-md dark:bg-red-700 dark:border-red-800 dark:text-red-100">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Namespace and Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Namespace
                  </label>
                  <div className="relative">
                    <select
                      value={newSecret.namespace}
                      onChange={(e) => setNewSecret(prev => ({ ...prev, namespace: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 appearance-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      {namespaces.map(namespace => (
                        <option key={namespace} value={namespace}>
                          {namespace}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      value={newSecret.type}
                      onChange={(e) => handleSecretTypeChange(e.target.value as Secret['type'])}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 appearance-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Opaque">Opaque</option>
                      <option value="kubernetes.io/tls">TLS</option>
                      <option value="kubernetes.io/dockerconfigjson">Docker Config</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

                            {/* Conditional Form Fields */}
              {newSecret.type === 'kubernetes.io/dockerconfigjson' ? (
                <>
                  {/* Docker Server */}
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Docker Server *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dockerHubFields.dockerServer}
                        onChange={(e) => {
                          setDockerHubFields(prev => ({ ...prev, dockerServer: e.target.value }));
                          if (errors.length > 0) {
                            setErrors([]);
                          }
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="https://index.docker.io/v1/"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Username and Password */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Username *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={dockerHubFields.username}
                          onChange={(e) => {
                            setDockerHubFields(prev => ({ ...prev, username: e.target.value }));
                            if (errors.length > 0) {
                              setErrors([]);
                            }
                          }}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="your-username"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Password/Token *
                      </label>
                      <div className="relative">
                        <input
                          type={dockerHubFields.showPassword ? 'text' : 'password'}
                          value={dockerHubFields.password}
                          onChange={(e) => {
                            setDockerHubFields(prev => ({ ...prev, password: e.target.value }));
                            if (errors.length > 0) {
                              setErrors([]);
                            }
                          }}
                          className="w-full px-3 py-2 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="your-password-or-token"
                        />
                        <button
                          type="button"
                          onClick={() => setDockerHubFields(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          {dockerHubFields.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={dockerHubFields.email}
                        onChange={(e) => {
                          setDockerHubFields(prev => ({ ...prev, email: e.target.value }));
                          if (errors.length > 0) {
                            setErrors([]);
                          }
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="your-email@example.com"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              ) : newSecret.type === 'kubernetes.io/tls' ? (
                <>
                  {/* TLS Certificate */}
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      TLS Certificate *
                    </label>
                    <div className="relative">
                      <textarea
                        value={tlsFields.tlsCert}
                        onChange={(e) => {
                          setTlsFields(prev => ({ ...prev, tlsCert: e.target.value }));
                          if (errors.length > 0) {
                            setErrors([]);
                          }
                        }}
                        rows={5}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 resize-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="-----BEGIN CERTIFICATE-----&#10;MIIEpDCCA4ygAwIBAgIJANu87C4XJqzoMA0GCSqGSIb3DQEBCwUAMFsxCzAJ&#10;BgNVBAYTAlVTMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRl&#10;cm5ldCBXaWRnaXRzIFB0eSBMdGQxGzAZBgNVBAMMEnRlc3QuZXhhbXBsZS5j&#10;b20wHhcNMTkwMzI2MTY0NzQ3WhcNMTkwNDI1MTY0NzQ3WjBbMQswCQYDVQQG&#10;EwJVUzETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQg&#10;V2lkZ2l0cyBQdHkgTHRkMRswGQYDVQQDDBJ0ZXN0LmV4YW1wbGUuY29tMIIB&#10;IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...&#10;-----END CERTIFICATE-----"
                      />
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* TLS Private Key */}
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      TLS Private Key *
                    </label>
                    <div className="relative">
                      <textarea
                        value={tlsFields.tlsKey}
                        onChange={(e) => {
                          setTlsFields(prev => ({ ...prev, tlsKey: e.target.value }));
                          if (errors.length > 0) {
                            setErrors([]);
                          }
                        }}
                        rows={5}
                        className="w-full px-3 py-2 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 resize-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us&#10;8cKllM0jqGwvCLWTjGTI+UuRADFJjQHsqE1bB1g4iJ+w1hDI1rRi7uF68KFq&#10;Q1p5yJgRkllqHqC6UcJHVYkbZQVZsbSBaGID9THxSXoKICg6B0NqE2tAhu1P&#10;7OEKw0zsqfGtH1CnJjLl4Cu4iHir7THmlaXkZd4lIH2bP/90PFDnZv/kyLD&#10;XfmctNqDk1KjaBvMLhP6ShLFgyAaoX6ma6QMWUQKhqUFKwmvBvYF9dlqHmH&#10;tHtJ0AlUB8oTy1vtpJMeQOjypZflQcHty2M33uC0WH0eosEtdj8SP/g0B5i&#10;Sg2XojfGPvx4tQMx7yNTRjXlLWy1QwIDAQABAoIBAQCwWa1OvrjBdBmLF&#10;yJQazX7x8V2mh41jqK5k8sDPjSbHOqWb98fopgLvu9oTqUq0yfBm/5Ka8&#10;vUlX4W9o2f+2xJjCsvul9iV+ZBcsGxL0AaKNMo2CHqtQaRieF0frPELmQ&#10;IRdr6WATx0HMA4ByW7oaMgy4Pl4ma3TdyfSp0NxScsF7r7KndCbf8SgQL&#10;R2iYjJR1o3YJpByjZJpQUP9jH4mV1Q4PSnQXyRieWCmH+fhXp3Xmqj&#10;vEl2B4JU3jWIlmDo5TM4TsAsj3YQcMlqZbwB1l3RZ/LUxOVdxQy2T5g&#10;5Xylf1jNlCzr9a2fUgp2ZSWi5FbJDuMhLbqXWZN0kD4jZv6L6yU&#10;-----END PRIVATE KEY-----"
                      />
                      <button
                        type="button"
                        onClick={() => setTlsFields(prev => ({ ...prev, showTlsKey: !prev.showTlsKey }))}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {tlsFields.showTlsKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Data Entries for regular secrets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Data *
                      </label>
                      <button
                        onClick={addDataEntry}
                        disabled={!newDataEntry.key || !newDataEntry.value}
                        className="inline-flex items-center px-2 py-1 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Entry
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={newDataEntry.key}
                          onChange={(e) => setNewDataEntry(prev => ({ ...prev, key: e.target.value }))}
                          onKeyPress={(e) => handleKeyPress(e, addDataEntry)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="key"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          value={newDataEntry.value}
                          onChange={(e) => setNewDataEntry(prev => ({ ...prev, value: e.target.value }))}
                          onKeyPress={(e) => handleKeyPress(e, addDataEntry)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="value"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {Object.entries(newSecret.data).length > 0 && (
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Added Data:</h4>
                        {Object.entries(newSecret.data).map(([key]) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-800 dark:text-gray-300">{key}</div>
                              <div className="text-xs text-gray-500 font-mono dark:text-gray-400">••••••••</div>
                            </div>
                            <button
                              onClick={() => removeDataEntry(key)}
                              className="ml-2 text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded-full hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Labels */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Labels (Optional)
                  </label>
                  <button
                    onClick={addLabel}
                    disabled={!newLabel.key || !newLabel.value}
                    className="inline-flex items-center px-2 py-1 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Label
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={newLabel.key}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, key: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, addLabel)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="key"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={newLabel.value}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, addLabel)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="value"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {Object.entries(newSecret.labels).length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Added Labels:</h4>
                    {Object.entries(newSecret.labels).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm dark:bg-gradient-to-r dark:from-blue-900 dark:to-blue-800 dark:border-blue-700">
                        <span className="text-sm text-gray-800 dark:text-gray-300">
                          <span className="font-semibold text-blue-800 dark:text-blue-300">{key}</span>
                          <span className="mx-2 text-gray-400 dark:text-gray-400">:</span>
                          <span className="text-blue-700 dark:text-blue-300">{value}</span>
                        </span>
                        <button
                          onClick={() => removeLabel(key)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded-full hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateSecret}
                disabled={!newSecret.name.trim() || (
                  newSecret.type !== 'kubernetes.io/dockerconfigjson' && 
                  newSecret.type !== 'kubernetes.io/tls' && 
                  Object.keys(newSecret.data).length === 0
                )}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                {isEditing ? (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Update Secret</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Secret</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}