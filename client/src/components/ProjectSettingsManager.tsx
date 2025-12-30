import React, { useState } from 'react';
import { X, Settings, Plus, Trash2, Save, FolderOpen, Tag, Info, AlertTriangle } from 'lucide-react';
import type { ProjectSettings } from '../types';

interface ProjectSettingsManagerProps {
  projectSettings: ProjectSettings;
  onUpdateProjectSettings: (settings: ProjectSettings) => void;
  onClose: () => void;
}

export function ProjectSettingsManager({ 
  projectSettings, 
  onUpdateProjectSettings, 
  onClose 
}: ProjectSettingsManagerProps) {
  const [settings, setSettings] = useState<ProjectSettings>({ ...projectSettings });
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [errors, setErrors] = useState<string[]>([]);

  const validateProjectName = (name: string): string[] => {
    const errors: string[] = [];
    
    if (!name.trim()) {
      errors.push('Project name is required');
      return errors;
    }
    
    if (name.length > 63) {
      errors.push('Project name must be 63 characters or less');
    }
    
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
      errors.push('Use only lowercase letters, numbers, and hyphens');
    }
    
    if (name.startsWith('-') || name.endsWith('-')) {
      errors.push('Cannot start or end with hyphen');
    }
    
    return errors;
  };

  const handleProjectNameChange = (name: string) => {
    setSettings(prev => ({ ...prev, name }));
    setErrors(validateProjectName(name));
  };

  const addGlobalLabel = () => {
    if (newLabel.key && newLabel.value) {
      // Updated validation for Kubernetes label keys
      // Kubernetes label keys can contain:
      // - alphanumeric characters
      // - dots (.)
      // - hyphens (-)
      // - underscores (_)
      // - forward slashes (/) for namespaced labels like app.kubernetes.io/component
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9\-_.\/]*[a-zA-Z0-9])?$/.test(newLabel.key)) {
        setErrors(['Label key must start and end with alphanumeric characters and can contain letters, numbers, dots, hyphens, underscores, and forward slashes']);
        return;
      }
      
      setSettings(prev => ({
        ...prev,
        globalLabels: { ...prev.globalLabels, [newLabel.key]: newLabel.value }
      }));
      setNewLabel({ key: '', value: '' });
      setErrors([]);
    }
  };

  const removeGlobalLabel = (key: string) => {
    setSettings(prev => {
      const { [key]: removed, ...rest } = prev.globalLabels;
      return { ...prev, globalLabels: rest };
    });
  };

  const handleSave = () => {
    const validationErrors = validateProjectName(settings.name);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedSettings: ProjectSettings = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    onUpdateProjectSettings(updatedSettings);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const commonLabels = [
    { key: 'environment', value: 'development', description: 'Environment (dev, staging, prod)' },
    { key: 'team', value: 'backend', description: 'Team responsible for the resources' },
    { key: 'app.kubernetes.io/version', value: '1.0.0', description: 'Application version' },
    { key: 'app.kubernetes.io/component', value: 'api', description: 'Component type (api, frontend, database)' },
    { key: 'owner', value: 'platform-team', description: 'Resource owner' },
    { key: 'cost-center', value: 'engineering', description: 'Cost allocation' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 dark:bg-gray-800/30 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Project Settings</h3>
              <p className="text-sm text-blue-100">Configure project name and global labels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Project Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-200">Project Information</h4>
            </div>

            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => handleProjectNameChange(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleSave)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder-gray-400 ${
                    errors.length > 0 ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                  placeholder="my-awesome-project"
                />
                {errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This name will be used as a prefix for generated resource names and as a default label
                </p>
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={settings.description || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder-gray-400"
                  placeholder="Brief description of your project..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Global Labels */} 
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 
                rounded-lg p-6 border border-green-200 
                dark:from-green-900 dark:to-emerald-900 
                dark:border-green-700">
            <div className="flex items-center space-x-2 mb-4">
              <Tag className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h4 className="text-lg font-semibold text-green-900 dark:text-green-200">
                Global Labels
              </h4>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 
                  dark:bg-blue-900/30 dark:border-blue-700">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 dark:text-blue-400" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">What are Global Labels?</p>
                  <p>
                    Global labels are automatically applied to all Kubernetes resources in your project.
                    They help with organization, filtering, cost allocation, and automation. Common examples
                    include environment, team, version, and component labels.
                  </p>
                </div>
              </div>
            </div>

            {/* Add New Label */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add Global Label
                </label>
                <button
                  onClick={addGlobalLabel}
                  disabled={!newLabel.key || !newLabel.value}
                  className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg 
                   hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newLabel.key}
                  onChange={(e) => setNewLabel((prev) => ({ ...prev, key: e.target.value }))}
                  onKeyPress={(e) => handleKeyPress(e, addGlobalLabel)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent
                   border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white 
                   dark:placeholder-gray-400"
                  placeholder="Label key (e.g., app.kubernetes.io/component)"
                />
                <input
                  type="text"
                  value={newLabel.value}
                  onChange={(e) => setNewLabel((prev) => ({ ...prev, value: e.target.value }))}
                  onKeyPress={(e) => handleKeyPress(e, addGlobalLabel)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent
                   border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white 
                   dark:placeholder-gray-400"
                  placeholder="Label value (e.g., api)"
                />
              </div>
            </div>

            {/* Common Label Suggestions */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Common Label Suggestions:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {commonLabels.map((label, index) => (
                  <button
                    key={index}
                    onClick={() => setNewLabel({ key: label.key, value: label.value })}
                    className="text-left p-2 bg-white border border-gray-200 rounded-lg 
                     hover:bg-gray-50 transition-colors duration-200 
                     dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                    title={label.description}
                  >
                    <div className="text-sm">
                      <span className="font-medium text-green-700 dark:text-green-400">{label.key}</span>
                      <span className="text-gray-500 dark:text-gray-400">: </span>
                      <span className="text-gray-700 dark:text-gray-400">{label.value}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                      {label.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Global Labels */}
            {Object.keys(settings.globalLabels).length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Current Global Labels:
                </h5>
                <div className="space-y-2">
                  {Object.entries(settings.globalLabels).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-white px-4 py-3 rounded-lg 
                       border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{key}</span>
                          <span className="text-gray-500 dark:text-gray-400">: </span>
                          <span className="text-gray-700 dark:text-gray-400">{value}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => removeGlobalLabel(key)}
                        className="text-gray-400 hover:text-red-600 transition-colors duration-200 
                         dark:text-gray-600 dark:hover:text-red-600"
                        title="Remove label"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(settings.globalLabels).length === 0 && (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-gray-300" />
                <h5 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Global Labels
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add global labels to automatically apply them to all your Kubernetes resources
                </p>
              </div>
            )}
          </div>

          {/* Project Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Metadata</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Created:</span> {new Date(settings.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {new Date(settings.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Global labels will be applied to all deployments, services, and other resources</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!settings.name || errors.length > 0}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium dark:bg-blue-700 dark:hover:bg-blue-800 dark:hover:text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}