import React, { useState } from 'react';
import { Play } from 'lucide-react';
import type { Container, EnvVar } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Helper for tooltips
const Tooltip = ({ text }: { text: string }) => (
  <span className="ml-1 text-gray-400 cursor-help" tabIndex={0} aria-label={text} title={text}>
    <svg className="inline w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
  </span>
);

export interface JobFormProps {
  mode: 'job' | 'cronjob';
  namespaces: string[];
  onSave: (yaml: string, asTemplate: boolean, state: JobFormState) => void;
  initialValues?: Partial<JobFormState>;
  onClose?: () => void;
  availableConfigMaps: import('../types').ConfigMap[];
  availableSecrets: import('../types').Secret[];
}

interface JobFormState {
  name: string;
  containers: Container[];
  namespace: string;
  labels: { key: string; value: string }[];
  restartPolicy: 'Never' | 'OnFailure';
  // Scaling fields
  replicas: number;
  completions: number;
  backoffLimit: number;
  // CronJob fields
  schedule: string;
  concurrencyPolicy: 'Allow' | 'Forbid' | 'Replace';
  startingDeadline: string;
  historySuccess: string;
  historyFailure: string;
  saveAsTemplate: boolean;
}

const defaultContainer: Container = {
  name: '',
  image: '',
  env: [],
  resources: {
    requests: { cpu: '100m', memory: '128Mi' },
    limits: { cpu: '', memory: '' }
  },
  volumeMounts: []
};

const defaultState: JobFormState = {
  name: '',
  containers: [ { ...defaultContainer } ],
  namespace: 'default',
  labels: [],
  restartPolicy: 'Never',
  replicas: 1,
  completions: 1,
  backoffLimit: 6,
  schedule: '',
  concurrencyPolicy: 'Allow',
  startingDeadline: '',
  historySuccess: '',
  historyFailure: '',
  saveAsTemplate: false,
};

function validateJob(state: JobFormState, mode: 'job' | 'cronjob') {
  const errors: { [k: string]: string } = {};
  if (!state.name) errors.name = 'Job name is required.';
  else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(state.name) || state.name.length > 63)
    errors.name = 'Alphanumeric, dashes, max 63 chars.';
  if (!state.namespace) errors.namespace = 'Namespace is required.';
  if (!state.containers.length) errors.containers = 'At least one container is required.';
  state.containers.forEach((c, i) => {
    if (!c.image) errors[`container-image-${i}`] = 'Container image is required.';
    if (!c.name) errors[`container-name-${i}`] = 'Container name is required.';
    if (!c.resources.requests.cpu) errors[`container-cpu-${i}`] = 'CPU request is required.';
    if (!c.resources.requests.memory) errors[`container-mem-${i}`] = 'Memory request is required.';
  });
  if (mode === 'cronjob') {
    if (!state.schedule) errors.schedule = 'Schedule is required.';
    else if (!/^([*\/0-9,-]+\s+){4}[*\/0-9,-]+$/.test(state.schedule)) errors.schedule = 'Invalid cron format.';
  }
  return errors;
}

function generateJobYaml(state: JobFormState, mode: 'job' | 'cronjob') {
  const meta = `  name: ${state.name}\n  namespace: ${state.namespace}\n  labels:${state.labels.length ? '' : ' {}'}\n` +
    state.labels.map(l => `    ${l.key}: ${l.value}`).join('\n');
  const containersYaml = state.containers.map(c =>
    `      - name: ${c.name || 'container'}\n        image: ${c.image}\n` +
    (c.command ? `        command: [${c.command.split(' ').map(s => `\"${s}\"`).join(', ')}]\n` : '') +
    (c.args ? `        args: [${c.args.split(' ').map(s => `\"${s}\"`).join(', ')}]\n` : '') +
    `        resources:\n          requests:\n            cpu: \"${c.resources.requests.cpu}\"\n            memory: \"${c.resources.requests.memory}\"\n` +
    (c.resources.limits.cpu || c.resources.limits.memory ? `          limits:\n            cpu: \"${c.resources.limits.cpu || c.resources.requests.cpu}\"\n            memory: \"${c.resources.limits.memory || c.resources.requests.memory}\"\n` : '')
  ).join('');
  const jobSpec = `apiVersion: batch/v1\nkind: Job\nmetadata:\n${meta}spec:\n  parallelism: ${state.replicas}\n  completions: ${state.completions}\n  backoffLimit: ${state.backoffLimit}\n  template:\n    spec:\n      restartPolicy: ${state.restartPolicy}\n      containers:\n${containersYaml}`;
  if (mode === 'job') return jobSpec;
  return `apiVersion: batch/v1\nkind: CronJob\nmetadata:\n${meta}spec:\n  schedule: \"${state.schedule}\"\n  concurrencyPolicy: ${state.concurrencyPolicy}\n  startingDeadlineSeconds: ${state.startingDeadline || 60}\n  successfulJobsHistoryLimit: ${state.historySuccess || 3}\n  failedJobsHistoryLimit: ${state.historyFailure || 1}\n  jobTemplate:\n    spec:\n      parallelism: ${state.replicas}\n      completions: ${state.completions}\n      backoffLimit: ${state.backoffLimit}\n      template:\n        spec:\n          restartPolicy: ${state.restartPolicy}\n          containers:\n${containersYaml}`;
}

export const JobForm: React.FC<JobFormProps> = ({ mode, namespaces, onSave, initialValues, onClose, availableConfigMaps, availableSecrets }) => {
  const [state, setState] = useState<JobFormState>({ ...defaultState, ...initialValues });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [yaml, setYaml] = useState('');
  const [testScheduleResult, setTestScheduleResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Filter ConfigMaps and Secrets by selected namespace
  const filteredConfigMaps = availableConfigMaps.filter(cm => cm.namespace === state.namespace);
  const filteredSecrets = availableSecrets.filter(s => s.namespace === state.namespace);

  React.useEffect(() => {
    setYaml(generateJobYaml(state, mode));
  }, [state, mode]);

  function handleChange<K extends keyof JobFormState>(key: K, value: JobFormState[K]) {
    setState(s => ({ ...s, [key]: value }));
  }

  function handleLabelChange(idx: number, key: string, value: string) {
    setState(s => ({
      ...s,
      labels: s.labels.map((l, i) => i === idx ? { key, value } : l)
    }));
  }

  function addLabel() {
    setState(s => ({ ...s, labels: [...s.labels, { key: '', value: '' }] }));
  }

  function removeLabel(idx: number) {
    setState(s => ({ ...s, labels: s.labels.filter((_, i) => i !== idx) }));
  }

  function addContainer() {
    setState(s => ({ ...s, containers: [...s.containers, { ...defaultContainer }] }));
  }

  function removeContainer(idx: number) {
    setState(s => ({ ...s, containers: s.containers.filter((_, i) => i !== idx) }));
  }

  function duplicateContainer(idx: number) {
    setState(s => {
      const containerToDuplicate = s.containers[idx];
      const duplicated = { ...containerToDuplicate, name: containerToDuplicate.name ? `${containerToDuplicate.name}-copy` : '' };
      const newContainers = [...s.containers];
      newContainers.splice(idx + 1, 0, duplicated);
      return { ...s, containers: newContainers };
    });
  }

  function updateContainer(idx: number, updates: Partial<Container>) {
    setState(s => {
      const newContainers = [...s.containers];
      newContainers[idx] = { ...newContainers[idx], ...updates };
      return { ...s, containers: newContainers };
    });
  }

  function addContainerEnvVar(containerIdx: number) {
    setState(s => {
      const newContainers = [...s.containers];
      newContainers[containerIdx].env.push({ name: '', value: '' });
      return { ...s, containers: newContainers };
    });
  }

  function removeContainerEnvVar(containerIdx: number, envIdx: number) {
    setState(s => {
      const newContainers = [...s.containers];
      newContainers[containerIdx].env = newContainers[containerIdx].env.filter((_, i) => i !== envIdx);
      return { ...s, containers: newContainers };
    });
  }

  function updateContainerEnvVar(containerIdx: number, envIdx: number, updates: Partial<EnvVar>) {
    setState(s => {
      const newContainers = [...s.containers];
      newContainers[containerIdx].env[envIdx] = { ...newContainers[containerIdx].env[envIdx], ...updates };
      return { ...s, containers: newContainers };
    });
  }

  function addContainerVolumeMount(containerIdx: number) {
    setState(s => {
      const newContainers = [...s.containers];
      newContainers[containerIdx].volumeMounts.push({ name: '', mountPath: '' });
      return { ...s, containers: newContainers };
    });
  }

  function removeContainerVolumeMount(containerIdx: number, mountIdx: number) {
    setState(s => {
      const newContainers = [...s.containers];
      newContainers[containerIdx].volumeMounts = newContainers[containerIdx].volumeMounts.filter((_, i) => i !== mountIdx);
      return { ...s, containers: newContainers };
    });
  }

  function updateContainerVolumeMount(containerIdx: number, mountIdx: number, field: 'name' | 'mountPath', value: string) {
    setState(s => {
      const newContainers = [...s.containers];
      newContainers[containerIdx].volumeMounts[mountIdx] = { ...newContainers[containerIdx].volumeMounts[mountIdx], [field]: value };
      return { ...s, containers: newContainers };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateJob(state, mode);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSave(yaml, false, state);
    }
  }

  function handleCopyYaml() {
    navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleTestSchedule() {
    // Simple cron test: show next 3 times (not a real cron parser)
    if (!/^([*\/0-9,-]+\s+){4}[*\/0-9,-]+$/.test(state.schedule)) {
      setTestScheduleResult('Invalid cron format.');
      return;
    }
    setTestScheduleResult('Next runs: (demo) 2024-06-12 12:00, 2024-06-12 12:05, 2024-06-12 12:10');
  }

  function handleDownloadYaml() {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.name || 'k8s-job'}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2 sm:px-0 dark:bg-opacity-60">
      <form className="w-full max-w-lg sm:max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]" autoComplete="off" onSubmit={handleSubmit}>
        {/* Modal Header */}
        <div className="sticky top-0 z-10 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Play className="w-6 h-6 text-blue-600 mr-2" />
            {mode === 'cronjob' ? 'Create CronJob' : 'Create Job'}
          </h2>
          {onClose && (
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* General Info */}
          <section className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-4">
            <h3 className="text-base font-semibold mb-3 flex items-center text-gray-900 dark:text-white">
              <Play className="w-5 h-5 text-blue-600 mr-2" /> General Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">Job Name <span className="text-red-500 ml-1">*</span> <Tooltip text="Alphanumeric, dashes, max 63 chars. Used as metadata.name." /></label>
                <input className={`w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${errors.name ? 'border-red-500' : 'border-gray-300'}`} value={state.name} maxLength={63} onChange={e => handleChange('name', e.target.value)} required aria-invalid={!!errors.name} />
                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">Namespace <span className="text-red-500 ml-1">*</span> <Tooltip text="Kubernetes namespace to create the Job in." /></label>

                <select className={`w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${errors.namespace ? 'border-red-500' : 'border-gray-300'}`} value={state.namespace} onChange={e => handleChange('namespace', e.target.value)} required>

                  <option value="">Select namespace</option>
                  {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
                </select>
                {errors.namespace && <div className="text-red-500 text-xs mt-1">{errors.namespace}</div>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">Labels <Tooltip text="Key-value pairs for metadata.labels." /></label>
                <div className="space-y-2">
                  {state.labels.map((l, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className="w-1/3 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="key" value={l.key} onChange={e => handleLabelChange(i, e.target.value, l.value)} />
                      <input className="w-1/2 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="value" value={l.value} onChange={e => handleLabelChange(i, l.key, e.target.value)} />
                      <button type="button" className="text-red-500 px-2" onClick={() => removeLabel(i)} aria-label="Remove label">×</button>
                    </div>
                  ))}
                  <button type="button" className="text-blue-600 text-xs mt-1" onClick={addLabel}>+ Add Label</button>
                </div>
              </div>
            </div>
          </section>
          {/* Containers Section */}
          <section className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold flex items-center text-gray-900 dark:text-white">
                <Play className="w-5 h-5 text-pink-600 mr-2" /> Containers ({state.containers.length})
              </h3>
              <button type="button" onClick={addContainer} className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm">
                <span className="mr-1">+</span> Add Container
              </button>
            </div>
            <div className="space-y-6">
              {state.containers.map((container, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-6 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Container {idx + 1} {container.name && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({container.name})</span>}</h4>
                    <div className="flex items-center space-x-2">
                      <button type="button" onClick={() => duplicateContainer(idx)} className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200" title="Duplicate container">⧉</button>
                      {state.containers.length > 1 && (
                        <button type="button" onClick={() => removeContainer(idx)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200" title="Remove container">×</button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-white">Container Name *</label>
                      <input type="text" value={container.name} onChange={e => updateContainer(idx, { name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="web-server" />
                      {errors[`container-name-${idx}`] && <div className="text-red-500 text-xs mt-1">{errors[`container-name-${idx}`]}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-white">Container Image *</label>

                      <input type="text" value={container.image} onChange={e => updateContainer(idx, { image: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="nginx:latest" />
                      {errors[`container-image-${idx}`] && <div className="text-red-500 text-xs mt-1">{errors[`container-image-${idx}`]}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-white">Command</label>
                      <input type="text" value={container.command || ''} onChange={e => updateContainer(idx, { command: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="e.g. sleep" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-white">Arguments</label>
                      <input type="text" value={container.args || ''} onChange={e => updateContainer(idx, { args: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="e.g. 60" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-white">CPU Request *</label>
                      <input type="text" value={container.resources.requests.cpu} onChange={e => updateContainer(idx, { resources: { ...container.resources, requests: { ...container.resources.requests, cpu: e.target.value } } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="e.g. 100m" />
                      {errors[`container-cpu-${idx}`] && <div className="text-red-500 text-xs mt-1">{errors[`container-cpu-${idx}`]}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-white">Memory Request *</label>

                      <input type="text" value={container.resources.requests.memory} onChange={e => updateContainer(idx, { resources: { ...container.resources, requests: { ...container.resources.requests, memory: e.target.value } } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="e.g. 128Mi" />
                      {errors[`container-mem-${idx}`] && <div className="text-red-500 text-xs mt-1">{errors[`container-mem-${idx}`]}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-white">CPU Limit</label>

                      <input type="text" value={container.resources.limits.cpu} onChange={e => updateContainer(idx, { resources: { ...container.resources, limits: { ...container.resources.limits, cpu: e.target.value } } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="e.g. 200m" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-white">Memory Limit</label>

                      <input type="text" value={container.resources.limits.memory} onChange={e => updateContainer(idx, { resources: { ...container.resources, limits: { ...container.resources.limits, memory: e.target.value } } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="e.g. 256Mi" />
                    </div>
                  </div>
                  {/* Environment Variables */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Environment Variables</h5>
                      <button type="button" onClick={() => addContainerEnvVar(idx)} className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200">
                        + Add
                      </button>
                    </div>
                    {container.env.length > 0 && (
                      <div className="space-y-3">
                        {container.env.map((envVar, envIdx) => (
                          <div key={envIdx} className="border border-gray-200 rounded-lg p-3 bg-white dark:border-gray-700 dark:bg-gray-900">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Variable Name *</label>
                                <input type="text" value={envVar.name} onChange={e => updateContainerEnvVar(idx, envIdx, { name: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="DATABASE_URL" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Value Source</label>
                                <select value={envVar.valueFrom ? envVar.valueFrom.type : 'direct'} onChange={e => {
                                  if (e.target.value === 'direct') {
                                    updateContainerEnvVar(idx, envIdx, { value: envVar.value || '', valueFrom: undefined });
                                  } else {
                                    updateContainerEnvVar(idx, envIdx, { value: undefined, valueFrom: { type: e.target.value as 'configMap' | 'secret', name: '', key: '' } });
                                  }
                                }} className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                  <option value="direct">Direct Value</option>
                                  <option value="configMap">ConfigMap</option>
                                  <option value="secret">Secret</option>
                                </select>
                              </div>
                              {envVar.valueFrom ? (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">{envVar.valueFrom.type === 'configMap' ? 'ConfigMap' : 'Secret'} Name</label>

                                    <select value={envVar.valueFrom.name} onChange={e => updateContainerEnvVar(idx, envIdx, { valueFrom: { ...envVar.valueFrom!, name: e.target.value } })} className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                      <option value="">Select {envVar.valueFrom.type}</option>
                                      {envVar.valueFrom.type === 'configMap'
                                        ? filteredConfigMaps.map(cm => (<option key={cm.name} value={cm.name}>{cm.name}</option>))
                                        : filteredSecrets.map(s => (<option key={s.name} value={s.name}>{s.name}</option>))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Key</label>
                                    <select value={envVar.valueFrom.key} onChange={e => updateContainerEnvVar(idx, envIdx, { valueFrom: { ...envVar.valueFrom!, key: e.target.value } })} className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" disabled={!envVar.valueFrom.name}>
                                      <option value="">Select key</option>
                                      {envVar.valueFrom.name && (
                                        envVar.valueFrom.type === 'configMap'
                                          ? filteredConfigMaps.find(cm => cm.name === envVar.valueFrom!.name)?.data &&
                                            Object.keys(filteredConfigMaps.find(cm => cm.name === envVar.valueFrom!.name)!.data).map(key => (
                                              <option key={key} value={key}>{key}</option>
                                            ))
                                          : filteredSecrets.find(s => s.name === envVar.valueFrom!.name)?.data &&
                                            Object.keys(filteredSecrets.find(s => s.name === envVar.valueFrom!.name)!.data).map(key => (
                                              <option key={key} value={key}>{key}</option>
                                            ))
                                      )}
                                    </select>
                                  </div>
                                </>
                              ) : (
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Value</label>
                                  <input type="text" value={envVar.value || ''} onChange={e => updateContainerEnvVar(idx, envIdx, { value: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="environment value" />
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end">
                              <button type="button" onClick={() => removeContainerEnvVar(idx, envIdx)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200">×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Volume Mounts */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Volume Mounts</h5>
                      <button type="button" onClick={() => addContainerVolumeMount(idx)} className="inline-flex items-center px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors duration-200">
                        + Add
                      </button>
                    </div>
                    {container.volumeMounts.length > 0 && (
                      <div className="space-y-2">
                        {container.volumeMounts.map((mount, mountIdx) => (
                          <div key={mountIdx} className="flex items-center space-x-2">
                            <input type="text" value={mount.name} onChange={e => updateContainerVolumeMount(idx, mountIdx, 'name', e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="Volume name" />
                            <input type="text" value={mount.mountPath} onChange={e => updateContainerVolumeMount(idx, mountIdx, 'mountPath', e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="/path/to/mount" />
                            <button type="button" onClick={() => removeContainerVolumeMount(idx, mountIdx)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
          {/* Job Policy Section */}
          <section className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-4">
            <h3 className="text-base font-semibold mb-3 flex items-center text-gray-900 dark:text-white">
              <Play className="w-5 h-5 text-green-600 mr-2" /> Job Policy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">Restart Policy <span className="text-red-500 ml-1">*</span> <Tooltip text="Job restart policy. Usually Never or OnFailure." /></label>
                <select className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={state.restartPolicy} onChange={e => handleChange('restartPolicy', e.target.value as any)} required>
                  <option value="Never">Never</option>
                  <option value="OnFailure">OnFailure</option>
                </select>
              </div>
            </div>
          </section>
          {/* Scaling and Upgrade Policy Section */}
          <section className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-4">
            <h3 className="text-base font-semibold mb-3 flex items-center text-gray-900 dark:text-white">
              <Play className="w-5 h-5 text-indigo-600 mr-2" /> Scaling and Upgrade Policy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">Replicas <Tooltip text="Number of pods to run in parallel." /></label>
                <input type="number" min="1" className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={state.replicas} onChange={e => handleChange('replicas', Number(e.target.value))} placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">Completions <Tooltip text="Number of successful completions required." /></label>
                <input type="number" min="1" className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={state.completions} onChange={e => handleChange('completions', Number(e.target.value))} placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">Backoff Limit <Tooltip text="Number of retries before marking as failed." /></label>
                <input type="number" min="0" className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={state.backoffLimit} onChange={e => handleChange('backoffLimit', Number(e.target.value))} placeholder="e.g. 6" />
              </div>
            </div>
          </section>
          {/* CronJob Section */}
          {mode === 'cronjob' && (
            <section className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-4">
              <h3 className="text-base font-semibold mb-3 flex items-center text-gray-900 dark:text-white">
                <Play className="w-5 h-5 text-purple-600 mr-2" /> CronJob Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">Schedule <span className="text-red-500 ml-1">*</span> <Tooltip text="Cron format, e.g. */5 * * * *." /></label>

                  <input className={`w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${errors.schedule ? 'border-red-500' : 'border-gray-300'}`} value={state.schedule} onChange={e => handleChange('schedule', e.target.value)} placeholder="e.g. */5 * * * *" required aria-invalid={!!errors.schedule} />
                  {errors.schedule && <div className="text-red-500 text-xs mt-1">{errors.schedule}</div>}
                  <button type="button" className="mt-2 text-blue-600 text-xs" onClick={handleTestSchedule}>Test Schedule</button>
                  {testScheduleResult && <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">{testScheduleResult}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">Concurrency Policy <Tooltip text="How concurrent jobs are handled." /></label>
                  <select className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={state.concurrencyPolicy} onChange={e => handleChange('concurrencyPolicy', e.target.value as any)}>
                    <option value="Allow">Allow</option>
                    <option value="Forbid">Forbid</option>
                    <option value="Replace">Replace</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">Starting Deadline (seconds) <Tooltip text="How long to try to start a job if missed." /></label>
                  <input className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={state.startingDeadline} onChange={e => handleChange('startingDeadline', e.target.value)} placeholder="e.g. 60" />

                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center dark:text-white">History Limits <Tooltip text="How many successful/failed jobs to keep." /></label>
                  <div className="flex gap-2">
                    <input className="w-1/2 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={state.historySuccess} onChange={e => handleChange('historySuccess', e.target.value)} placeholder="Success" />
                    <input className="w-1/2 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={state.historyFailure} onChange={e => handleChange('historyFailure', e.target.value)} placeholder="Failure" />
                  </div>
                </div>
              </div>
            </section>
          )}
          {/* YAML Preview, Save, Copy, and Template Actions */}
          <section className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
            <h3 className="text-base font-semibold mb-3 flex items-center text-gray-900 dark:text-white">
              <Play className="w-5 h-5 text-yellow-600 mr-2" /> YAML Preview
            </h3>
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-lg dark:bg-gray-950 dark:border-gray-800">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 dark:bg-gray-900 dark:border-gray-800 flex items-center justify-between rounded-t-xl">
                <span className="text-gray-400 text-sm font-mono dark:text-gray-500">{state.name || 'k8s-job'}.yaml</span>
                <div className="flex gap-2">
                  <button type="button" className="text-xs text-blue-400 hover:text-blue-200" onClick={handleCopyYaml}>{copied ? 'Copied!' : 'Copy'}</button>
                  <button type="button" className="text-xs text-green-400 hover:text-green-200" onClick={handleDownloadYaml}>Download</button>
                </div>
              </div>
              <div className="bg-gray-900 dark:bg-gray-950 p-0">
                <SyntaxHighlighter
                  language="yaml"
                  style={vscDarkPlus}
                  customStyle={{ borderRadius: '0 0 0.75rem 0.75rem', fontSize: 13, margin: 0, background: '#1e293b' }}
                  showLineNumbers
                  wrapLongLines
                >
                  {yaml}
                </SyntaxHighlighter>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end mt-4 gap-2">
              <button type="submit" className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">Save</button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}; 