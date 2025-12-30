import { Plus, Minus, Server, Key, Trash2, Copy, Globe, FileText, Database } from 'lucide-react';
import type { DaemonSetConfig, Container, ConfigMap, Secret, EnvVar } from '../types';
import React, { useState, useEffect, useRef } from 'react';

interface DaemonSetFormProps {
  config: DaemonSetConfig;
  onChange: (config: DaemonSetConfig) => void;
  availableNamespaces: string[];
  availableConfigMaps: ConfigMap[];
  availableSecrets: Secret[];
}

export function DaemonSetForm({ config, onChange, availableNamespaces, availableConfigMaps, availableSecrets }: DaemonSetFormProps) {
  const updateConfig = (updates: Partial<DaemonSetConfig>) => {
    onChange({ ...config, ...updates });
  };

  // Node Selector local state for editing
  const [nodeSelectorPairs, setNodeSelectorPairs] = useState<{ key: string; value: string }[]>([]);
  const isLocalNodeSelectorEdit = useRef(false);

  useEffect(() => {
    if (!isLocalNodeSelectorEdit.current) {
      setNodeSelectorPairs(
        config.nodeSelector && Object.keys(config.nodeSelector).length > 0
          ? Object.entries(config.nodeSelector).map(([key, value]) => ({ key, value }))
          : []
      );
    }
    isLocalNodeSelectorEdit.current = false;
  }, [config.nodeSelector]);

  // Helper to sync local state to config
  const syncNodeSelectorToConfig = (pairs: { key: string; value: string }[]) => {
    isLocalNodeSelectorEdit.current = true;
    const obj: Record<string, string> = {};
    pairs.forEach(({ key, value }) => {
      if (key.trim() !== '') obj[key] = value;
    });
    updateConfig({ nodeSelector: obj });
  };

  // Filter ConfigMaps and Secrets by namespace
  const filteredConfigMaps = availableConfigMaps.filter(cm => cm.namespace === config.namespace);
  const filteredSecrets = availableSecrets.filter(s => s.namespace === config.namespace);

  // Container management functions
  const addContainer = () => {
    const newContainer: Container = {
      name: '',
      image: '',
      port: 8080,
      env: [],
      resources: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '', memory: '' }
      },
      volumeMounts: []
    };
    updateConfig({
      containers: [...config.containers, newContainer]
    });
  };

  const removeContainer = (index: number) => {
    if (config.containers.length > 1) {
      updateConfig({
        containers: config.containers.filter((_, i) => i !== index)
      });
    }
  };

  const duplicateContainer = (index: number) => {
    const containerToDuplicate = config.containers[index];
    const duplicatedContainer: Container = {
      ...containerToDuplicate,
      name: containerToDuplicate.name ? `${containerToDuplicate.name}-copy` : '',
      resources: {
        requests: {
          cpu: containerToDuplicate.resources.requests.cpu || '100m',
          memory: containerToDuplicate.resources.requests.memory || '128Mi'
        },
        limits: {
          cpu: '',
          memory: ''
        }
      }
    };
    const newContainers = [...config.containers];
    newContainers.splice(index + 1, 0, duplicatedContainer);
    updateConfig({ containers: newContainers });
  };

  const updateContainer = (index: number, updates: Partial<Container>) => {
    const newContainers = [...config.containers];
    newContainers[index] = { ...newContainers[index], ...updates };
    updateConfig({ containers: newContainers });
  };

  const addContainerEnvVar = (containerIndex: number) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].env.push({ name: '', value: '' });
    updateConfig({ containers: newContainers });
  };

  const removeContainerEnvVar = (containerIndex: number, envIndex: number) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].env = newContainers[containerIndex].env.filter((_, i) => i !== envIndex);
    updateConfig({ containers: newContainers });
  };

  const updateContainerEnvVar = (containerIndex: number, envIndex: number, updates: Partial<EnvVar>) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].env[envIndex] = {
      ...newContainers[containerIndex].env[envIndex],
      ...updates
    };
    updateConfig({ containers: newContainers });
  };

  const addContainerVolumeMount = (containerIndex: number) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].volumeMounts.push({ name: '', mountPath: '' });
    updateConfig({ containers: newContainers });
  };

  const removeContainerVolumeMount = (containerIndex: number, mountIndex: number) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].volumeMounts = newContainers[containerIndex].volumeMounts.filter((_, i) => i !== mountIndex);
    updateConfig({ containers: newContainers });
  };

  const updateContainerVolumeMount = (containerIndex: number, mountIndex: number, field: 'name' | 'mountPath', value: string) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].volumeMounts[mountIndex] = {
      ...newContainers[containerIndex].volumeMounts[mountIndex],
      [field]: value
    };
    updateConfig({ containers: newContainers });
  };

  const addVolume = () => {
    updateConfig({
      volumes: [...config.volumes, { name: '', mountPath: '', type: 'emptyDir' }]
    });
  };

  const removeVolume = (index: number) => {
    updateConfig({
      volumes: config.volumes.filter((_, i) => i !== index)
    });
  };

  const updateVolume = (index: number, field: keyof typeof config.volumes[0], value: any) => {
    const newVolumes = [...config.volumes];
    newVolumes[index] = { ...newVolumes[index], [field]: value };
    updateConfig({ volumes: newVolumes });
  };

  // ConfigMap and Secret selection functions
  const toggleConfigMapSelection = (configMapName: string) => {
    const isSelected = config.selectedConfigMaps.includes(configMapName);
    if (isSelected) {
      updateConfig({
        selectedConfigMaps: config.selectedConfigMaps.filter(name => name !== configMapName)
      });
    } else {
      updateConfig({
        selectedConfigMaps: [...config.selectedConfigMaps, configMapName]
      });
    }
  };

  const toggleSecretSelection = (secretName: string) => {
    const isSelected = config.selectedSecrets.includes(secretName);
    if (isSelected) {
      updateConfig({
        selectedSecrets: config.selectedSecrets.filter(name => name !== secretName)
      });
    } else {
      updateConfig({
        selectedSecrets: [...config.selectedSecrets, secretName]
      });
    }
  };

  const getDefaultMountPath = (volumeName: string, volumeType: string): string => {
    if (volumeType === 'configMap') {
      return `/etc/config/${volumeName}`;
    } else if (volumeType === 'secret') {
      return `/etc/secrets/${volumeName}`;
    }
    return `/data/${volumeName}`;
  };

  // Node Selector Presets
  const nodeSelectorPresets = [
    { key: 'kubernetes.io/os', value: 'linux' },
    { key: 'kubernetes.io/os', value: 'windows' },
    { key: 'kubernetes.io/arch', value: 'amd64' },
    { key: 'kubernetes.io/arch', value: 'arm64' }
  ];
  const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = nodeSelectorPresets.find(p => p.key + ':' + p.value === e.target.value);
    if (selected) {
      // Only add if not already present
      if (!nodeSelectorPairs.some(pair => pair.key === selected.key && pair.value === selected.value)) {
        const newPairs = [...nodeSelectorPairs, { key: selected.key, value: selected.value }];
        setNodeSelectorPairs(newPairs);
        syncNodeSelectorToConfig(newPairs);
      }
    }
    // Reset select
    e.target.selectedIndex = 0;
  };

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Server className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">DaemonSet Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              DaemonSet Name *
            </label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) => updateConfig({ appName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="my-daemonset"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Namespace
            </label>
            <select
              value={config.namespace}
              onChange={(e) => updateConfig({ namespace: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {availableNamespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Node Selector (inline in config section) */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Node Selector (optional)
          </label>
          {/* Presets Dropdown */}
          <select
            className="mb-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:bg-gray-700 dark:text-white"
            onChange={handlePresetSelect}
            defaultValue=""
          >
            <option value="" disabled>Add preset...</option>
            {nodeSelectorPresets.map(preset => (
              <option key={preset.key + ':' + preset.value} value={preset.key + ':' + preset.value}>
                {preset.key}: {preset.value}
              </option>
            ))}
          </select>
          {nodeSelectorPairs.length > 0 ? (
            nodeSelectorPairs.map((pair, idx) => (
              <div key={idx} className="flex items-center mb-2 space-x-2">
                <input
                  type="text"
                  value={pair.key}
                  onChange={e => {
                    const newPairs = [...nodeSelectorPairs];
                    newPairs[idx] = { ...pair, key: e.target.value };
                    setNodeSelectorPairs(newPairs);
                    syncNodeSelectorToConfig(newPairs);
                  }}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="key"
                />
                <span>=</span>
                <input
                  type="text"
                  value={pair.value}
                  onChange={e => {
                    const newPairs = [...nodeSelectorPairs];
                    newPairs[idx] = { ...pair, value: e.target.value };
                    setNodeSelectorPairs(newPairs);
                    syncNodeSelectorToConfig(newPairs);
                  }}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="value"
                />
                <button
                  type="button"
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                  onClick={() => {
                    const newPairs = nodeSelectorPairs.filter((_, i) => i !== idx);
                    setNodeSelectorPairs(newPairs);
                    syncNodeSelectorToConfig(newPairs);
                  }}
                  title="Remove selector"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">No node selectors set.</div>
          )}
          <button
            type="button"
            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
            onClick={() => {
              const newPairs = [...nodeSelectorPairs, { key: '', value: '' }];
              setNodeSelectorPairs(newPairs);
              syncNodeSelectorToConfig(newPairs);
            }}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Node Selector
          </button>
        </div>
      </div>

      {/* Containers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Database className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Containers</h3>
          </div>
          <button
            onClick={addContainer}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Container
          </button>
        </div>

        {config.containers.map((container, containerIndex) => (
          <div key={containerIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Container {containerIndex + 1}
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => duplicateContainer(containerIndex)}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors duration-200"
                  title="Duplicate container"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {config.containers.length > 1 && (
                  <button
                    onClick={() => removeContainer(containerIndex)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors duration-200"
                    title="Remove container"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Container Name
                </label>
                <input
                  type="text"
                  value={container.name}
                  onChange={(e) => updateContainer(containerIndex, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="app"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Container Image *
                </label>
                <input
                  type="text"
                  value={container.image}
                  onChange={(e) => updateContainer(containerIndex, { image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="nginx:latest"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={container.port || ''}
                  onChange={(e) => updateContainer(containerIndex, { port: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="8080"
                />
              </div>
            </div>

            {/* Environment Variables */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Environment Variables</h5>
                <button
                  onClick={() => addContainerEnvVar(containerIndex)}
                  className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </button>
              </div>
              
              {container.env.length > 0 && (
                <div className="space-y-3">
                  {container.env.map((envVar, envIndex) => (
                    <div key={envIndex} className="border border-gray-200 rounded-lg p-3 bg-white  dark:border-gray-700 dark:bg-gray-900 ">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">
                            Variable Name *
                          </label>
                          <input
                            type="text"
                            value={envVar.name}
                            onChange={(e) => updateContainerEnvVar(containerIndex, envIndex, { name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="DATABASE_URL"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">
                            Value Source
                          </label>
                          <select
                            value={envVar.valueFrom ? envVar.valueFrom.type : 'direct'}
                            onChange={(e) => {
                              if (e.target.value === 'direct') {
                                updateContainerEnvVar(containerIndex, envIndex, { 
                                  value: envVar.value || '',
                                  valueFrom: undefined 
                                });
                              } else {
                                updateContainerEnvVar(containerIndex, envIndex, { 
                                  value: undefined,
                                  valueFrom: { 
                                    type: e.target.value as 'configMap' | 'secret', 
                                    name: '', 
                                    key: '' 
                                  } 
                                });
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="direct">Direct Value</option>
                            <option value="configMap">ConfigMap</option>
                            <option value="secret">Secret</option>
                          </select>
                        </div>
                        
                        {envVar.valueFrom ? (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">
                                {envVar.valueFrom.type === 'configMap' ? 'ConfigMap' : 'Secret'} Name
                              </label>
                              <select
                                value={envVar.valueFrom.name}
                                onChange={(e) => updateContainerEnvVar(containerIndex, envIndex, { 
                                  valueFrom: { ...envVar.valueFrom!, name: e.target.value } 
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              >
                                <option value="">Select {envVar.valueFrom.type}</option>
                                {envVar.valueFrom.type === 'configMap' 
                                  ? filteredConfigMaps.map(cm => (
                                      <option key={cm.name} value={cm.name}>{cm.name}</option>
                                    ))
                                  : filteredSecrets.map(s => (
                                      <option key={s.name} value={s.name}>{s.name}</option>
                                    ))
                                }
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">
                                Key
                              </label>
                              <select
                                value={envVar.valueFrom.key}
                                onChange={(e) => updateContainerEnvVar(containerIndex, envIndex, { 
                                  valueFrom: { ...envVar.valueFrom!, key: e.target.value } 
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                disabled={!envVar.valueFrom.name}
                              >
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
                            <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">
                              Value
                            </label>
                            <input
                              type="text"
                              value={envVar.value || ''}
                              onChange={(e) => updateContainerEnvVar(containerIndex, envIndex, { value: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              placeholder="environment value"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={() => removeContainerEnvVar(containerIndex, envIndex)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Volume Mounts */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Volume Mounts
                </label>
                <button
                  onClick={() => addContainerVolumeMount(containerIndex)}
                  className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </button>
              </div>
              
              {container.volumeMounts.map((mount, mountIndex) => (
                <div key={mountIndex} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={mount.name}
                    onChange={(e) => updateContainerVolumeMount(containerIndex, mountIndex, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="Volume name"
                  />
                  <input
                    type="text"
                    value={mount.mountPath}
                    onChange={(e) => updateContainerVolumeMount(containerIndex, mountIndex, 'mountPath', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="/path/to/mount"
                  />
                  <button
                    onClick={() => removeContainerVolumeMount(containerIndex, mountIndex)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors duration-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Resources */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resource Requirements
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    CPU Request
                  </label>
                  <input
                    type="text"
                    value={container.resources.requests.cpu}
                    onChange={(e) => updateContainer(containerIndex, {
                      resources: {
                        ...container.resources,
                        requests: { ...container.resources.requests, cpu: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="100m"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Memory Request
                  </label>
                  <input
                    type="text"
                    value={container.resources.requests.memory}
                    onChange={(e) => updateContainer(containerIndex, {
                      resources: {
                        ...container.resources,
                        requests: { ...container.resources.requests, memory: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="128Mi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    CPU Limit
                  </label>
                  <input
                    type="text"
                    value={container.resources.limits.cpu}
                    onChange={(e) => updateContainer(containerIndex, {
                      resources: {
                        ...container.resources,
                        limits: { ...container.resources.limits, cpu: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="500m"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Memory Limit
                  </label>
                  <input
                    type="text"
                    value={container.resources.limits.memory}
                    onChange={(e) => updateContainer(containerIndex, {
                      resources: {
                        ...container.resources,
                        limits: { ...container.resources.limits, memory: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="256Mi"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Globe className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Configuration</h3>
        </div>
        
        {/* Service Toggle */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.serviceEnabled}
              onChange={(e) => updateConfig({ serviceEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Expose DaemonSet as a Service
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enable this to create a Service that exposes the DaemonSet pods
          </p>
        </div>
        
        {config.serviceEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service Port
              </label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => updateConfig({ port: parseInt(e.target.value) || 80 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Port
              </label>
              <input
                type="number"
                value={config.targetPort}
                onChange={(e) => updateConfig({ targetPort: parseInt(e.target.value) || 8080 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service Type
              </label>
              <select
                value={config.serviceType}
                onChange={(e) => updateConfig({ serviceType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="ClusterIP">ClusterIP</option>
                <option value="NodePort">NodePort</option>
                <option value="LoadBalancer">LoadBalancer</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Volumes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Volumes</h3>
          </div>
          <button
            onClick={addVolume}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Volume
          </button>
        </div>

        {config.volumes.map((volume, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Volume {index + 1}
              </h4>
              <button
                onClick={() => removeVolume(index)}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Volume Name
                </label>
                <input
                  type="text"
                  value={volume.name}
                  onChange={(e) => updateVolume(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="my-volume"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Volume Type
                </label>
                <select
                  value={volume.type}
                  onChange={(e) => updateVolume(index, 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="emptyDir">Empty Directory</option>
                  <option value="configMap">ConfigMap</option>
                  <option value="secret">Secret</option>
                </select>
              </div>
            </div>

            {volume.type === 'configMap' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ConfigMap Name
                </label>
                <select
                  value={volume.configMapName || ''}
                  onChange={(e) => updateVolume(index, 'configMapName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select ConfigMap</option>
                  {filteredConfigMaps.map(cm => (
                    <option key={cm.name} value={cm.name}>{cm.name}</option>
                  ))}
                </select>
              </div>
            )}

            {volume.type === 'secret' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secret Name
                </label>
                <select
                  value={volume.secretName || ''}
                  onChange={(e) => updateVolume(index, 'secretName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Secret</option>
                  {filteredSecrets.map(secret => (
                    <option key={secret.name} value={secret.name}>{secret.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mount Path
              </label>
              <input
                type="text"
                value={volume.mountPath}
                onChange={(e) => updateVolume(index, 'mountPath', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={getDefaultMountPath(volume.name, volume.type)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ConfigMaps and Secrets Selection */}
      {(filteredConfigMaps.length > 0 || filteredSecrets.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available ConfigMaps & Secrets</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredConfigMaps.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ConfigMaps
                </label>
                <div className="space-y-2">
                  {filteredConfigMaps.map(configMap => (
                    <label key={configMap.name} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.selectedConfigMaps.includes(configMap.name)}
                        onChange={() => toggleConfigMapSelection(configMap.name)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{configMap.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {filteredSecrets.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secrets
                </label>
                <div className="space-y-2">
                  {filteredSecrets.map(secret => (
                    <label key={secret.name} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.selectedSecrets.includes(secret.name)}
                        onChange={() => toggleSecretSelection(secret.name)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{secret.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 