export interface ApiGroupConfig {
  name: string;
  displayName: string;
  resources: ResourceConfig[];
  clusterScoped?: boolean; // New field to indicate if this group contains cluster-scoped resources
}

export interface ResourceConfig {
  name: string;
  displayName: string;
  commonVerbs: string[];
  clusterScoped?: boolean; // New field to indicate if this resource is cluster-scoped
}

export const API_GROUPS: ApiGroupConfig[] = [
  {
    name: '',
    displayName: 'Core (v1)',
    resources: [
      { name: 'pods', displayName: 'Pods', commonVerbs: ['get', 'list', 'create', 'update', 'delete', 'watch'] },
      { name: 'services', displayName: 'Services', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'configmaps', displayName: 'ConfigMaps', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'secrets', displayName: 'Secrets', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'namespaces', displayName: 'Namespaces', commonVerbs: ['get', 'list', 'create', 'delete'], clusterScoped: true },
      { name: 'serviceaccounts', displayName: 'Service Accounts', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'persistentvolumes', displayName: 'Persistent Volumes', commonVerbs: ['get', 'list', 'create', 'delete'], clusterScoped: true },
      { name: 'persistentvolumeclaims', displayName: 'PVCs', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'endpoints', displayName: 'Endpoints', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'events', displayName: 'Events', commonVerbs: ['get', 'list', 'create'] },
      { name: 'nodes', displayName: 'Nodes', commonVerbs: ['get', 'list'], clusterScoped: true },
    ]
  },
  {
    name: 'apps',
    displayName: 'Apps (apps/v1)',
    resources: [
      { name: 'deployments', displayName: 'Deployments', commonVerbs: ['get', 'list', 'create', 'update', 'delete', 'patch', 'scale'] },
      { name: 'replicasets', displayName: 'ReplicaSets', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'daemonsets', displayName: 'DaemonSets', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'statefulsets', displayName: 'StatefulSets', commonVerbs: ['get', 'list', 'create', 'update', 'delete', 'scale'] },
      { name: 'deployments/scale', displayName: 'Deployment Scale', commonVerbs: ['get', 'update', 'patch'] },
      { name: 'replicasets/scale', displayName: 'ReplicaSet Scale', commonVerbs: ['get', 'update', 'patch'] },
      { name: 'statefulsets/scale', displayName: 'StatefulSet Scale', commonVerbs: ['get', 'update', 'patch'] },
    ]
  },
  {
    name: 'networking.k8s.io',
    displayName: 'Networking',
    resources: [
      { name: 'ingresses', displayName: 'Ingresses', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'networkpolicies', displayName: 'Network Policies', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'ingressclasses', displayName: 'Ingress Classes', commonVerbs: ['get', 'list'], clusterScoped: true },
    ]
  },
  {
    name: 'rbac.authorization.k8s.io',
    displayName: 'RBAC',
    resources: [
      { name: 'roles', displayName: 'Roles', commonVerbs: ['get', 'list', 'create', 'update', 'delete', 'bind'] },
      { name: 'rolebindings', displayName: 'Role Bindings', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'clusterroles', displayName: 'Cluster Roles', commonVerbs: ['get', 'list', 'create', 'update', 'delete', 'bind'], clusterScoped: true },
      { name: 'clusterrolebindings', displayName: 'Cluster Role Bindings', commonVerbs: ['get', 'list', 'create', 'update', 'delete'], clusterScoped: true },
    ]
  },
  {
    name: 'batch',
    displayName: 'Batch',
    resources: [
      { name: 'jobs', displayName: 'Jobs', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
      { name: 'cronjobs', displayName: 'CronJobs', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
    ]
  },
  {
    name: 'storage.k8s.io',
    displayName: 'Storage',
    resources: [
      { name: 'storageclasses', displayName: 'Storage Classes', commonVerbs: ['get', 'list', 'create', 'update', 'delete'], clusterScoped: true },
      { name: 'volumeattachments', displayName: 'Volume Attachments', commonVerbs: ['get', 'list', 'create', 'update', 'delete'], clusterScoped: true },
    ]
  },
  {
    name: 'autoscaling',
    displayName: 'Autoscaling',
    resources: [
      { name: 'horizontalpodautoscalers', displayName: 'HPA', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
    ]
  },
  {
    name: 'policy',
    displayName: 'Policy',
    resources: [
      { name: 'poddisruptionbudgets', displayName: 'Pod Disruption Budgets', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
    ]
  },
  {
    name: 'extensions',
    displayName: 'Extensions',
    resources: [
      { name: 'ingresses', displayName: 'Ingresses (legacy)', commonVerbs: ['get', 'list', 'create', 'update', 'delete'] },
    ]
  },
  {
    name: 'metrics.k8s.io',
    displayName: 'Metrics',
    resources: [
      { name: 'nodes', displayName: 'Node Metrics', commonVerbs: ['get', 'list'], clusterScoped: true },
      { name: 'pods', displayName: 'Pod Metrics', commonVerbs: ['get', 'list'] },
    ]
  },
  {
    name: 'apiextensions.k8s.io',
    displayName: 'API Extensions',
    clusterScoped: true,
    resources: [
      { name: 'customresourcedefinitions', displayName: 'Custom Resource Definitions', commonVerbs: ['get', 'list', 'create', 'update', 'delete'], clusterScoped: true },
    ]
  },
  {
    name: 'certificates.k8s.io',
    displayName: 'Certificates',
    clusterScoped: true,
    resources: [
      { name: 'certificatesigningrequests', displayName: 'Certificate Signing Requests', commonVerbs: ['get', 'list', 'create', 'update', 'delete'], clusterScoped: true },
    ]
  }
];

export const ALL_VERBS = [
  'get', 'list', 'create', 'update', 'patch', 'delete', 'watch', 
  'bind', 'escalate', 'impersonate', 'scale', '*'
];

export const VERB_DESCRIPTIONS: Record<string, string> = {
  'get': 'Read individual resources',
  'list': 'List resources of this type',
  'create': 'Create new resources',
  'update': 'Update existing resources',
  'patch': 'Partially update resources',
  'delete': 'Delete resources',
  'watch': 'Watch for changes',
  'bind': 'Bind roles (RBAC)',
  'escalate': 'Escalate privileges (RBAC)',
  'scale': 'Scale deployments/statefulsets',
  '*': 'All permissions'
};

export const COMMON_ROLE_TEMPLATES = [
  {
    name: 'Pod Reader',
    description: 'Read-only access to pods',
    rules: [
      { apiGroups: [''], resources: ['pods'], verbs: ['get', 'list', 'watch'] }
    ]
  },
  {
    name: 'ConfigMap Manager',
    description: 'Full access to ConfigMaps',
    rules: [
      { apiGroups: [''], resources: ['configmaps'], verbs: ['get', 'list', 'create', 'update', 'delete'] }
    ]
  },
  {
    name: 'Deployment Manager',
    description: 'Full access to deployments',
    rules: [
      { apiGroups: ['apps'], resources: ['deployments'], verbs: ['get', 'list', 'create', 'update', 'delete', 'patch'] },
      { apiGroups: ['apps'], resources: ['replicasets'], verbs: ['get', 'list'] },
      { apiGroups: [''], resources: ['pods'], verbs: ['get', 'list'] }
    ]
  },
  {
    name: 'Service Manager',
    description: 'Full access to services',
    rules: [
      { apiGroups: [''], resources: ['services'], verbs: ['get', 'list', 'create', 'update', 'delete'] },
      { apiGroups: [''], resources: ['endpoints'], verbs: ['get', 'list'] }
    ]
  },
  {
    name: 'Namespace Admin',
    description: 'Admin access to most resources in namespace',
    rules: [
      { apiGroups: [''], resources: ['*'], verbs: ['*'] },
      { apiGroups: ['apps'], resources: ['*'], verbs: ['*'] },
      { apiGroups: ['networking.k8s.io'], resources: ['*'], verbs: ['*'] },
      { apiGroups: ['batch'], resources: ['*'], verbs: ['*'] }
    ]
  }
];

export const COMMON_CLUSTER_ROLE_TEMPLATES = [
  {
    name: 'Cluster Reader',
    description: 'Read-only access to cluster resources',
    rules: [
      { apiGroups: [''], resources: ['nodes', 'namespaces', 'persistentvolumes'], verbs: ['get', 'list', 'watch'] },
      { apiGroups: ['storage.k8s.io'], resources: ['storageclasses'], verbs: ['get', 'list', 'watch'] }
    ]
  },
  {
    name: 'Node Manager',
    description: 'Full access to nodes',
    rules: [
      { apiGroups: [''], resources: ['nodes'], verbs: ['get', 'list', 'create', 'update', 'delete', 'patch'] },
      { apiGroups: [''], resources: ['nodes/status'], verbs: ['get', 'list', 'update', 'patch'] }
    ]
  },
  {
    name: 'Storage Admin',
    description: 'Full access to cluster storage resources',
    rules: [
      { apiGroups: [''], resources: ['persistentvolumes'], verbs: ['get', 'list', 'create', 'update', 'delete'] },
      { apiGroups: ['storage.k8s.io'], resources: ['storageclasses', 'volumeattachments'], verbs: ['get', 'list', 'create', 'update', 'delete'] }
    ]
  },
  {
    name: 'RBAC Manager',
    description: 'Full access to cluster RBAC resources',
    rules: [
      { apiGroups: ['rbac.authorization.k8s.io'], resources: ['clusterroles', 'clusterrolebindings'], verbs: ['get', 'list', 'create', 'update', 'delete', 'bind'] },
      { apiGroups: ['rbac.authorization.k8s.io'], resources: ['roles', 'rolebindings'], verbs: ['get', 'list', 'create', 'update', 'delete', 'bind'] }
    ]
  },
  {
    name: 'Namespace Manager',
    description: 'Full access to namespace management',
    rules: [
      { apiGroups: [''], resources: ['namespaces'], verbs: ['get', 'list', 'create', 'update', 'delete'] },
      { apiGroups: [''], resources: ['resourcequotas', 'limitranges'], verbs: ['get', 'list', 'create', 'update', 'delete'] }
    ]
  },
  {
    name: 'Cluster Admin',
    description: 'Full access to all cluster resources',
    rules: [
      { apiGroups: ['*'], resources: ['*'], verbs: ['*'] }
    ]
  }
]; 