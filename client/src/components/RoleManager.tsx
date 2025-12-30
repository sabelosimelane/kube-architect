import React, { useState } from 'react';
import { Plus, X, Shield, Trash2, AlertCircle, Copy, Edit, Eye, Unlock, Settings, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import type { KubernetesRole, PolicyRule, RoleFormData } from '../types';
import { API_GROUPS, ALL_VERBS, VERB_DESCRIPTIONS, COMMON_ROLE_TEMPLATES } from '../data/kubernetesRBAC';

interface RoleManagerProps {
  roles: KubernetesRole[];
  namespaces: string[];
  onAddRole: (role: KubernetesRole) => void;
  onUpdateRole: (role: KubernetesRole, index: number) => void;
  onDeleteRole: (roleName: string) => void;
  onClose: () => void;
  editingIndex?: number;
}

export function RoleManager({ 
  roles, 
  namespaces,
  onAddRole, 
  onUpdateRole, 
  onDeleteRole, 
  onClose,
  editingIndex 
}: RoleManagerProps) {
  const [roleFormData, setRoleFormData] = useState<RoleFormData>(() => {
    if (editingIndex !== undefined && roles[editingIndex]) {
      const role = roles[editingIndex];
      return {
        metadata: {
          name: role.metadata.name,
          namespace: role.metadata.namespace,
          labels: role.metadata.labels || {}
        },
        rules: role.rules
      };
    }
    return {
      metadata: {
        name: '',
        namespace: 'default',
        labels: {}
      },
      rules: []
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    apiGroup: null as string | null,
    resources: [] as string[],
    verbs: [] as string[]
  });

  const validateRole = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!roleFormData.metadata.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(roleFormData.metadata.name)) {
      newErrors.name = 'Use only lowercase letters, numbers, and hyphens';
    } else if (editingIndex === undefined && roles.some(r => r.metadata.name === roleFormData.metadata.name && r.metadata.namespace === roleFormData.metadata.namespace)) {
      newErrors.name = 'Role already exists in this namespace';
    }
    
    roleFormData.rules.forEach((rule, index) => {
      if (rule.resources.length === 0) {
        newErrors[`rule-${index}-resources`] = 'At least one resource must be selected';
      }
      if (rule.verbs.length === 0) {
        newErrors[`rule-${index}-verbs`] = 'At least one verb must be selected';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const removeRule = (index: number) => {
    setRoleFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const addLabel = () => {
    if (newLabel.key && newLabel.value) {
      setRoleFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          labels: { ...prev.metadata.labels, [newLabel.key]: newLabel.value }
        }
      }));
      setNewLabel({ key: '', value: '' });
    }
  };

  const removeLabel = (key: string) => {
    setRoleFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        labels: Object.fromEntries(
          Object.entries(prev.metadata.labels).filter(([k]) => k !== key)
        )
      }
    }));
  };

  const applyTemplate = (template: typeof COMMON_ROLE_TEMPLATES[0]) => {
    setRoleFormData(prev => ({
      ...prev,
      rules: template.rules.map(rule => ({ ...rule }))
    }));
    setShowTemplates(false);
  };

  const handleCreateOrUpdateRole = () => {
    if (!validateRole()) return;

    const role: KubernetesRole = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'Role',
      metadata: {
        name: roleFormData.metadata.name,
        namespace: roleFormData.metadata.namespace,
        ...(Object.keys(roleFormData.metadata.labels).length > 0 && {
          labels: roleFormData.metadata.labels
        })
      },
      rules: roleFormData.rules
    };

    if (editingIndex !== undefined) {
      onUpdateRole(role, editingIndex);
    } else {
      onAddRole(role);
    }

    // Reset form
    setRoleFormData({
      metadata: { name: '', namespace: 'default', labels: {} },
      rules: [{ apiGroups: [''], resources: [], verbs: ['get'] }]
    });
    setErrors({});
    
    // Close the modal after successful creation/update
    onClose();
  };

  const handleDeleteRole = (roleName: string) => {
    onDeleteRole(roleName);
    setDeleteConfirm(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };



  const getPermissionSummary = (rule: PolicyRule) => {
    const apiGroup = rule.apiGroups[0] || 'core';
    const resources = rule.resources.length > 0 ? rule.resources.join(', ') : 'none';
    const verbs = rule.verbs.length > 0 ? rule.verbs.join(', ') : 'none';
    
    if (rule.verbs.includes('*')) {
      return `Full access to ${resources} in ${apiGroup === '' ? 'core' : apiGroup} API`;
    } else if (rule.verbs.every(v => ['get', 'list', 'watch'].includes(v))) {
      return `Read-only access to ${resources} in ${apiGroup === '' ? 'core' : apiGroup} API`;
    } else {
      return `Can ${verbs} on ${resources} in ${apiGroup === '' ? 'core' : apiGroup} API`;
    }
  };

  const getVerbIcon = (verb: string) => {
    switch (verb) {
      case 'get':
      case 'list':
      case 'watch':
        return <Eye className="w-3 h-3" />;
      case 'create':
      case 'update':
      case 'patch':
        return <Edit className="w-3 h-3" />;
      case 'delete':
        return <Trash2 className="w-3 h-3" />;
      case '*':
        return <Unlock className="w-3 h-3" />;
      default:
        return <Settings className="w-3 h-3" />;
    }
  };

  const getVerbColor = (verb: string) => {
    switch (verb) {
      case 'get':
      case 'list':
      case 'watch':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'create':
      case 'update':
      case 'patch':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      case '*':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Wizard functions
  const startWizard = () => {
    setWizardData({ apiGroup: null, resources: [], verbs: [] });
    setWizardStep(0);
    setShowWizard(true);
  };

  const closeWizard = () => {
    setShowWizard(false);
    setWizardStep(0);
    setWizardData({ apiGroup: '', resources: [], verbs: [] });
  };

  const nextWizardStep = () => {
    if (wizardStep < 2) {
      setWizardStep(wizardStep + 1);
    }
  };

  const prevWizardStep = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };

  const finishWizard = () => {
    if (wizardData.apiGroup !== null && wizardData.resources.length > 0 && wizardData.verbs.length > 0) {
      const newRule: PolicyRule = {
        apiGroups: [wizardData.apiGroup],
        resources: wizardData.resources,
        verbs: wizardData.verbs
      };
      
      setRoleFormData(prev => ({
        ...prev,
        rules: [...prev.rules, newRule]
      }));
      
      closeWizard();
    }
  };

  const canProceedToNext = () => {
    switch (wizardStep) {
      case 0: return wizardData.apiGroup !== null && wizardData.apiGroup !== undefined;
      case 1: return wizardData.resources.length > 0;
      case 2: return wizardData.verbs.length > 0;
      default: return false;
    }
  };

  const updateWizardApiGroup = (apiGroup: string) => {
    setWizardData(prev => ({
      ...prev,
      apiGroup,
      resources: [] // Reset resources when API group changes
    }));
  };

  const toggleWizardResource = (resource: string) => {
    setWizardData(prev => ({
      ...prev,
      resources: prev.resources.includes(resource)
        ? prev.resources.filter(r => r !== resource)
        : [...prev.resources, resource]
    }));
  };

  const toggleWizardVerb = (verb: string) => {
    setWizardData(prev => ({
      ...prev,
      verbs: prev.verbs.includes(verb)
        ? prev.verbs.filter(v => v !== verb)
        : [...prev.verbs, verb]
    }));
  };

  const applyWizardPattern = (pattern: 'read-only' | 'read-write' | 'full-access') => {
    let verbs: string[];
    switch (pattern) {
      case 'read-only':
        verbs = ['get', 'list', 'watch'];
        break;
      case 'read-write':
        verbs = ['get', 'list', 'watch', 'create', 'update', 'patch'];
        break;
      case 'full-access':
        verbs = ['*'];
        break;
      default:
        verbs = ['get'];
    }
    
    setWizardData(prev => ({ ...prev, verbs }));
  };

  const getWizardStepTitle = () => {
    switch (wizardStep) {
      case 0: return 'Select API Group';
      case 1: return 'Choose Resources';
      case 2: return 'Pick Actions';
      default: return 'Rule Wizard';
    }
  };

  const getWizardStepDescription = () => {
    switch (wizardStep) {
      case 0: return 'First, choose which Kubernetes API group this rule will apply to.';
      case 1: return 'Next, select the specific resources within this API group.';
      case 2: return 'Finally, choose what actions can be performed on these resources.';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editingIndex !== undefined ? 'Edit Role' : 'Role Manager'}
              </h3>
              <p className="text-xs text-gray-500">Create and manage Kubernetes RBAC Roles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Create/Edit Role Form */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">
                  {editingIndex !== undefined ? 'Edit Role' : 'Create New Role'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Templates
                </button>
              </div>

              {/* Templates Dropdown */}
              {showTemplates && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Role Templates</h5>
                  <div className="space-y-1">
                    {COMMON_ROLE_TEMPLATES.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => applyTemplate(template)}
                        className="w-full text-left p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Role Metadata */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                <h5 className="text-xs font-medium text-gray-700">Role Details</h5>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={roleFormData.metadata.name}
                      onChange={(e) => setRoleFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, name: e.target.value }
                      }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="my-role"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Namespace
                    </label>
                    <select
                      value={roleFormData.metadata.namespace}
                      onChange={(e) => setRoleFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, namespace: e.target.value }
                      }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {namespaces.map(namespace => (
                        <option key={namespace} value={namespace}>
                          {namespace}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-medium text-gray-700">Labels</h5>
                  <button
                    type="button"
                    onClick={addLabel}
                    disabled={!newLabel.key || !newLabel.value}
                    className="inline-flex items-center px-2 py-1 bg-purple-600 text-white rounded-md text-xs hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newLabel.key}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, key: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addLabel)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="key"
                  />
                  <input
                    type="text"
                    value={newLabel.value}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addLabel)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="value"
                  />
                </div>
                
                {Object.entries(roleFormData.metadata.labels).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(roleFormData.metadata.labels).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-1.5 bg-gray-50 rounded-md">
                        <span className="text-xs text-gray-700">{key}: {value}</span>
                        <button
                          type="button"
                          onClick={() => removeLabel(key)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rules */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-medium text-gray-700">Permission Rules</h5>
                  <button
                    type="button"
                    onClick={startWizard}
                    className="inline-flex items-center px-2 py-1 bg-purple-600 text-white rounded-md text-xs hover:bg-purple-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Rule
                  </button>
                </div>
                
                {/* Rules List */}
                {roleFormData.rules.length > 0 ? (
                  <div className="space-y-2">
                    {roleFormData.rules.map((rule, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-900">Rule {index + 1}</span>
                            <span className="text-xs text-gray-500">
                              {rule.apiGroups[0] === '' ? 'Core API' : rule.apiGroups[0] || 'Unknown API'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRule(index)}
                            className="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
                            title="Remove rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Permission Summary */}
                        <div className="mt-2 p-2 bg-white rounded border border-purple-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <Eye className="w-3 h-3 text-purple-600" />
                            <span className="text-xs text-purple-800 font-medium">Permissions:</span>
                          </div>
                          <p className="text-xs text-gray-700">
                            {getPermissionSummary(rule)}
                          </p>
                        </div>

                        {/* Detailed Info */}
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="font-medium text-gray-600">API Group:</span>
                            <div className="text-gray-800">{rule.apiGroups[0] === '' ? 'core' : rule.apiGroups[0]}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Resources:</span>
                            <div className="text-gray-800">
                              {rule.resources.length > 2 
                                ? `${rule.resources.slice(0, 2).join(', ')} +${rule.resources.length - 2}`
                                : rule.resources.join(', ')
                              }
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Actions:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rule.verbs.slice(0, 3).map(verb => (
                                <span key={verb} className={`inline-flex items-center px-1 py-0.5 rounded text-xs ${getVerbColor(verb)}`}>
                                  {getVerbIcon(verb)}
                                  <span className="ml-1">{verb}</span>
                                </span>
                              ))}
                              {rule.verbs.length > 3 && (
                                <span className="text-xs text-gray-500">+{rule.verbs.length - 3}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No Rules Added</h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Create permission rules to define what this role can access
                    </p>
                    <button
                      type="button"
                      onClick={startWizard}
                      className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs hover:bg-purple-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Your First Rule
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCreateOrUpdateRole}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 focus:ring-2 focus:ring-purple-500"
                >
                  {editingIndex !== undefined ? 'Update Role' : 'Create Role'}
                </button>
                
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Rule Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Wizard Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add Permission Rule</h3>
                  <p className="text-xs text-gray-500">Step {wizardStep + 1} of 3 - {getWizardStepTitle()}</p>
                </div>
              </div>
              <button
                onClick={closeWizard}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                {[0, 1, 2].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                      step < wizardStep 
                        ? 'bg-green-500 text-white border-green-500' 
                        : step === wizardStep
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-200 text-gray-500 border-gray-300'
                    }`}>
                      {step < wizardStep ? <CheckCircle className="w-4 h-4" /> : step + 1}
                    </div>
                    <div className={`ml-2 text-xs font-medium ${step === wizardStep ? 'text-blue-700' : 'text-gray-500'}`}>
                      {step === 0 ? 'API Group' : step === 1 ? 'Resources' : 'Actions'}
                    </div>
                    {step < 2 && (
                      <div className={`flex-1 h-0.5 ml-2 ${step < wizardStep ? 'bg-green-500' : 'bg-gray-300'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Wizard Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{getWizardStepTitle()}</h4>
                <p className="text-gray-600 text-sm">{getWizardStepDescription()}</p>
              </div>

              {/* Step 0: API Group Selection */}
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {API_GROUPS.map((group) => (
                      <label
                        key={group.name}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          wizardData.apiGroup === group.name
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="apiGroup"
                          value={group.name}
                          checked={wizardData.apiGroup === group.name}
                          onChange={(e) => updateWizardApiGroup(e.target.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{group.displayName}</div>
                          <div className="text-xs text-gray-500">
                            {group.name === '' ? 'Core Kubernetes resources (pods, services, etc.)' : 
                             `${group.resources.length} available resources`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Resource Selection */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  {wizardData.apiGroup !== null ? (
                    <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                      {API_GROUPS
                        .find(group => group.name === wizardData.apiGroup)
                        ?.resources.map((resource) => (
                          <label
                            key={resource.name}
                            className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                              wizardData.resources.includes(resource.name)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={wizardData.resources.includes(resource.name)}
                              onChange={() => toggleWizardResource(resource.name)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{resource.displayName}</div>
                            </div>
                          </label>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Please go back and select an API group first.
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Verbs Selection */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  {/* Quick Patterns */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Quick Patterns</h5>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyWizardPattern('read-only')}
                        className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 border border-blue-200"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Read Only
                      </button>
                      <button
                        type="button"
                        onClick={() => applyWizardPattern('read-write')}
                        className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200 border border-green-200"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Read/Write
                      </button>
                      <button
                        type="button"
                        onClick={() => applyWizardPattern('full-access')}
                        className="inline-flex items-center px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm hover:bg-purple-200 border border-purple-200"
                      >
                        <Unlock className="w-4 h-4 mr-2" />
                        Full Access
                      </button>
                    </div>
                  </div>

                  {/* Individual Verbs */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Individual Actions</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {ALL_VERBS.map((verb) => (
                        <label
                          key={verb}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                            wizardData.verbs.includes(verb)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={wizardData.verbs.includes(verb)}
                            onChange={() => toggleWizardVerb(verb)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="ml-3 flex items-center">
                            {getVerbIcon(verb)}
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{verb}</div>
                              <div className="text-xs text-gray-500">{VERB_DESCRIPTIONS[verb]}</div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500">
                {wizardStep === 2 && wizardData.verbs.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span>Preview:</span>
                    <span className="font-medium">
                      {wizardData.verbs.includes('*') ? 'Full access' : 
                       wizardData.verbs.every(v => ['get', 'list', 'watch'].includes(v)) ? 'Read-only' :
                       'Custom permissions'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={prevWizardStep}
                  disabled={wizardStep === 0}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </button>
                
                {wizardStep < 2 ? (
                  <button
                    type="button"
                    onClick={nextWizardStep}
                    disabled={!canProceedToNext()}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishWizard}
                    disabled={!canProceedToNext()}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Create Rule
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">Confirm Delete</h4>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete the role <strong>"{deleteConfirm}"</strong>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => deleteConfirm && handleDeleteRole(deleteConfirm)}
                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500"
              >
                Delete Role
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 