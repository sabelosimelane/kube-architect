// Kubernetes Jobs and CronJobs API abstraction
import type { JobConfig, CronJobConfig } from '../types';

// Placeholder API functions for Jobs and CronJobs
// These would be replaced with actual Kubernetes API calls

export async function listJobs(_namespace: string): Promise<JobConfig[]> {
  // Placeholder: Replace with real fetch
  // const res = await fetch(`${KUBE_API_BASE}/namespaces/${_namespace}/jobs`);
  // const data = await res.json();
  // return data.items.map(mapJobFromK8s);
  return [];
}

export async function listCronJobs(_namespace: string): Promise<CronJobConfig[]> {
  // Placeholder: Replace with real fetch
  // const res = await fetch(`${KUBE_API_BASE}/namespaces/${_namespace}/cronjobs`);
  // const data = await res.json();
  // return data.items.map(mapCronJobFromK8s);
  return [];
}

export async function createJob(_namespace: string, _job: JobConfig): Promise<void> {
  // Placeholder: Replace with real fetch
  // await fetch(`${KUBE_API_BASE}/namespaces/${_namespace}/jobs`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(mapJobToK8s(_job)),
  // });
  console.log('Creating job:', _job);
}

export async function createCronJob(_namespace: string, _cronjob: CronJobConfig): Promise<void> {
  // Placeholder: Replace with real fetch
  // await fetch(`${KUBE_API_BASE}/namespaces/${_namespace}/cronjobs`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(mapCronJobToK8s(_cronjob)),
  // });
  console.log('Creating cronjob:', _cronjob);
}

export async function deleteJob(_namespace: string, _name: string): Promise<void> {
  // Placeholder: Replace with real fetch
  // await fetch(`${KUBE_API_BASE}/namespaces/${_namespace}/jobs/${_name}`, { method: 'DELETE' });
  console.log('Deleting job:', _name);
}

export async function deleteCronJob(_namespace: string, _name: string): Promise<void> {
  // Placeholder: Replace with real fetch
  // await fetch(`${KUBE_API_BASE}/namespaces/${_namespace}/cronjobs/${_name}`, { method: 'DELETE' });
  console.log('Deleting cronjob:', _name);
}

// Optionally, add mapping helpers for K8s <-> UI types here 