import React, { useState } from 'react';
import { Trash2, AlertTriangle, Clock, Settings } from 'lucide-react';
import type { CronJobConfig } from '../../types';

interface CronJobListProps {
  cronjobs: CronJobConfig[];
  namespaceFilter?: string | null;
  onDelete: (index: number) => void;
  onEdit?: (index: number) => void;
  onViewYaml?: (index: number) => void;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const CronJobList: React.FC<CronJobListProps> = ({ cronjobs, namespaceFilter, onDelete, onEdit, onViewYaml, selectedIndex, onSelect }) => {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const filteredCronJobs = namespaceFilter
    ? cronjobs.filter(cronjob => cronjob.namespace === namespaceFilter)
    : cronjobs;

  const getOriginalIndex = (cronjob: CronJobConfig) => {
    return cronjobs.indexOf(cronjob);
  };

  const handleDeleteClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(index);
  };

  const handleConfirmDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(index);
    setDeleteConfirm(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(null);
  };

  const handleEditClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(index);
    }
  };

  if (filteredCronJobs.length === 0 && namespaceFilter) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>No CronJobs found in namespace "{namespaceFilter}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {cronjobs.length === 0 && (
        <div className="text-center text-gray-400 py-8 dark:text-gray-300">No CronJobs found.</div>
      )}
      {filteredCronJobs.map((cronjob) => {
        const index = getOriginalIndex(cronjob);
        return (
          <button
            key={`${cronjob.name}-${cronjob.namespace}-${index}`}
            className={`p-3 rounded-lg border cursor-pointer transition-all w-full text-left duration-200 ${selectedIndex === index
                ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-200 dark:bg-yellow-700 dark:border-yellow-800 dark:ring-yellow-800'
                : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
              }`}
            onClick={() => onSelect(index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate dark:text-gray-100">
                    {cronjob.name || 'Untitled CronJob'}
                  </div>
                  <div className="text-sm text-gray-500 truncate dark:text-gray-300">
                    {cronjob.jobTemplate.containers?.[0]?.image || 'No image specified'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 dark:text-gray-200">
                    {cronjob.namespace} • {cronjob.schedule}
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {deleteConfirm === index ? (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleCancelDelete}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-500 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => handleConfirmDelete(index, e)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1 dark:bg-red-700 dark:hover:bg-red-800"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {onEdit && (
                      <button
                        onClick={(e) => handleEditClick(index, e)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-gray-400"
                        title="Edit cronjob"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                    {onViewYaml && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewYaml(index);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                        title="View YAML"
                      >
                        <span className="text-xs">YAML</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteClick(index, e)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-red-400"
                      title="Delete cronjob"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* Delete confirmation warning */}
            {deleteConfirm === index && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 dark:bg-red-700 dark:text-gray-300 dark:border-red-800">
                <div className="flex items-center space-x-1 mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="font-medium">Are you sure?</span>
                </div>
                <div>This action cannot be undone.</div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};