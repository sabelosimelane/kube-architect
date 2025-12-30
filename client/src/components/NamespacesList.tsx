import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, Database, Tag, Calendar } from 'lucide-react';
import type { Namespace } from '../types';

interface NamespacesListProps {
  namespaces: Namespace[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (namespaceName: string) => void;
  onDuplicate: (index: number) => void;
}

export function NamespacesList({ 
  namespaces, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: NamespacesListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (namespaceName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(namespaceName);
  };

  const handleConfirmDelete = (namespaceName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(namespaceName);
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

  const isSystemNamespace = (name: string) => {
    return ['default', 'kube-system', 'kube-public', 'kube-node-lease'].includes(name);
  };

  const getNamespaceIcon = (namespace: Namespace) => {
    if (isSystemNamespace(namespace.name)) {
      return <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
    return <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
  };

  return (
    <div className="space-y-1 p-4">
      {namespaces.map((namespace, index) => (
        <button
          key={namespace.name}
          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            selectedIndex === index
              ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-200 dark:bg-purple-700 dark:border-purple-800 dark:ring-purple-800'
              : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {getNamespaceIcon(namespace)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 truncate dark:text-gray-100">
                    {namespace.name}
                  </div>
                  {isSystemNamespace(namespace.name) && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium dark:bg-blue-900 dark:text-blue-200">
                      System
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 flex items-center space-x-2 dark:text-gray-300">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(namespace.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {deleteConfirm === namespace.name ? (
                // Delete confirmation buttons
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(namespace.name, e)}
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
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-gray-400"
                    title="Edit namespace"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {!isSystemNamespace(namespace.name) && (
                    <>
                      <button
                        onClick={(e) => handleDuplicateClick(index, e)}
                        className="p-1 text-gray-400 hover:text-purple-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-purple-400"
                        title="Duplicate namespace"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(namespace.name, e)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-red-500"
                        title="Delete namespace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Labels and Annotations */}
          {(Object.keys(namespace.labels).length > 0 || Object.keys(namespace.annotations).length > 0) && (
            <div className="mt-2 space-y-1">
              {Object.keys(namespace.labels).length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Labels:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(namespace.labels).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs dark:bg-blue-800 dark:text-blue-200">
                        {key}: {value}
                      </span>
                    ))}
                    {Object.keys(namespace.labels).length > 2 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{Object.keys(namespace.labels).length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {Object.keys(namespace.annotations).length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Annotations:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(namespace.annotations).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="px-1 py-0.5 bg-purple-100 text-purple-800 rounded text-xs dark:bg-purple-800 dark:text-purple-200">
                        {key}: {value}
                      </span>
                    ))}
                    {Object.keys(namespace.annotations).length > 2 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{Object.keys(namespace.annotations).length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Delete confirmation warning */}
          {deleteConfirm === namespace.name && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 dark:bg-red-700 dark:border-red-800 dark:text-red-200">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>
                This will delete the namespace and move any deployments using it to the 'default' namespace.
              </div>
            </div>
          )}
        </button>
      ))}

      {namespaces.length === 0 && (
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">No Namespaces</h3>
          <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
            Create your first namespace to organize your deployments
          </p>
        </div>
      )}
    </div>
  );
}