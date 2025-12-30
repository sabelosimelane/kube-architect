import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, Shield, Tag, Users } from 'lucide-react';
import type { KubernetesRole } from '../types';

interface RolesListProps {
  roles: KubernetesRole[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (roleName: string) => void;
  onDuplicate: (index: number) => void;
}

export function RolesList({ 
  roles, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: RolesListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (roleName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(roleName);
  };

  const handleConfirmDelete = (roleName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(roleName);
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

  if (roles.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-gray-400 dark:text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">No Roles</h3>
        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
          Create RBAC Roles to manage permissions for your applications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {roles.map((role, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`p-3 border rounded-lg cursor-pointer transition-all w-full text-left duration-200 hover:shadow-md ${
            selectedIndex === index
              ? 'border-purple-300 bg-purple-50 shadow-sm dark:border-purple-800 dark:bg-purple-700 dark:shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                    {role.metadata.name}
                  </h4>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium dark:bg-purple-600 dark:text-purple-100">
                    {role.metadata.namespace}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 dark:text-gray-100" />
                    <span>{role.rules.length} rule{role.rules.length !== 1 ? 's' : ''}</span>
                  </div>
                  {role.metadata.labels && Object.keys(role.metadata.labels).length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3 dark:text-gray-100" />
                      <span>{Object.keys(role.metadata.labels).length} label{Object.keys(role.metadata.labels).length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                {/* API Groups */}
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  <span className="font-medium">API Groups:</span> {
                    Array.from(new Set(role.rules.flatMap(rule => rule.apiGroups)))
                      .map(group => group === '' ? 'core' : group)
                      .join(', ')
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 flex-shrink-0">
              {deleteConfirm === role.metadata.name ? (
                // Delete confirmation buttons
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(role.metadata.name, e)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1"
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
                    className="p-1 text-gray-400 hover:text-purple-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-purple-400"
                    title="Edit Role"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(index, e)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                    title="Duplicate Role"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(role.metadata.name, e)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-red-400"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>



          {/* Delete confirmation warning */}
          {deleteConfirm === role.metadata.name && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 dark:bg-red-700 dark:border-red-600 dark:text-red-100">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>This action cannot be undone.</div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
} 