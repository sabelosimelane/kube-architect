import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, Shield, Tag, Users } from 'lucide-react';
import type { KubernetesClusterRole } from '../types';

interface ClusterRolesListProps {
  clusterRoles: KubernetesClusterRole[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (clusterRoleName: string) => void;
  onDuplicate: (index: number) => void;
}

export function ClusterRolesList({ 
  clusterRoles, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: ClusterRolesListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (clusterRoleName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(clusterRoleName);
  };

  const handleConfirmDelete = (clusterRoleName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(clusterRoleName);
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

  if (clusterRoles.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-700">
          <Shield className="w-8 h-8 text-gray-400 dark:text-gray-100" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">No ClusterRoles</h3>
        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
          Create cluster-wide RBAC ClusterRoles to manage permissions across your entire cluster
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {clusterRoles.map((clusterRole, index) => (
        <div
          key={index}
          onClick={() => onSelect(index)}
          className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedIndex === index
              ? 'border-orange-300 bg-orange-50 shadow-sm dark:border-orange-400 dark:bg-orange-700 dark:shadow-orange-400'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                    {clusterRole.metadata.name}
                  </h4>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium dark:bg-orange-600 dark:text-orange-100">
                    cluster-wide
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{clusterRole.rules.length} rule{clusterRole.rules.length !== 1 ? 's' : ''}</span>
                  </div>
                  {clusterRole.metadata.labels && Object.keys(clusterRole.metadata.labels).length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3" />
                      <span>{Object.keys(clusterRole.metadata.labels).length} label{Object.keys(clusterRole.metadata.labels).length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                {/* API Groups Preview */}
                {clusterRole.rules.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1 dark:text-gray-300">API Groups:</div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(clusterRole.rules.flatMap(rule => rule.apiGroups)))
                        .slice(0, 3)
                        .map((apiGroup, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs dark:bg-gray-600 dark:text-gray-100"
                          >
                            {apiGroup === '' ? 'core' : apiGroup}
                          </span>
                        ))}
                      {Array.from(new Set(clusterRole.rules.flatMap(rule => rule.apiGroups))).length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{Array.from(new Set(clusterRole.rules.flatMap(rule => rule.apiGroups))).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={(e) => handleEditClick(index, e)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit ClusterRole"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleDuplicateClick(index, e)}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Duplicate ClusterRole"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {deleteConfirm === clusterRole.metadata.name ? (
                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleConfirmDelete(clusterRole.metadata.name, e)}
                    className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded transition-colors dark:bg-red-700 dark:hover:bg-red-800"
                    title="Confirm delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors dark:bg-gray-600 dark:hover:bg-gray-500"
                    title="Cancel delete"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => handleDeleteClick(clusterRole.metadata.name, e)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors dark:bg-gray-600 dark:hover:bg-gray-500"
                  title="Delete ClusterRole"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 