import React, { useState } from 'react';
import { X, Plus, Trash2, Clock, Play } from 'lucide-react';
import { JobForm, JobFormProps } from './JobForm';
import type { ConfigMap, Secret, Container } from '../types';

export interface Job {
  id: string;
  name: string;
  type: 'job' | 'cronjob';
  namespace: string;
  containers: Container[];
  image: string;
  command?: string;
  args?: string;
  schedule?: string;
  cpuRequest: string;
  memoryRequest: string;
  cpuLimit?: string;
  memoryLimit?: string;
  restartPolicy: 'Never' | 'OnFailure';
  labels: { key: string; value: string }[];
  concurrencyPolicy?: 'Allow' | 'Forbid' | 'Replace';
  startingDeadline?: string;
  historySuccess?: string;
  historyFailure?: string;
  completions?: number;
  replicas?: number;
  backoffLimit?: number;
  activeDeadlineSeconds?: number;
}

interface JobManagerProps {
  jobs: Job[];
  namespaces: string[];
  onAddJob: (job: Job) => void;
  onUpdateJob?: (jobId: string, updatedJob: Job) => void;
  onDeleteJob: (jobId: string) => void;
  onClose: () => void;
  initialJobType?: 'job' | 'cronjob';
  initialJob?: Job;
  availableConfigMaps: ConfigMap[];
  availableSecrets: Secret[];
}

export function JobManager({ jobs, namespaces, onAddJob, onUpdateJob, onDeleteJob, onClose, initialJobType, initialJob, availableConfigMaps, availableSecrets }: JobManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [jobType, setJobType] = useState<'job' | 'cronjob'>(initialJobType || 'job');

  // Update job type when initialJobType changes
  React.useEffect(() => {
    if (initialJobType) {
      setJobType(initialJobType);
      // Auto-open form when initial job type is provided
      setShowForm(true);
    }
  }, [initialJobType]);

  // Handle initial job for editing
  React.useEffect(() => {
    if (initialJob) {
      setJobType(initialJob.type);
      setCurrentJob(initialJob);
      setShowForm(true);
    }
  }, [initialJob]);

  const handleAddJob = () => {
    setJobType('job');
    setCurrentJob(null);
    setShowForm(true);
  };

  const handleAddCronJob = () => {
    setJobType('cronjob');
    setCurrentJob(null);
    setShowForm(true);
  };

  const handleEditJob = (job: Job) => {
    setJobType(job.type);
    setCurrentJob(job);
    setShowForm(true);
  };

  const handleSaveJob = (yaml: string, asTemplate: boolean, formState?: any) => {
    console.log('JobManager handleSaveJob called with:', { yaml, asTemplate, formState, jobType });
    // formState should include containers array
    const containers = formState?.containers || [];
    // Parse the YAML to extract job data
    // This is a simplified approach - in a real app you'd use a proper YAML parser
    const lines = yaml.split('\n');
    const jobData: Partial<Job> = {
      name: '',
      namespace: '',
      image: '',
      containers,
      command: '',
      args: '',
      schedule: '',
      cpuRequest: '',
      memoryRequest: '',
      cpuLimit: '',
      memoryLimit: '',
      restartPolicy: 'Never',
      labels: formState?.labels || [], // Use labels from formState
      concurrencyPolicy: 'Allow',
      startingDeadline: '',
      historySuccess: '',
      historyFailure: '',
    };

    // Simple YAML parsing for key fields
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('name:')) {
        jobData.name = line.split('name:')[1].trim();
      } else if (line.startsWith('namespace:')) {
        jobData.namespace = line.split('namespace:')[1].trim();
      } else if (line.startsWith('image:')) {
        jobData.image = line.split('image:')[1].trim();
      } else if (line.startsWith('schedule:')) {
        jobData.schedule = line.split('schedule:')[1].trim().replace(/"/g, '');
      } else if (line.startsWith('concurrencyPolicy:')) {
        jobData.concurrencyPolicy = line.split('concurrencyPolicy:')[1].trim() as 'Allow' | 'Forbid' | 'Replace';
      } else if (line.startsWith('startingDeadlineSeconds:')) {
        jobData.startingDeadline = line.split('startingDeadlineSeconds:')[1].trim();
      } else if (line.startsWith('successfulJobsHistoryLimit:')) {
        jobData.historySuccess = line.split('successfulJobsHistoryLimit:')[1].trim();
      } else if (line.startsWith('failedJobsHistoryLimit:')) {
        jobData.historyFailure = line.split('failedJobsHistoryLimit:')[1].trim();
      } else if (line.startsWith('restartPolicy:')) {
        jobData.restartPolicy = line.split('restartPolicy:')[1].trim() as 'Never' | 'OnFailure';
      } else if (line.startsWith('cpu:') && lines[i-1]?.includes('requests:')) {
        jobData.cpuRequest = line.split('cpu:')[1].trim().replace(/"/g, '');
      } else if (line.startsWith('memory:') && lines[i-1]?.includes('requests:')) {
        jobData.memoryRequest = line.split('memory:')[1].trim().replace(/"/g, '');
      } else if (line.startsWith('cpu:') && lines[i-1]?.includes('limits:')) {
        jobData.cpuLimit = line.split('cpu:')[1].trim().replace(/"/g, '');
      } else if (line.startsWith('memory:') && lines[i-1]?.includes('limits:')) {
        jobData.memoryLimit = line.split('memory:')[1].trim().replace(/"/g, '');
      }
    }

    const job: Job = {
      id: currentJob?.id || `job-${Date.now()}`,
      name: jobData.name || '',
      type: jobType,
      namespace: jobData.namespace || '',
      containers: jobData.containers || [],
      image: jobData.image || '',
      command: jobData.command,
      args: jobData.args,
      schedule: jobData.schedule,
      cpuRequest: jobData.cpuRequest || '',
      memoryRequest: jobData.memoryRequest || '',
      cpuLimit: jobData.cpuLimit,
      memoryLimit: jobData.memoryLimit,
      restartPolicy: jobData.restartPolicy || 'Never',
      labels: jobData.labels || [],
      concurrencyPolicy: jobData.concurrencyPolicy,
      startingDeadline: jobData.startingDeadline,
      historySuccess: jobData.historySuccess,
      historyFailure: jobData.historyFailure,
    };

    console.log('JobManager creating job:', job);

    // If we're editing an existing job, update it; otherwise add a new one
    if (currentJob && onUpdateJob) {
      onUpdateJob(currentJob.id, job);
    } else {
      onAddJob(job);
    }
    
    setShowForm(false);
    setCurrentJob(null);
    setJobType('job'); // Reset to default
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Job Manager
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!showForm ? (
            <div className="space-y-6">
              {/* Add Job Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddJob}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors duration-200 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Job
                </button>
                <button
                  onClick={handleAddCronJob}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-medium"
                >
                  <Clock className="w-4 h-4" />
                  Add CronJob
                </button>
              </div>

              {/* Jobs List */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Jobs ({jobs.filter(j => j.type === 'job').length})</h4>
                {jobs.filter(j => j.type === 'job').map((job) => (
                  <div key={job.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Play className="w-5 h-5 text-pink-500" />
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">{job.name}</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {job.namespace} • {job.image}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="px-3 py-1 text-sm bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200 rounded hover:bg-pink-200 dark:hover:bg-pink-800 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteJob(job.id)}
                          className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200"
                          title="Delete job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CronJobs List */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">CronJobs ({jobs.filter(j => j.type === 'cronjob').length})</h4>
                {jobs.filter(j => j.type === 'cronjob').map((job) => (
                  <div key={job.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">{job.name}</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {job.namespace} • {job.schedule} • {job.image}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteJob(job.id)}
                          className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200"
                          title="Delete cronjob"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {currentJob ? `Edit ${currentJob.name}` : `Create New ${jobType === 'job' ? 'Job' : 'CronJob'}`}
                </h4>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setCurrentJob(null);
                    setJobType('job'); // Reset to default
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
              <JobForm
                mode={jobType}
                namespaces={namespaces}
                onSave={handleSaveJob as JobFormProps['onSave']}
                initialValues={currentJob as any}
                onClose={() => setShowForm(false)}
                availableConfigMaps={availableConfigMaps}
                availableSecrets={availableSecrets}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}