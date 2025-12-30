import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, Database, Globe } from 'lucide-react';
import type { DaemonSetConfig } from '../types';

interface DaemonSetsListProps {
  daemonSets: DaemonSetConfig[];
  selectedDaemonSet: number;
  onSelectDaemonSet: (index: number) => void;
  onEditDaemonSet: (index: number) => void;
  onDuplicateDaemonSet: (index: number) => void;
  onDeleteDaemonSet: (index: number) => void;
}

export function DaemonSetsList({
  daemonSets,
  selectedDaemonSet,
  onSelectDaemonSet,
  onEditDaemonSet,
  onDuplicateDaemonSet,
  onDeleteDaemonSet
}: DaemonSetsListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleDeleteClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(index);
  };

  const handleConfirmDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteDaemonSet(index);
    setDeleteConfirm(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(null);
  };

  const handleDuplicateClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicateDaemonSet(index);
  };

  const getDaemonSetSummary = (daemonSet: DaemonSetConfig) => {
    const containerCount = daemonSet.containers?.length || 0;
    const primaryImage = daemonSet.containers?.[0]?.image || daemonSet.image || 'No image specified';
    const hasMultipleContainers = containerCount > 1;
    const hasService = daemonSet.serviceEnabled;
    return {
      containerCount,
      primaryImage,
      hasMultipleContainers,
      hasService
    };
  };

  if (daemonSets.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-800">
          <Database className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">No DaemonSets</h3>
        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
          Get started by creating your first Kubernetes DaemonSet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {daemonSets.map((daemonSet, index) => {
        const summary = getDaemonSetSummary(daemonSet);
        return (
          <button
            key={index}
            className={`p-3 rounded-lg w-full text-left border cursor-pointer transition-all duration-200 ${
              selectedDaemonSet === index
                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200 dark:bg-blue-900 dark:border-blue-800 dark:ring-blue-800'
                : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
            }`}
            onClick={() => onSelectDaemonSet(index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  daemonSet.appName ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300'
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate dark:text-gray-100">
                    {daemonSet.appName || `DaemonSet ${index + 1}`}
                  </div>
                  <div className="text-sm text-gray-500 truncate dark:text-gray-400">
                    {summary.primaryImage}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {summary.hasMultipleContainers && (
                      <div className="flex items-center space-x-1">
                        <Database className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                        <span className="text-xs text-purple-600 dark:text-purple-400">
                          {summary.containerCount} containers
                        </span>
                      </div>
                    )}
                    {summary.hasService && (
                      <div className="flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-green-500 dark:text-green-400" />
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Service: {daemonSet.serviceType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {deleteConfirm === index ? (
                  // Delete confirmation buttons
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleCancelDelete}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => handleConfirmDelete(index, e)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1 dark:bg-red-700 dark:hover:bg-red-800 "
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                ) : (
                  // Normal action buttons
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDaemonSet(index);
                        onEditDaemonSet(index);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-gray-400"
                      title="Edit DaemonSet"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicateClick(index, e)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                      title="Duplicate DaemonSet"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(index, e)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-red-600 "
                      title="Delete DaemonSet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* Delete confirmation warning */}
            {deleteConfirm === index && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 dark:bg-red-700 dark:border-red-800 dark:text-red-200">
                <div className="flex items-center space-x-1 mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="font-medium">Are you sure?</span>
                </div>
                <div>
                  {daemonSets.length === 1
                    ? 'This will reset the DaemonSet to default values.'
                    : 'This action cannot be undone.'
                  }
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}