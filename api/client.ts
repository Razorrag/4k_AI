/**
 * API Client for backend communication
 * Connects to backend via proxy (port 47823 -> 38291)
 */

import type { UploadResponse, StatusResponse, StatsResponse } from '../types/index';

const API_BASE = '/api';

/**
 * Upload image for enhancement
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }
  
  return response.json();
}

/**
 * Check job status
 */
export async function checkStatus(jobId: string): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE}/status/${jobId}`);
  
  if (!response.ok) {
    throw new Error(`Status check failed: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get result image URL
 */
export function getResultUrl(jobId: string): string {
  return `${API_BASE}/result/${jobId}`;
}

/**
 * Delete job
 */
export async function deleteJob(jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/job/${jobId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.statusText}`);
  }
}

/**
 * Get server stats
 */
export async function getStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE}/stats`);
  
  if (!response.ok) {
    throw new Error(`Failed to get stats: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
