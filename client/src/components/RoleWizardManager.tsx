import React, { useState, useEffect } from 'react';
import { generateRoleYaml, generateClusterRoleYaml } from '../utils/yamlGenerator';
import type { KubernetesRole, KubernetesClusterRole, PolicyRule } from '../types';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, Info } from 'lucide-react';
import { API_GROUPS, ALL_VERBS } from '../data/kubernetesRBAC';

interface RoleWizardManagerProps {
  namespaces?: string[];
  roles?: KubernetesRole[];
  clusterRoles?: KubernetesClusterRole[];
  initialRole?: KubernetesRole | KubernetesClusterRole;
  isClusterRole?: boolean;
  onSubmit?: (role: KubernetesRole | KubernetesClusterRole) => void;
  onCancel?: () => void;
}

interface RoleFormData {
  metadata: {
    name: string;
    namespace?: string;
    labels: Record<string, string>;
  };
  rules: PolicyRule[];
}

const defaultRoleData: RoleFormData = {
  metadata: {
    name: '',
    namespace: 'default',
    labels: {}
  },
  rules: []
};

const defaultClusterRoleData: RoleFormData = {
  metadata: {
    name: '',
    labels: {}
  },
  rules: []
};

const RoleWizardManager: React.FC<RoleWizardManagerProps> = ({ 
  namespaces = [], 
  roles = [], 
  clusterRoles = [], 
  initialRole, 
  isClusterRole = false,
  onSubmit, 
  onCancel 
}) => {
  const [step, setStep] = useState(0);
  const [isClusterRoleMode, setIsClusterRoleMode] = useState(isClusterRole);
  const [roleData, setRoleData] = useState<RoleFormData>(initialRole ? {
    metadata: {
      name: initialRole.metadata.name,
      namespace: 'kind' in initialRole && 'namespace' in initialRole.metadata ? initialRole.metadata.namespace : undefined,
      labels: initialRole.metadata.labels || {}
    },
    rules: initialRole.rules
  } : (isClusterRole ? defaultClusterRoleData : defaultRoleData));
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [newLabel, setNewLabel] = useState({ key: '', value: '' });

  // Add state for rule wizard
  const [showRuleWizard, setShowRuleWizard] = useState(false);
  const [ruleWizardStep, setRuleWizardStep] = useState(0);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [ruleDraft, setRuleDraft] = useState<PolicyRule>({ apiGroups: [''], resources: [], verbs: [] });

  // Add state for templates dropdown in permissions step
  const [showStepTemplates, setShowStepTemplates] = useState(false);

  useEffect(() => {
    if (initialRole) {
      setRoleData({
        metadata: {
                  name: initialRole.metadata.name,
        namespace: 'kind' in initialRole && 'namespace' in initialRole.metadata ? initialRole.metadata.namespace : undefined,
        labels: initialRole.metadata.labels || {}
        },
        rules: initialRole.rules
      });
      setIsClusterRoleMode('kind' in initialRole ? initialRole.kind === 'ClusterRole' : false);
    }
  }, [initialRole]);

  // Step 1: Basic Configuration
  const handleBasicChange = (field: keyof RoleFormData['metadata'], value: any) => {
    setRoleData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value }
    }));
    
    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRoleTypeChange = (isCluster: boolean) => {
    setIsClusterRoleMode(isCluster);
    setRoleData(isCluster ? defaultClusterRoleData : defaultRoleData);
    // Clear all errors when role type changes
    setErrors({});
  };

  // Step 2: Permissions
  const addRule = () => {
    startRuleWizard(); // Start the rule wizard instead of adding a basic rule
  };

  const removeRule = (index: number) => {
    setRoleData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
    
    // Clear rule-specific errors when removing
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`rule-${index}-`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  // Labels management
  const addLabel = () => {
    if (newLabel.key && newLabel.value) {
      setRoleData(prev => ({
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
    setRoleData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        labels: Object.fromEntries(
          Object.entries(prev.metadata.labels).filter(([k]) => k !== key)
        )
      }
    }));
  };

  // Start rule wizard for new or edit
  const startRuleWizard = (rule?: PolicyRule, index?: number) => {
    setRuleWizardStep(0);
    setShowRuleWizard(true);
    setRuleDraft(rule ? { ...rule } : { apiGroups: [''], resources: [], verbs: [] });
    setEditingRuleIndex(index ?? null);
  };

  const closeRuleWizard = () => {
    setShowRuleWizard(false);
    setRuleWizardStep(0);
    setRuleDraft({ apiGroups: [''], resources: [], verbs: [] });
    setEditingRuleIndex(null);
  };

  const handleRuleWizardNext = () => {
    setRuleWizardStep(s => s + 1);
  };
  const handleRuleWizardPrev = () => {
    setRuleWizardStep(s => Math.max(0, s - 1));
  };
  const handleRuleWizardChange = (field: keyof PolicyRule, value: any) => {
    setRuleDraft(prev => ({ ...prev, [field]: value }));
    // Reset dependent fields
    if (field === 'apiGroups') {
      setRuleDraft(prev => ({ ...prev, resources: [], verbs: [] }));
    } else if (field === 'resources') {
      setRuleDraft(prev => ({ ...prev, verbs: [] }));
    }
  };
  const handleRuleWizardFinish = () => {
    setRoleData(prev => {
      const rules = [...prev.rules];
      if (editingRuleIndex !== null) {
        rules[editingRuleIndex] = { ...ruleDraft };
      } else {
        rules.push({ ...ruleDraft });
      }
      return { ...prev, rules };
    });
    closeRuleWizard();
  };

  // New function to handle the simplified template structure
  const handleApplyTemplate = (templateId: string) => {
    const templateRules = {
      'pod-reader': [{
        apiGroups: [''],
        resources: ['pods'],
        verbs: ['get', 'list', 'watch']
      }],
      'configmap-manager': [{
        apiGroups: [''],
        resources: ['configmaps'],
        verbs: ['create', 'get', 'list', 'watch', 'update', 'patch', 'delete']
      }],
      'deployment-manager': [{
        apiGroups: ['apps'],
        resources: ['deployments'],
        verbs: ['create', 'get', 'list', 'watch', 'update', 'patch', 'delete']
      }],
      'service-manager': [{
        apiGroups: [''],
        resources: ['services'],
        verbs: ['create', 'get', 'list', 'watch', 'update', 'patch', 'delete']
      }],
      'namespace-admin': [
        {
          apiGroups: [''],
          resources: ['pods', 'services', 'configmaps', 'secrets', 'persistentvolumeclaims'],
          verbs: ['*']
        },
        {
          apiGroups: ['apps'],
          resources: ['deployments', 'replicasets', 'statefulsets'],
          verbs: ['*']
        },
        {
          apiGroups: ['networking.k8s.io'],
          resources: ['ingresses', 'networkpolicies'],
          verbs: ['*']
        }
      ]
    };

    const rules = templateRules[templateId as keyof typeof templateRules];
    if (rules) {
      // Add template rules to existing rules
      const newRules = [...roleData.rules, ...rules];
      setRoleData(prev => ({
        ...prev,
        rules: newRules
      }));
      
      // Close templates modal
      setShowStepTemplates(false);
      
      // Show success feedback
      console.log(`Applied template "${templateId}" - added ${rules.length} rules`);
      
      // Optional: Scroll to rules section to show the new rules
      setTimeout(() => {
        const rulesSection = document.querySelector('[data-step="permissions"]');
        if (rulesSection) {
          rulesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleEditRule = (index: number) => {
    startRuleWizard(roleData.rules[index], index);
  };

  // Validation
  const validateStep = () => {
    const errs: { [key: string]: string } = {};
    
    if (step === 0) {
      if (!roleData.metadata.name.trim()) {
        errs.name = 'Role name is required';
      } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(roleData.metadata.name)) {
        errs.name = 'Use only lowercase letters, numbers, and hyphens';
      } else if (!initialRole) {
        // Check for duplicates
        if (isClusterRoleMode) {
          if (clusterRoles.some(r => r.metadata.name === roleData.metadata.name)) {
            errs.name = 'ClusterRole already exists';
          }
        } else {
          if (roles.some(r => r.metadata.name === roleData.metadata.name && r.metadata.namespace === roleData.metadata.namespace)) {
            errs.name = 'Role already exists in this namespace';
          }
        }
      }
      
      if (!isClusterRoleMode && !roleData.metadata.namespace) {
        errs.namespace = 'Namespace is required for Roles';
      }
    }
    
    if (step === 1) {
      roleData.rules.forEach((rule, index) => {
        if (rule.resources.length === 0) {
          errs[`rule-${index}-resources`] = 'At least one resource must be selected';
        }
        if (rule.verbs.length === 0) {
          errs[`rule-${index}-verbs`] = 'At least one verb must be selected';
        }
      });
    }
    
    // Update errors state - this will clear errors that are no longer present
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step navigation
  const nextStep = () => {
    const isValid = validateStep();
    if (isValid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => Math.max(0, s - 1));

  const handleSubmit = () => {
    if (!validateStep()) return;

    if (isClusterRoleMode) {
      const clusterRole: KubernetesClusterRole = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRole',
        metadata: {
          name: roleData.metadata.name,
          ...(Object.keys(roleData.metadata.labels).length > 0 && {
            labels: roleData.metadata.labels
          })
        },
        rules: roleData.rules
      };
      onSubmit?.(clusterRole);
    } else {
      const role: KubernetesRole = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'Role',
        metadata: {
          name: roleData.metadata.name,
          namespace: roleData.metadata.namespace!,
          ...(Object.keys(roleData.metadata.labels).length > 0 && {
            labels: roleData.metadata.labels
          })
        },
        rules: roleData.rules
      };
      onSubmit?.(role);
    }
    // Close the modal after successful creation
    onCancel?.();
  };

  // Step 1: Basic Configuration
  const renderStep1 = () => (
    <div className="mb-4">
      <div className="mb-3">
        <h4 className="text-lg font-semibold text-gray-900 mb-1 dark:text-white">Step 1: Basic Configuration</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose the role type and provide a unique name for your {isClusterRoleMode ? 'ClusterRole' : 'Role'}.
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-900 mb-2 dark:text-white">
            Role Type
            <span className="ml-2 text-gray-500 cursor-pointer dark:text-gray-400" title="Role is namespace-scoped. ClusterRole is cluster-wide.">
              <Info className="inline w-4 h-4" />
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="relative flex items-center p-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-blue-600 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
              <input
                type="radio"
                className="sr-only"
                checked={!isClusterRoleMode}
                onChange={() => handleRoleTypeChange(false)}
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${!isClusterRoleMode ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                {!isClusterRoleMode && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm dark:text-white">Role</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Namespace-scoped permissions</div>
              </div>
            </label>
            <label className="relative flex items-center p-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-blue-600 rounded-lg cursor-pointer hover:border-blue-400">
              <input
                type="radio"
                className="sr-only"
                checked={isClusterRoleMode}
                onChange={() => handleRoleTypeChange(true)}
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${isClusterRoleMode ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                {isClusterRoleMode && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm dark:text-white">ClusterRole</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Cluster-wide permissions</div>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm dark:bg-gray-800  dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-900 mb-2 dark:text-white">
            Role Name <span className="text-red-500">*</span>
            <span className="ml-2 text-gray-500 cursor-pointer dark:text-gray-400" title="Must be a valid DNS-1123 subdomain (lowercase, numbers, '-', '.')">
              <Info className="inline w-4 h-4" />
            </span>
          </label>
          <input
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
            value={roleData.metadata.name}
            onChange={e => handleBasicChange('name', e.target.value)}
            onBlur={() => {
              // Validate name on blur
              if (roleData.metadata.name.trim()) {
                if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(roleData.metadata.name)) {
                  setErrors(prev => ({ ...prev, name: 'Use only lowercase letters, numbers, and hyphens' }));
                } else if (!initialRole) {
                  // Check for duplicates
                  if (isClusterRoleMode) {
                    if (clusterRoles.some(r => r.metadata.name === roleData.metadata.name)) {
                      setErrors(prev => ({ ...prev, name: 'ClusterRole already exists' }));
                    } else {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.name;
                        return newErrors;
                      });
                    }
                  } else {
                    if (roles.some(r => r.metadata.name === roleData.metadata.name && r.metadata.namespace === roleData.metadata.namespace)) {
                      setErrors(prev => ({ ...prev, name: 'Role already exists in this namespace' }));
                    } else {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.name;
                        return newErrors;
                      });
                    }
                  }
                } else {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.name;
                    return newErrors;
                  });
                }
              }
            }}
            placeholder="e.g. my-role"
            aria-label="Role name"
          />
          {errors.name && (
            <div className="text-red-500 text-xs mt-2  flex items-center bg-red-50 border border-red-200 rounded p-1">
              <Info className="w-3 h-3 mr-1" />
              {errors.name}
            </div>
          )}
        </div>

        {!isClusterRoleMode && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-900 mb-2 dark:text-white">
              Namespace <span className="text-red-500">*</span>
              <span className="ml-2 text-gray-500 cursor-pointer dark:text-gray-400" title="The namespace where this role will be created">
                <Info className="inline w-4 h-4" />
              </span>
            </label>
            <select
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.namespace ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
              value={roleData.metadata.namespace || ''}
              onChange={e => handleBasicChange('namespace', e.target.value)}
              onBlur={() => {
                if (!roleData.metadata.namespace) {
                  setErrors(prev => ({ ...prev, namespace: 'Namespace is required for Roles' }));
                } else {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.namespace;
                    return newErrors;
                  });
                }
              }}
              aria-label="Namespace"
            >
              <option value="">Select namespace</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
            {errors.namespace && (
              <div className="text-red-500 text-xs mt-1 flex items-center  bg-red-50 border border-red-200 rounded p-1">
                <Info className="w-3 h-3 mr-1" />
                {errors.namespace}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-900 mb-2 dark:text-white">
            Labels
            <span className="ml-2 text-gray-500 cursor-pointer dark:text-gray-400" title="Optional key-value pairs for organizing and selecting resources">
              <Info className="inline w-4 h-4" />
            </span>
          </label>
          <div className="space-y-2">
            {Object.entries(roleData.metadata.labels).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded p-2 border border-gray-200 dark:border-gray-600">
                <span className="text-xs text-gray-600 dark:text-gray-400">{key}:</span>
                <span className="text-xs text-gray-800 dark:text-white">{value}</span>
                <button
                  type="button"
                  onClick={() => removeLabel(key)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                className="flex-1 px-3 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg shadow-sm bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Label key"
                value={newLabel.key}
                onChange={e => setNewLabel(prev => ({ ...prev, key: e.target.value }))}
              />
              <input
                className="flex-1 px-3 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg shadow-sm bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Label value"
                value={newLabel.value}
                onChange={e => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
              />
              <button
                type="button"
                onClick={addLabel}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Permissions
  const renderStep2 = () => (
    <div className="mb-4">
      <div className="mb-3">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1 dark:text-white">Step 2: Permissions</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Define the permissions for your {isClusterRoleMode ? 'ClusterRole' : 'Role'}.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm text-sm font-medium"
            onClick={() => setShowStepTemplates(v => !v)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Templates
          </button>
        </div>
      </div>
      
      {/* Templates Dropdown */}
      {showStepTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 dark:bg-opacity-80">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Role Templates</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose a template to quickly add common permissions</p>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                  onClick={() => setShowStepTemplates(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-2">
                {/* Pod Reader Template */}
                <div 
                  className="border border-gray-200 rounded-lg p-2 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md dark:hover:border-blue-400 dark:hover:bg-blue-600"
                  onClick={() => handleApplyTemplate('pod-reader')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 dark:bg-blue-400"></div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Pod Reader</h5>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Read-only access to pods</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">read:pods</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ConfigMap Manager Template */}
                <div 
                  className="border border-gray-200 rounded-lg p-2 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:shadow-md dark:hover:border-green-400 dark:hover:bg-green-600"
                  onClick={() => handleApplyTemplate('configmap-manager')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 dark:bg-green-400"></div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">ConfigMap Manager</h5>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Full access to ConfigMaps</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium dark:bg-green-400">create:configmaps</span>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium dark:bg-blue-400">read:configmaps</span>
                        <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium dark:bg-yellow-400">update:configmaps</span>
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium dark:bg-red-400">delete:configmaps</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Deployment Manager Template */}
                <div 
                  className="border border-gray-200 rounded-lg p-2 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md dark:hover:border-purple-400 dark:hover:bg-purple-600"
                  onClick={() => handleApplyTemplate('deployment-manager')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 dark:bg-purple-400"></div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Deployment Manager</h5>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Full access to deployments</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium dark:bg-purple-400">manage:deployments</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Service Manager Template */}
                <div 
                  className="border border-gray-200 rounded-lg p-2 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md dark:hover:border-orange-400 dark:hover:bg-orange-600"
                  onClick={() => handleApplyTemplate('service-manager')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 dark:bg-orange-400"></div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white ">Service Manager</h5>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Full access to services</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium dark:bg-orange-400">manage:services</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Namespace Admin Template */}
                <div 
                  className="border border-gray-200 rounded-lg p-2 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:shadow-md dark:hover:border-red-400 dark:hover:bg-red-600"
                  onClick={() => handleApplyTemplate('namespace-admin')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2 dark:bg-red-400"></div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Namespace Admin</h5>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Full access to namespace resources</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium dark:bg-red-400">admin:namespace</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium dark:bg-gray-800 dark:text-gray-300"
                  onClick={() => setShowStepTemplates(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Policy Rules <span className="text-red-500">*</span>
              <span className="ml-2 text-gray-500 cursor-pointer dark:text-gray-400" title="Define the permissions for this role">
                <Info className="inline w-4 h-4" />
              </span>
            </label>
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm text-sm font-medium"
              onClick={addRule}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Rule
            </button>
          </div>
          
          {roleData.rules.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <div className="text-sm">No rules defined yet. Add your first rule to get started.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {roleData.rules.map((rule, index) => (
                <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-2 relative dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-white">API Groups:</span>
                          <div className="mt-1">
                            {rule.apiGroups.map((group, i) => (
                              <span key={i} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded mr-1 mb-1 dark:bg-blue-400">
                                {group || '(core)'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-200">Resources:</span>
                          <div className="mt-1">
                            {rule.resources.map((resource, i) => (
                              <span key={i} className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded mr-1 mb-1 dark:bg-green-400">
                                {resource}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-200">Verbs:</span>
                          <div className="mt-1">
                            {rule.verbs.map((verb, i) => (
                              <span key={i} className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded mr-1 mb-1 dark:bg-purple-400">
                                {verb}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEditRule(index)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit rule"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors "
                        title="Remove rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 3: Review & Generate
  const renderStep3 = () => (
    <div className="mb-4">
      <div className="mb-3">
        <h4 className="text-lg font-semibold text-gray-900 mb-1">Step 3: Review & Generate</h4>
        <p className="text-sm text-gray-600">
          Review your {isClusterRoleMode ? 'ClusterRole' : 'Role'} configuration and generate the YAML.
        </p>
      </div>

      <div className="space-y-4">
        {/* Configuration Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Configuration Summary</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full dark:bg-green-400"></div>
              <span className="text-xs text-green-600 font-medium dark:text-green-400">Ready to generate</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-3 dark:bg-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center dark:text-white">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Basic Information
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{roleData.metadata.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{isClusterRoleMode ? 'ClusterRole' : 'Role'}</span>
                </div>
                {!isClusterRoleMode && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Namespace:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{roleData.metadata.namespace}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Rules:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{roleData.rules.length} rule{roleData.rules.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="bg-gray-50 rounded-lg p-3 dark:bg-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center dark:text-white">
                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Labels
              </h4>
              <div className="space-y-2">
                {Object.keys(roleData.metadata.labels).length > 0 ? (
                  Object.entries(roleData.metadata.labels).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{k}:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{v}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 italic dark:text-gray-400">No labels defined</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rules Summary */}
        {roleData.rules.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center dark:text-white">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Permissions Summary
            </h3>
            <div className="space-y-3">
              {roleData.rules.map((rule, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Rule {index + 1}</span>
                    <div className="flex space-x-1">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-100">
                        {rule.apiGroups.length} API Group{rule.apiGroups.length !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full dark:bg-green-900 dark:text-green-100">
                        {rule.resources.length} Resource{rule.resources.length !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full dark:bg-purple-900 dark:text-purple-100">
                        {rule.verbs.length} Verb{rule.verbs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-400">API Groups:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rule.apiGroups.map((group, i) => {
                          const apiGroup = API_GROUPS.find(g => g.name === group);
                          return (
                            <span key={i} className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 rounded-full text-xs dark:text-blue-100">
                              {apiGroup ? apiGroup.displayName : (group || '(core)')}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-400">Resources:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rule.resources.map((resource, i) => (
                          <span key={i} className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 rounded-full text-xs dark:text-green-100">
                            {resource}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Verbs:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rule.verbs.map((verb, i) => (
                          <span key={i} className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {verb}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated YAML - Moved to bottom */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <label className="text-base font-semibold text-gray-900 dark:text-white">Generated YAML</label>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(isClusterRoleMode 
                  ? generateClusterRoleYaml([{
                      apiVersion: 'rbac.authorization.k8s.io/v1',
                      kind: 'ClusterRole',
                      metadata: {
                        name: roleData.metadata.name,
                        ...(Object.keys(roleData.metadata.labels).length > 0 && {
                          labels: roleData.metadata.labels
                        })
                      },
                      rules: roleData.rules
                    }])
                  : generateRoleYaml([{
                      apiVersion: 'rbac.authorization.k8s.io/v1',
                      kind: 'Role',
                      metadata: {
                        name: roleData.metadata.name,
                        namespace: roleData.metadata.namespace!,
                        ...(Object.keys(roleData.metadata.labels).length > 0 && {
                          labels: roleData.metadata.labels
                        })
                      },
                      rules: roleData.rules
                    }])
                );
              }}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-sm font-medium"
              title="Copy to clipboard"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy YAML
            </button>
          </div>
          <div className="relative">
            <div className="absolute top-2 right-2 flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto border border-gray-700">
              <code>
                {isClusterRoleMode 
                  ? generateClusterRoleYaml([{
                      apiVersion: 'rbac.authorization.k8s.io/v1',
                      kind: 'ClusterRole',
                      metadata: {
                        name: roleData.metadata.name,
                        ...(Object.keys(roleData.metadata.labels).length > 0 && {
                          labels: roleData.metadata.labels
                        })
                      },
                      rules: roleData.rules
                    }])
                  : generateRoleYaml([{
                      apiVersion: 'rbac.authorization.k8s.io/v1',
                      kind: 'Role',
                      metadata: {
                        name: roleData.metadata.name,
                        namespace: roleData.metadata.namespace!,
                        ...(Object.keys(roleData.metadata.labels).length > 0 && {
                          labels: roleData.metadata.labels
                        })
                      },
                      rules: roleData.rules
                    }])
                }
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );

  const steps = [
    { title: 'Basic Configuration', component: renderStep1 },
    { title: 'Permissions', component: renderStep2 },
    { title: 'Review & Generate', component: renderStep3 }
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-4 mt-4 mb-6 border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      {/* Step Indicator with Progress Bar */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-full max-w-xl bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm px-3 py-2 flex items-center justify-between relative z-10 border border-gray-200 dark:border-gray-700">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center relative">
              <div className="relative flex items-center justify-center" style={{ zIndex: 2 }}>
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm
                    ${i < step ? 'border-blue-600 bg-blue-600 text-white' : ''}
                    ${i === step ? 'border-blue-600 bg-blue-600 text-white ring-2 ring-blue-200' : ''}
                    ${i > step ? 'border-gray-300 bg-gray-100 text-gray-400' : ''}
                  `}
                >
                  {i < step ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </span>
                {i < steps.length - 1 && (
                  <span className="absolute right-[-50%] top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-gray-300 z-0" style={{ left: '100%', width: '130%' }} />
                )}
              </div>
              <span className={`mt-1 text-xs text-center w-16 truncate transition-all duration-300
                ${i === step ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>{s.title}</span>
            </div>
          ))}
        </div>
        {/* Progress Bar */}
        <div className="w-full max-w-xl h-1 bg-gray-200 rounded-full mt-2 relative overflow-hidden">
          <div className="h-1 bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${((step) / (steps.length - 1)) * 100}%` }} />
        </div>
        <div className="w-full max-w-xl border-b border-gray-200 mt-2" />
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (step < steps.length - 1) nextStep();
        }}
        className="space-y-4"
        aria-labelledby="role-wizard"
      >
        {steps[step].component()}
        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={step === 0 && onCancel ? onCancel : prevStep}
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 font-medium text-sm"
            aria-label={step === 0 ? 'Cancel' : 'Back'}
          >
            {step === 0 && onCancel ? <span>Cancel</span> : <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>}
          </button>
          {step < steps.length - 1 ? (
            <button
              type="submit"
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm"
              disabled={Object.keys(errors).length > 0}
              aria-label="Next"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              className="w-full inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium shadow-sm"
              onClick={handleSubmit}
              aria-label="Finish and Create Role"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Create Role
            </button>
          )}
        </div>
        {/* General error message */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-2 text-center text-red-600 text-xs font-medium flex items-center justify-center gap-2 bg-red-50 border border-red-200 rounded p-2">
            <Info className="w-3 h-3" /> Please fix the errors above before continuing.
          </div>
        )}
      </form>

      {/* Rule Wizard Modal */}
      {showRuleWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingRuleIndex !== null ? 'Edit Rule' : 'Add New Rule'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure the permissions for this rule
                  </p>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  onClick={closeRuleWizard}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Rule Wizard Steps */}
              <div className="space-y-4">
                {/* Step 1: API Groups */}
                {ruleWizardStep === 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">API Groups</h4>
                    <p className="text-xs text-gray-600 mb-3">Select the API groups for this rule</p>
                    <div className="space-y-2">
                      {API_GROUPS.map((group, index) => (
                        <label key={index} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ruleDraft.apiGroups.includes(group.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleRuleWizardChange('apiGroups', [...ruleDraft.apiGroups, group.name]);
                              } else {
                                handleRuleWizardChange('apiGroups', ruleDraft.apiGroups.filter(g => g !== group.name));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{group.displayName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Resources */}
                {ruleWizardStep === 1 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Resources</h4>
                    <p className="text-xs text-gray-600 mb-3">Select the resources this rule applies to</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['pods', 'services', 'configmaps', 'secrets', 'deployments', 'replicasets', 'persistentvolumeclaims', 'ingresses'].map((resource) => (
                        <label key={resource} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ruleDraft.resources.includes(resource)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleRuleWizardChange('resources', [...ruleDraft.resources, resource]);
                              } else {
                                handleRuleWizardChange('resources', ruleDraft.resources.filter(r => r !== resource));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{resource}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Verbs */}
                {ruleWizardStep === 2 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Verbs</h4>
                    <p className="text-xs text-gray-600 mb-3">Select the actions this rule allows</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_VERBS.map((verb) => (
                        <label key={verb} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ruleDraft.verbs.includes(verb)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleRuleWizardChange('verbs', [...ruleDraft.verbs, verb]);
                              } else {
                                handleRuleWizardChange('verbs', ruleDraft.verbs.filter(v => v !== verb));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{verb}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {ruleWizardStep === 3 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 dark:text-gray-100">Review Rule</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-400">API Groups:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {ruleDraft.apiGroups.map((groupName, i) => {
                            const group = API_GROUPS.find(g => g.name === groupName);
                            return (
                              <span key={i} className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 text-xs rounded-full dark:text-blue-100">
                                {group ? group.displayName : (groupName || '(core)')}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-400">Resources:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {ruleDraft.resources.map((resource, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 text-xs rounded-full dark:text-green-100">
                              {resource}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-400">Verbs:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {ruleDraft.verbs.map((verb, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 text-xs rounded-full dark:text-purple-100">
                              {verb}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleRuleWizardPrev}
                  disabled={ruleWizardStep === 0}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </button>
                {ruleWizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleRuleWizardNext}
                    disabled={
                      (ruleWizardStep === 0 && ruleDraft.apiGroups.length === 0) ||
                      (ruleWizardStep === 1 && ruleDraft.resources.length === 0) ||
                      (ruleWizardStep === 2 && ruleDraft.verbs.length === 0)
                    }
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRuleWizardFinish}
                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm"
                  >
                    {editingRuleIndex !== null ? 'Update Rule' : 'Add Rule'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleWizardManager; 