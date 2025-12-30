import {
    Box,
    Layers,
    Users,
    Shield,
    Clock,
    ArrowRight,
    Database
} from 'lucide-react';
import { Namespace } from '../types';

export interface ResourceCounts {
    deployments: number;
    daemonSets: number;
    configMaps: number;
    secrets: number;
    serviceAccounts: number;
    roles: number;
    jobs: number;
    cronJobs: number;
}

interface NamespacePanelProps {
    namespaces: Namespace[];
    resourceCounts: Record<string, ResourceCounts>;
    onSelectNamespace: (namespaceName: string) => void;
}

export function NamespacePanel({ namespaces, resourceCounts, onSelectNamespace }: NamespacePanelProps) {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Namespaces</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Overview of your Kubernetes namespaces and their resources
                    </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium">
                    {namespaces.length} Active Namespaces
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {namespaces.map((ns) => {
                    const counts = resourceCounts[ns.name] || {
                        deployments: 0,
                        daemonSets: 0,
                        configMaps: 0,
                        secrets: 0,
                        serviceAccounts: 0,
                        roles: 0,
                        jobs: 0,
                        cronJobs: 0
                    };

                    const totalResources = Object.values(counts).reduce((a, b) => a + b, 0);

                    return (
                        <div
                            key={ns.name}
                            onClick={() => onSelectNamespace(ns.name)}
                            className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 cursor-pointer overflow-hidden relative"
                        >
                            {/* Top decoration */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                            <Box className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {ns.name}
                                            </h3>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(ns.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {/* Workloads Summary */}
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                                            <Layers className="w-3 h-3 mr-1" /> Workloads
                                        </div>
                                        <div className="font-medium text-gray-900 dark:text-gray-200">
                                            {counts.deployments + counts.daemonSets + counts.jobs + counts.cronJobs}
                                        </div>
                                    </div>

                                    {/* Config Summary */}
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                                            <Database className="w-3 h-3 mr-1" /> Config
                                        </div>
                                        <div className="font-medium text-gray-900 dark:text-gray-200">
                                            {counts.configMaps + counts.secrets}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center">
                                            <Users className="w-4 h-4 mr-2" /> Service Accounts
                                        </span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{counts.serviceAccounts}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center">
                                            <Shield className="w-4 h-4 mr-2" /> Roles
                                        </span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{counts.roles}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/30 px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-opacity-50">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Total Resources
                                </span>
                                <span className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-xs font-medium">
                                    {totalResources}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
