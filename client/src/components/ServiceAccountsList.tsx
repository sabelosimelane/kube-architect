import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, Calendar, Users, Key, Tag, Shield } from 'lucide-react';
import { K8sServiceAccountIcon } from './KubernetesIcons';
import type { ServiceAccount } from '../types';

interface ServiceAccountsListProps {
  serviceAccounts: ServiceAccount[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (serviceAccountName: string) => void;
  onDuplicate: (index: number) => void;
}

export function ServiceAccountsList({ 
  serviceAccounts, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: ServiceAccountsListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (serviceAccountName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(serviceAccountName);
  };

  const handleConfirmDelete = (serviceAccountName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(serviceAccountName);
    setDeleteConfirm(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(null);
  };

  const handleDuplicateClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(index);
  };

  const handleEditClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(index);
  };

  if (serviceAccounts.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          <K8sServiceAccountIcon className="w-8 h-8 text-gray-400 dark:text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">No Service Accounts</h3>
        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
          Create Service Accounts to manage authentication and authorization for your applications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {serviceAccounts.map((serviceAccount, index) => (
        <button
          key={`${serviceAccount.namespace}-${serviceAccount.name}`}
          className={`p-3 rounded-lg border cursor-pointer transition-all w-full text-left duration-200 ${
            selectedIndex === index
              ? 'bg-cyan-50 border-cyan-200 ring-1 ring-cyan-200 dark:bg-cyan-700 dark:border-cyan-600 dark:ring-cyan-600'
              : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedIndex === index ? 'bg-cyan-600' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <K8sServiceAccountIcon className={`w-4 h-4 ${
                    selectedIndex === index ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                  }`} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 truncate dark:text-gray-100">
                    {serviceAccount.name}
                  </div>
                  <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-xs font-medium dark:bg-cyan-600 dark:text-cyan-100 ">
                    {serviceAccount.namespace}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center space-x-2 mt-1 dark:text-gray-200">
                  <Calendar className="w-3 h-3 dark:text-gray-100" />
                  <span>{new Date(serviceAccount.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                    serviceAccount.automountServiceAccountToken !== false 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                  }`}>
                    {serviceAccount.automountServiceAccountToken !== false ? 'Auto-mount' : 'No auto-mount'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {deleteConfirm === serviceAccount.name ? (
                // Delete confirmation buttons
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(serviceAccount.name, e)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1 dark:bg-red-700 dark:hover:bg-red-800"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                // Normal action buttons
                <>
                  <button
                    onClick={(e) => handleEditClick(index, e)}
                    className="p-1 text-gray-400 hover:text-cyan-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-cyan-400"
                    title="Edit Service Account"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(index, e)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                    title="Duplicate Service Account"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(serviceAccount.name, e)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-red-400"
                    title="Delete Service Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-2 space-y-1">
            {/* Secrets and Image Pull Secrets */}
            {(serviceAccount.secrets && serviceAccount.secrets.length > 0) || 
             (serviceAccount.imagePullSecrets && serviceAccount.imagePullSecrets.length > 0) ? (
              <div className="flex items-center space-x-3">
                {serviceAccount.secrets && serviceAccount.secrets.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Key className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-300">Secrets:</span>
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      {serviceAccount.secrets.length}
                    </span>
                  </div>
                )}
                {serviceAccount.imagePullSecrets && serviceAccount.imagePullSecrets.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-300">Image Pull:</span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {serviceAccount.imagePullSecrets.length}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-gray-400 dark:text-gray-300" />
                <span className="text-xs text-gray-500 dark:text-gray-300">No secrets attached</span>
              </div>
            )}

            {/* Labels */}
            {Object.keys(serviceAccount.labels).length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                <span className="text-xs text-gray-500 dark:text-gray-300">Labels:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(serviceAccount.labels).slice(0, 2).map(([key, value]) => (
                    <span key={key} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs dark:bg-blue-800 dark:text-blue-100">
                      {key}: {value}
                    </span>
                  ))}
                  {Object.keys(serviceAccount.labels).length > 2 && (
                    <span className="text-xs text-gray-500 dark:text-gray-300">
                      +{Object.keys(serviceAccount.labels).length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Annotations */}
            {Object.keys(serviceAccount.annotations).length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                <span className="text-xs text-gray-500 dark:text-gray-300">Annotations:</span>
                <span className="text-xs text-purple-600 font-medium dark:text-purple-400">
                  {Object.keys(serviceAccount.annotations).length} annotation{Object.keys(serviceAccount.annotations).length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Delete confirmation warning */}
          {deleteConfirm === serviceAccount.name && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 dark:bg-red-700 dark:border-red-600 dark:text-red-100">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>
                This will delete the Service Account and may affect applications that use it for authentication.
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
} 