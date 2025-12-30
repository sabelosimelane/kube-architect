import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle, Settings, Users, Key } from 'lucide-react';
import type { ServiceAccount, Secret } from '../types';

interface ServiceAccountManagerProps {
  serviceAccounts: ServiceAccount[];
  namespaces: string[];
  secrets: Secret[];
  onAddServiceAccount: (serviceAccount: ServiceAccount) => void;
  onUpdateServiceAccount: (serviceAccount: ServiceAccount, index: number) => void;
  onClose: () => void;
  editingIndex?: number;
}

export function ServiceAccountManager({ 
  serviceAccounts,
  namespaces, 
  secrets,
  onAddServiceAccount, 
  onUpdateServiceAccount,
  onClose,
  editingIndex
}: ServiceAccountManagerProps) {
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [labels, setLabels] = useState<Array<{ key: string; value: string }>>([]);
  const [annotations, setAnnotations] = useState<Array<{ key: string; value: string }>>([]);
  const [selectedSecrets, setSelectedSecrets] = useState<Array<{ name: string }>>([]);
  const [selectedImagePullSecrets, setSelectedImagePullSecrets] = useState<Array<{ name: string }>>([]);
  const [automountServiceAccountToken, setAutomountServiceAccountToken] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = editingIndex !== undefined;

  useEffect(() => {
    if (isEditing && serviceAccounts[editingIndex]) {
      const sa = serviceAccounts[editingIndex];
      setName(sa.name);
      setNamespace(sa.namespace);
      setLabels(Object.entries(sa.labels).map(([key, value]) => ({ key, value })));
      setAnnotations(Object.entries(sa.annotations).map(([key, value]) => ({ key, value })));
      setSelectedSecrets(sa.secrets || []);
      setSelectedImagePullSecrets(sa.imagePullSecrets || []);
      setAutomountServiceAccountToken(sa.automountServiceAccountToken !== false);
    }
  }, [isEditing, editingIndex, serviceAccounts]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Service Account name is required';
    } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
      newErrors.name = 'Invalid format. Use lowercase letters, numbers, and hyphens.';
    } else if (name.length > 253) {
      newErrors.name = 'Service Account name must be 253 characters or less';
    }

    if (!namespace.trim()) {
      newErrors.namespace = 'Namespace is required';
    } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(namespace)) {
      newErrors.namespace = 'Invalid namespace format. Use lowercase letters, numbers, and hyphens.';
    }

    // Check for duplicate service account name in the same namespace
    const isDuplicate = serviceAccounts.some((sa, index) => 
      sa.name === name && 
      sa.namespace === namespace && 
      (!isEditing || index !== editingIndex)
    );

    if (isDuplicate) {
      newErrors.name = 'A Service Account with this name already exists in this namespace';
    }

    // Validate labels
    labels.forEach((label, index) => {
      if (label.key && !label.value) {
        newErrors[`label-${index}`] = 'Label value is required when key is provided';
      }
      if (label.key && !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(label.key)) {
        newErrors[`label-${index}`] = 'Invalid label key format';
      }
    });

    // Validate annotations
    annotations.forEach((annotation, index) => {
      if (annotation.key && !annotation.value) {
        newErrors[`annotation-${index}`] = 'Annotation value is required when key is provided';
      }
    });

    // Validate secrets
    selectedSecrets.forEach((secret, index) => {
      if (!secret.name.trim()) {
        newErrors[`secret-${index}`] = 'Secret name is required';
      }
    });

    // Validate image pull secrets
    selectedImagePullSecrets.forEach((secret, index) => {
      if (!secret.name.trim()) {
        newErrors[`imagePullSecret-${index}`] = 'Image pull secret name is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const labelsObj = labels.reduce((acc, { key, value }) => {
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const annotationsObj = annotations.reduce((acc, { key, value }) => {
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const serviceAccount: ServiceAccount = {
      name: name.trim(),
      namespace,
      labels: labelsObj,
      annotations: annotationsObj,
      secrets: selectedSecrets.length > 0 ? selectedSecrets : undefined,
      imagePullSecrets: selectedImagePullSecrets.length > 0 ? selectedImagePullSecrets : undefined,
      automountServiceAccountToken,
      createdAt: isEditing ? serviceAccounts[editingIndex!].createdAt : new Date().toISOString()
    };

    if (isEditing) {
      onUpdateServiceAccount(serviceAccount, editingIndex!);
    } else {
      onAddServiceAccount(serviceAccount);
    }
    onClose();
  };

  const addLabel = () => {
    setLabels([...labels, { key: '', value: '' }]);
  };

  const updateLabel = (index: number, field: 'key' | 'value', value: string) => {
    const newLabels = [...labels];
    newLabels[index][field] = value;
    setLabels(newLabels);
  };

  const removeLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index));
  };

  const addAnnotation = () => {
    setAnnotations([...annotations, { key: '', value: '' }]);
  };

  const updateAnnotation = (index: number, field: 'key' | 'value', value: string) => {
    const newAnnotations = [...annotations];
    newAnnotations[index][field] = value;
    setAnnotations(newAnnotations);
  };

  const removeAnnotation = (index: number) => {
    setAnnotations(annotations.filter((_, i) => i !== index));
  };

  const addSecret = () => {
    setSelectedSecrets([...selectedSecrets, { name: '' }]);
  };

  const updateSecret = (index: number, value: string) => {
    const newSecrets = [...selectedSecrets];
    newSecrets[index].name = value;
    setSelectedSecrets(newSecrets);
  };

  const removeSecret = (index: number) => {
    setSelectedSecrets(selectedSecrets.filter((_, i) => i !== index));
  };

  const addImagePullSecret = () => {
    setSelectedImagePullSecrets([...selectedImagePullSecrets, { name: '' }]);
  };

  const updateImagePullSecret = (index: number, value: string) => {
    const newImagePullSecrets = [...selectedImagePullSecrets];
    newImagePullSecrets[index].name = value;
    setSelectedImagePullSecrets(newImagePullSecrets);
  };

  const removeImagePullSecret = (index: number) => {
    setSelectedImagePullSecrets(selectedImagePullSecrets.filter((_, i) => i !== index));
  };

  const availableSecrets = secrets.filter(s => s.namespace === namespace);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 dark:bg-opacity-80">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Service Account' : 'Create Service Account'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? 'Update service account configuration' : 'Configure authentication for your applications'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 "
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg p-4 space-y-4 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h4 className="font-medium text-gray-900 flex items-center dark:text-white">
                <Settings className="w-4 h-4 mr-2" />
                Basic Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service Account Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="my-service-account"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Namespace *
                  </label>
                  <select
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      errors.namespace ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    {namespaces.map((ns) => (
                      <option key={ns} value={ns}>
                        {ns}
                      </option>
                    ))}
                  </select>
                  {errors.namespace && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.namespace}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Account Settings */}
            <div className="bg-white rounded-lg p-4 space-y-4 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h4 className="font-medium text-gray-900 flex items-center dark:text-white">
                <Key className="w-4 h-4 mr-2" />
                Service Account Settings
              </h4>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="automountToken"
                  checked={automountServiceAccountToken}
                  onChange={(e) => setAutomountServiceAccountToken(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="automountToken" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Auto-mount service account token
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                When enabled, the service account token will be automatically mounted into pods
              </p>
            </div>

            {/* Secrets */}
            <div className="bg-white rounded-lg p-4 space-y-4 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">Secrets</h4>
                <button
                  type="button"
                  onClick={addSecret}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Secret
                </button>
              </div>

              {selectedSecrets.map((secret, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <select
                      value={secret.name}
                      onChange={(e) => updateSecret(index, e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        errors[`secret-${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a secret...</option>
                      {availableSecrets.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name} ({s.type})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeSecret(index)}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {errors[`secret-${index}`] && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors[`secret-${index}`]}
                    </p>
                  )}
                </div>
              ))}

              {selectedSecrets.length === 0 && (
                <p className="text-sm text-gray-500 italic dark:text-gray-400">No secrets configured</p>
              )}
            </div>

            {/* Image Pull Secrets */}
            <div className="bg-white rounded-lg p-4 space-y-4 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">Image Pull Secrets</h4>
                <button
                  type="button"
                  onClick={addImagePullSecret}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Image Pull Secret
                </button>
              </div>

              {selectedImagePullSecrets.map((secret, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <select
                      value={secret.name}
                      onChange={(e) => updateImagePullSecret(index, e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        errors[`imagePullSecret-${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select an image pull secret...</option>
                      {availableSecrets.filter(s => s.type === 'kubernetes.io/dockerconfigjson').map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeImagePullSecret(index)}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {errors[`imagePullSecret-${index}`] && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors[`imagePullSecret-${index}`]}
                  </p>
                  )}
                </div>
              ))}

              {selectedImagePullSecrets.length === 0 && (
                <p className="text-sm text-gray-500 italic dark:text-gray-400">No image pull secrets configured</p>
              )}
            </div>

            {/* Labels */}
            <div className="bg-white rounded-lg p-4 space-y-4 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">Labels</h4>
                <button
                  type="button"
                  onClick={addLabel}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Label
                </button>
              </div>

              {labels.map((label, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={label.key}
                      onChange={(e) => updateLabel(index, 'key', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        errors[`label-${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={label.value}
                      onChange={(e) => updateLabel(index, 'value', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        errors[`label-${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => removeLabel(index)}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {errors[`label-${index}`] && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors[`label-${index}`]}
                    </p>
                  )}
                </div>
              ))}

              {labels.length === 0 && (
                <p className="text-sm text-gray-500 italic dark:text-gray-400">No labels configured</p>
              )}
            </div>

            {/* Annotations */}
            <div className="bg-white rounded-lg p-4 space-y-4 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">Annotations</h4>
                <button
                  type="button"
                  onClick={addAnnotation}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Annotation
                </button>
              </div>

              {annotations.map((annotation, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={annotation.key}
                      onChange={(e) => updateAnnotation(index, 'key', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        errors[`annotation-${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={annotation.value}
                      onChange={(e) => updateAnnotation(index, 'value', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        errors[`annotation-${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => removeAnnotation(index)}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {errors[`annotation-${index}`] && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors[`annotation-${index}`]}
                    </p>
                  )}
                </div>
              ))}

              {annotations.length === 0 && (
                <p className="text-sm text-gray-500 italic dark:text-gray-400">No annotations configured</p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            {isEditing ? 'Update Service Account' : 'Create Service Account'}
          </button>
        </div>
      </div>
    </div>
  );
} 