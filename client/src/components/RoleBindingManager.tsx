import React, { useState, useEffect } from 'react';
import { generateRoleBindingYAML } from '../utils/yamlGenerator';
import type { RoleBinding, Subject, ServiceAccount } from '../types';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, Info, User, Users, UserCheck, Copy } from 'lucide-react';

// Props for integration (to be wired up in App.tsx)
interface RoleBindingManagerProps {
  namespaces?: string[];
  roles?: { name: string; namespace: string; description?: string }[];
  clusterRoles?: { name: string; description?: string }[];
  serviceAccounts?: ServiceAccount[];
  initialBinding?: RoleBinding;
  onSubmit?: (binding: RoleBinding) => void;
  onCancel?: () => void;
}

const defaultRoleBinding: RoleBinding = {
  name: '',
  namespace: '',
  isClusterRoleBinding: false,
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'Role',
    name: '',
  },
  subjects: [],
};

const subjectKinds = [
  { kind: 'User', icon: <User className="inline w-4 h-4 mr-1" /> },
  { kind: 'Group', icon: <Users className="inline w-4 h-4 mr-1" /> },
  { kind: 'ServiceAccount', icon: <UserCheck className="inline w-4 h-4 mr-1" /> },
];

function validateDNS1123(name: string) {
  return /^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/.test(name);
}

function getApiGroupForKind(kind: string) {
  if (kind === 'User' || kind === 'Group') return 'rbac.authorization.k8s.io';
  if (kind === 'ServiceAccount') return '';
  return '';
}

const RoleBindingManager: React.FC<RoleBindingManagerProps> = ({ namespaces = [], roles = [], clusterRoles = [], serviceAccounts = [], initialBinding, onSubmit, onCancel }) => {
  const [step, setStep] = useState(0);
  const [binding, setBinding] = useState<RoleBinding>(initialBinding ? { ...initialBinding } : { ...defaultRoleBinding });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [showServiceAccountDropdown, setShowServiceAccountDropdown] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (initialBinding) {
      setBinding({ ...initialBinding });
    }
  }, [initialBinding]);

  // Step 1: Basic Config
  const handleBasicChange = (field: keyof RoleBinding, value: any) => {
    setBinding(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Step 2: RoleRef
  const handleRoleRefChange = (field: keyof RoleBinding['roleRef'], value: any) => {
    setBinding(prev => ({
      ...prev,
      roleRef: { ...prev.roleRef, [field]: value },
    }));
    setTouched(prev => ({ ...prev, [`roleRef.${field}`]: true }));
  };

  // Step 3: Subjects
  const handleSubjectChange = (idx: number, field: keyof Subject, value: any) => {
    setBinding(prev => {
      const subjects = [...prev.subjects];
      subjects[idx] = { ...subjects[idx], [field]: value };
      // Auto-set apiGroup and name for ServiceAccount
      if (field === 'kind') {
        subjects[idx].apiGroup = getApiGroupForKind(value);
        if (value === 'ServiceAccount') {
          subjects[idx].namespace = '';
          subjects[idx].name = 'default';
        } else {
          delete subjects[idx].namespace;
          subjects[idx].name = '';
        }
      }
      return { ...prev, subjects };
    });
  };
  const addSubject = () => {
    setBinding(prev => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        { kind: 'User', name: '', apiGroup: 'rbac.authorization.k8s.io' },
      ],
    }));
  };
  const removeSubject = (idx: number) => {
    setBinding(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== idx),
    }));
  };

  // Validation
  const validateStep = () => {
    const errs: { [key: string]: string } = {};
    
    // Only validate the current step
    if (step === 0) {
      if (!binding.name) errs.name = 'Name is required.';
      else if (!validateDNS1123(binding.name)) errs.name = 'Invalid DNS-1123 subdomain.';
      if (!binding.isClusterRoleBinding && !binding.namespace) errs.namespace = 'Namespace is required.';
    }
    if (step === 1) {
      if (!binding.roleRef.kind) errs['roleRef.kind'] = 'Role type is required.';
      if (!binding.roleRef.name) errs['roleRef.name'] = 'Role name is required.';
      
      // Check if roles exist for the selected type and namespace
      if (binding.roleRef.kind === 'Role' && binding.namespace) {
        const availableRoles = roles.filter(r => r.namespace === binding.namespace);
        if (availableRoles.length === 0) {
          errs['roleRef.kind'] = `No Roles found in namespace '${binding.namespace}'. Please create a Role first or select a different namespace.`;
        } else if (binding.roleRef.name && !availableRoles.find(r => r.name === binding.roleRef.name)) {
          errs['roleRef.name'] = 'Role not found in selected namespace.';
        }
      }
      
      if (binding.roleRef.kind === 'ClusterRole') {
        if (clusterRoles.length === 0) {
          errs['roleRef.kind'] = 'No ClusterRoles found. Please create a ClusterRole first.';
        } else if (binding.roleRef.name && !clusterRoles.find(r => r.name === binding.roleRef.name)) {
          errs['roleRef.name'] = 'ClusterRole not found.';
        }
      }
      
      if (!binding.isClusterRoleBinding && binding.roleRef.kind === 'ClusterRole' && !binding.namespace) {
        errs.namespace = 'Namespace required for RoleBinding.';
      }
      if (binding.isClusterRoleBinding && binding.roleRef.kind !== 'ClusterRole') {
        errs['roleRef.kind'] = 'ClusterRoleBinding must reference a ClusterRole.';
      }
    }
    if (step === 2) {
      if (!binding.subjects.length) errs.subjects = 'At least one subject is required.';
      binding.subjects.forEach((s, i) => {
        if (!s.name) errs[`subjects.${i}.name`] = 'Name required.';
        if (s.kind === 'ServiceAccount' && !s.namespace) errs[`subjects.${i}.namespace`] = 'Namespace required for ServiceAccount.';
        if (s.kind === 'ServiceAccount' && s.namespace && !namespaces.includes(s.namespace)) errs[`subjects.${i}.namespace`] = 'Namespace does not exist.';
        if (s.kind !== 'ServiceAccount' && s.namespace) errs[`subjects.${i}.namespace`] = 'Namespace only for ServiceAccount.';
      });
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step navigation
  const nextStep = () => {
    const isValid = validateStep();
    console.log('Validation result:', { step, isValid, errors, binding });
    if (isValid) setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => Math.max(0, s - 1));

  // Step 1: Basic Config
  const renderStep1 = () => (
    <div className="mb-6">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-1 dark:text-white">Step 1: Basic Configuration</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose the binding type and provide a unique name for your RoleBinding or ClusterRoleBinding.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-base font-medium text-gray-900 mb-2 dark:text-white">
            Binding Type
            <span className="ml-2 text-gray-500 cursor-pointer dark:text-gray-400" title="RoleBinding is namespace-scoped. ClusterRoleBinding is cluster-wide.">
              <Info className="inline w-4 h-4" />
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="relative flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 dark:border-gray-700 dark:hover:border-blue-400 dark:hover:bg-blue-500">
              <input
                type="radio"
                className="sr-only"
                checked={!binding.isClusterRoleBinding}
                onChange={() => handleBasicChange('isClusterRoleBinding', false)}
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${!binding.isClusterRoleBinding ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}> 
                {!binding.isClusterRoleBinding && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm dark:text-white">RoleBinding</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Namespace-scoped permissions</div>
              </div>
            </label>
            <label className="relative flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 dark:border-gray-700 dark:hover:border-blue-400 dark:hover:bg-blue-500">
              <input
                type="radio"
                className="sr-only"
                checked={binding.isClusterRoleBinding}
                onChange={() => handleBasicChange('isClusterRoleBinding', true)}
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${binding.isClusterRoleBinding ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}> 
                {binding.isClusterRoleBinding && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm dark:text-white">ClusterRoleBinding</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Cluster-wide permissions</div>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-base font-medium text-gray-900 mb-2 dark:text-white">
            Binding Name <span className="text-red-500">*</span>
            <span className="ml-2 text-gray-500 cursor-pointer dark:text-gray-400" title="Must be a valid DNS-1123 subdomain (lowercase, numbers, '-', '.')">
              <Info className="inline w-4 h-4" />
            </span>
          </label>
          <input
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
            value={binding.name}
            onChange={e => handleBasicChange('name', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            placeholder="e.g. dev-team-binding"
            aria-label="RoleBinding name"
          />
          {touched.name && errors.name && (
            <div className="text-red-500 text-xs mt-2 flex items-center bg-red-50 border border-red-200 rounded p-2  dark:border-red-400">
              <Info className="w-3 h-3 mr-1" />
              {errors.name}
            </div>
          )}
        </div>

        {!binding.isClusterRoleBinding && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <label className="block text-base font-medium text-gray-900 mb-2 dark:text-white">
              Namespace <span className="text-red-500">*</span>
              <span className="ml-2 text-gray-500 cursor-pointer dark:text-gray-400" title="The namespace in which this RoleBinding will be created.">
                <Info className="inline w-4 h-4" />
              </span>
            </label>
            <select
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.namespace ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
              value={binding.namespace}
              onChange={e => handleBasicChange('namespace', e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, namespace: true }))}
              aria-label="Namespace for RoleBinding"
            >
              <option value="">Select namespace</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
            {touched.namespace && errors.namespace && (
              <div className="text-red-500 text-xs mt-1 flex items-center bg-red-50 border border-red-200 rounded p-2">
                <Info className="w-3 h-3 mr-1" />
                {errors.namespace}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Step 2: RoleRef
  const renderStep2 = () => (
    <div className="mb-6">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-1 dark:text-white">Step 2: Select Role Reference</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose the type of role and select the specific Role or ClusterRole to bind to subjects.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-base font-medium text-gray-900 mb-2 dark:text-white">
            Role Type
            <span className="ml-2 text-gray-500 cursor-pointer dark:text-gray-400" title="A Role is namespace-scoped. A ClusterRole is cluster-wide.">
              <Info className="inline w-4 h-4" />
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="relative flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 dark:bg-gray-800 dark:text-white dark:hover:bg-blue-600">
              <input
                type="radio"
                className="sr-only"
                checked={binding.roleRef.kind === 'Role'}
                onChange={() => handleRoleRefChange('kind', 'Role')}
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 dark:border-gray-700 ${binding.roleRef.kind === 'Role' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                {binding.roleRef.kind === 'Role' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm dark:text-white">Role</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Namespace-scoped permissions</div>
              </div>
            </label>
            <label className="relative flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 dark:bg-gray-800 dark:text-white dark:hover:bg-blue-600">
              <input
                type="radio"
                className="sr-only"
                checked={binding.roleRef.kind === 'ClusterRole'}
                onChange={() => handleRoleRefChange('kind', 'ClusterRole')}
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 dark:border-gray-700 ${binding.roleRef.kind === 'ClusterRole' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                {binding.roleRef.kind === 'ClusterRole' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm dark:text-white">ClusterRole</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Cluster-wide permissions</div>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-base font-medium text-gray-900 mb-2 dark:text-white">
            Role Name <span className="text-red-500">*</span>
            <span className="ml-2 text-gray-500 cursor-pointer dark:text-gray-400" title="Select the specific Role or ClusterRole to bind.">
              <Info className="inline w-4 h-4" />
            </span>
          </label>
          <select
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors['roleRef.name'] ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
            value={binding.roleRef.name}
            onChange={e => handleRoleRefChange('name', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, 'roleRef.name': true }))}
            aria-label="Role name"
          >
            <option value="">Select a {binding.roleRef.kind || 'role'}</option>
            {binding.roleRef.kind === 'Role' && binding.namespace && roles
              .filter(r => r.namespace === binding.namespace)
              .map(role => (
                <option key={role.name} value={role.name}>
                  {role.name} {role.description && `(${role.description})`}
                </option>
              ))}
            {binding.roleRef.kind === 'ClusterRole' && clusterRoles.map(role => (
              <option key={role.name} value={role.name}>
                {role.name} {role.description && `(${role.description})`}
              </option>
            ))}
          </select>
          {touched['roleRef.name'] && errors['roleRef.name'] && (
            <div className="text-red-500 text-xs mt-1 flex items-center bg-red-50 border border-red-200 rounded p-2">
              <Info className="w-3 h-3 mr-1" />
              {errors['roleRef.name']}
            </div>
          )}
          {touched['roleRef.kind'] && errors['roleRef.kind'] && (
            <div className="text-red-500 text-xs mt-1 flex items-center bg-red-50 border border-red-200 rounded p-2">
              <Info className="w-3 h-3 mr-1" />
              {errors['roleRef.kind']}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 3: Subjects
  const renderStep3 = () => (
    <div className="mb-6">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-1 dark:text-white">Step 3: Configure Subjects</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add one or more subjects (users, groups, or service accounts) to bind to the selected role.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-base font-medium text-gray-900 dark:text-white">
            Subjects <span className="text-red-500">*</span>
            <span className="ml-2 text-gray-500 dark:text-gray-400 cursor-pointer" title="Subjects are users, groups, or service accounts that will receive the permissions.">
              <Info className="inline w-4 h-4" />
            </span>
          </label>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-sm font-medium"
            onClick={addSubject}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Subject
          </button>
        </div>
        
        {errors.subjects && (
          <div className="text-red-500 text-xs flex items-center bg-red-50 border border-red-200 rounded p-2">
            <Info className="w-3 h-3 mr-1" />
            {errors.subjects}
          </div>
        )}
        
        <div className="space-y-3">
          {binding.subjects.map((subject, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700 shadow-sm relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1 dark:text-white">
                    Kind
                    <span className="ml-1 text-gray-500 dark:text-gray-400 cursor-pointer" title="Choose the type of subject.">
                      <Info className="inline w-3 h-3" />
                    </span>
                  </label>
                  <select
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg shadow-sm bg-white text-xs text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={subject.kind}
                    onChange={e => handleSubjectChange(idx, 'kind', e.target.value)}
                  >
                    {subjectKinds.map(sk => (
                      <option key={sk.kind} value={sk.kind}>{sk.kind}</option>
                    ))}
                  </select>
                </div>
                
                {subject.kind === 'ServiceAccount' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1 dark:text-white">
                      Namespace <span className="text-red-500">*</span>
                      <span className="ml-1 text-gray-500 dark:text-gray-400 cursor-pointer" title="Namespace for the service account.">
                        <Info className="inline w-3 h-3" />
                      </span>
                    </label>
                    <select
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors[`subjects.${idx}.namespace`] ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      value={subject.namespace || ''}
                      onChange={e => handleSubjectChange(idx, 'namespace', e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, [`subjects.${idx}.namespace`]: true }))}
                      aria-label="Namespace for ServiceAccount"
                    >
                      <option value="">Select namespace</option>
                      {namespaces.map(ns => (
                        <option key={ns} value={ns}>{ns}</option>
                      ))}
                    </select>
                    {touched[`subjects.${idx}.namespace`] && errors[`subjects.${idx}.namespace`] && (
                      <div className="text-red-500 text-xs mt-1 flex items-center dark:bg-red-500 dark:border-red-500 rounded p-1">
                        <Info className="w-3 h-3 mr-1" />
                        {errors[`subjects.${idx}.namespace`]}
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1 dark:text-white">
                    Name <span className="text-red-500">*</span>
                    <span className="ml-1 text-gray-500 dark:text-gray-400 cursor-pointer" title="The name of the user, group, or service account.">
                      <Info className="inline w-3 h-3" />
                    </span>
                  </label>
                  {subject.kind === 'ServiceAccount' as any ? (
                    subject.namespace ? (
                      <div className="relative">
                        <input
                          className={`w-full px-2 py-1.5 border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors[`subjects.${idx}.name`] ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                          value={subject.name}
                          onChange={e => handleSubjectChange(idx, 'name', e.target.value)}
                          onFocus={() => setShowServiceAccountDropdown(prev => ({ ...prev, [idx]: true }))}
                          onBlur={() => {
                            setTouched(prev => ({ ...prev, [`subjects.${idx}.name`]: true }));
                            setTimeout(() => setShowServiceAccountDropdown(prev => ({ ...prev, [idx]: false })), 200);
                          }}
                          placeholder="Type ServiceAccount name or select from list"
                          aria-label="ServiceAccount name"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowServiceAccountDropdown(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />
                          </svg>
                        </button>
                        {showServiceAccountDropdown[idx] && (
                          <div className="absolute z-10 w-full mt-1 dark:bg-gray-800 dark:border-gray-700 border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                            <div className="py-1">
                              <div
                                className="px-2 py-1 text-xs text-gray-900 dark:text-white hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  handleSubjectChange(idx, 'name', 'default');
                                  setShowServiceAccountDropdown(prev => ({ ...prev, [idx]: false }));
                                }}
                              >
                                default
                              </div>
                              {serviceAccounts
                                .filter(sa => sa.namespace === subject.namespace)
                                .filter(sa => sa.name !== 'default')
                                .filter(sa => !subject.name || sa.name.toLowerCase().includes(subject.name.toLowerCase()))
                                .map(sa => (
                                  <div
                                    key={`${sa.namespace}-${sa.name}`}
                                    className="px-2 py-1 text-xs text-gray-900 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      handleSubjectChange(idx, 'name', sa.name);
                                      setShowServiceAccountDropdown(prev => ({ ...prev, [idx]: false }));
                                    }}
                                  >
                                    {sa.name}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                        Select namespace first to see available ServiceAccounts
                      </div>
                    )
                  ) : (
                    <input
                      className={`w-full px-2 py-1.5 border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors[`subjects.${idx}.name`] ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      value={subject.name}
                      onChange={e => handleSubjectChange(idx, 'name', e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, [`subjects.${idx}.name`]: true }))}
                      placeholder={subject.kind === 'ServiceAccount' ? 'e.g. default' : 'e.g. alice'}
                      aria-label="Subject name"
                    />
                  )}
                  {touched[`subjects.${idx}.name`] && errors[`subjects.${idx}.name`] && (
                    <div className="text-red-500 text-xs mt-1 flex items-center bg-red-50 border border-red-200 rounded p-1">
                      <Info className="w-3 h-3 mr-1" />
                      {errors[`subjects.${idx}.name`]}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-1">
                    API Group
                    <span className="ml-1 text-gray-500 dark:text-gray-400 cursor-pointer" title="Auto-filled based on subject kind.">
                      <Info className="inline w-3 h-3" />
                    </span>
                  </label>
                  <input
                    className="w-full px-2 py-1.5 border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white rounded-lg shadow-sm bg-gray-50 text-xs text-gray-500 cursor-not-allowed"
                    value={subject.apiGroup || ''}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              
              <button
                type="button"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                onClick={() => removeSubject(idx)}
                title="Remove Subject"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Step 4: Review & Generate
  const renderStep4 = () => (
    <div className="mb-6">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Step 4: Review & Generate</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review your configuration and generate the YAML for your RoleBinding or ClusterRoleBinding.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Configuration Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Basic Information</h4>
              <div className="space-y-1 text-xs">
                <div className=' text-gray-900 dark:text-white'><span className="font-medium text-gray-900 dark:text-white">Type:</span> {binding.isClusterRoleBinding ? 'ClusterRoleBinding' : 'RoleBinding'}</div>
                <div className=' text-gray-900 dark:text-white'><span className="font-medium text-gray-900 dark:text-white">Name:</span> {binding.name}</div>
                {!binding.isClusterRoleBinding && <div className=' text-gray-900 dark:text-white'><span className="font-medium text-gray-900 dark:text-white">Namespace:</span> {binding.namespace}</div>}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Role Reference</h4>
              <div className="space-y-1 text-xs">
                <div className=' text-gray-900 dark:text-white'><span className="font-medium text-gray-900 dark:text-white">Kind:</span> {binding.roleRef.kind}</div>
                <div className=' text-gray-900 dark:text-white'><span className="font-medium text-gray-900 dark:text-white">Name:</span> {binding.roleRef.name}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Subjects ({binding.subjects.length})</h4>
            <div className="space-y-1">
              {binding.subjects.map((subject, idx) => (
                <div key={idx} className="text-xs bg-white/50 rounded p-2 border border-gray-200 dark:bg-gray-800">
                  <div className=' text-gray-900 dark:text-white'><span className="font-medium text-gray-900 dark:text-white">Kind:</span> {subject.kind}</div>
                  <div className=' text-gray-900 dark:text-white'><span className="font-medium text-gray-900 dark:text-white">Name:</span> {subject.name}</div>
                  {subject.namespace && <div className=' text-gray-900 dark:text-white'><span className="font-medium text-gray-900 dark:text-white">Namespace:</span> {subject.namespace}</div>}
                  {subject.apiGroup && <div className=' text-gray-900 dark:text-white'><span className="font-medium text-gray-900 dark:text-white">API Group:</span> {subject.apiGroup}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-base font-medium text-gray-900 dark:text-white">Generated YAML</label>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generateRoleBindingYAML(binding));
                // You could add a toast notification here
              }}
              className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
              title="Copy to clipboard"
            >
              <Copy className="w-3 h-3 mr-1" /> Copy
            </button>
          </div>
          <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
            <code>{generateRoleBindingYAML(binding)}</code>
          </pre>
        </div>
      </div>
    </div>
  );

  // Wizard steps
  const steps = [
    { label: 'Basic Configuration', render: renderStep1 },
    { label: 'Role Reference', render: renderStep2 },
    { label: 'Subjects', render: renderStep3 },
    { label: 'Review & Generate', render: renderStep4 },
  ];

  // Modal container
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-4 mt-4 mb-6 border  border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      {/* Step Indicator with Progress Bar */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-full max-w-xl bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm px-3 py-2 flex items-center justify-between relative z-10 border border-gray-200 dark:border-gray-700">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center relative">
              <div className="relative flex items-center justify-center" style={{ zIndex: 2 }}>
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm
                    ${i < step ? 'border-blue-600 bg-blue-600 text-white' : ''}
                    ${i === step ? 'border-blue-600 bg-blue-600 text-white ring-2 ring-blue-200 dark:ring-blue-400/40' : ''}
                    ${i > step ? 'border-gray-300 bg-gray-100 text-gray-400  dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500' : ''}
                  `}
                >
                  {i < step ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </span>
                {i < steps.length - 1 && (
                  <span className="absolute right-[-50%] top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-gray-300 z-0 dark:bg-gray-700" style={{ left: '100%', width: '130%' }} />
                )}
              </div>
              <span className={`mt-1 text-xs text-center w-16 truncate transition-all duration-300
                ${i === step ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>{s.label}</span>
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
        className="space-y-6"
        aria-labelledby="rolebinding-wizard"
      >
        {steps[step].render()}
        <div className="flex justify-between mt-6">
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
              aria-label="Next"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSubmit && onSubmit(binding)}
              className="w-full inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium shadow-sm"
              aria-label="Create RoleBinding"
            >
              <Check className="w-4 h-4 mr-1" /> Create RoleBinding
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export { RoleBindingManager }; 