/**
 * Images hook - manages image state and polling
 */

import { useState, useCallback, useRef } from 'react';
import { checkStatus, getResultUrl } from '../api/client';
import type { StatusResponse } from '../types/index';

interface ImageJob {
  jobId: string;
  originalFile: File;
  originalUrl: string;
  status: StatusResponse['status'];
  resultUrl?: string;
  uploadedAt: Date;
  progress?: number;
  stage?: string;
}

export function useImages() {
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const pollingRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addJob = useCallback((jobId: string, file: File) => {
    const originalUrl = URL.createObjectURL(file);
    const newJob: ImageJob = {
      jobId,
      originalFile: file,
      originalUrl,
      status: 'queued',
      uploadedAt: new Date(),
    };
    setJobs(prev => [...prev, newJob]);
    
    // Start status polling
    pollStatus(jobId);
  }, []);

  const pollStatus = useCallback((jobId: string) => {
    const poll = async () => {
      try {
        const status = await checkStatus(jobId);
        
        setJobs(prev => prev.map(job => 
          job.jobId === jobId
            ? { 
                ...job, 
                status: status.status, 
                resultUrl: status.result_url ? getResultUrl(jobId) : undefined,
                progress: status.progress,
                stage: status.stage,
              }
            : job
        ));

        // Continue polling if still processing
        if (status.status === 'queued' || status.status === 'processing') {
          const timeoutId = setTimeout(poll, 2000);
          pollingRefs.current.set(jobId, timeoutId);
        } else {
          // Clear polling ref when done
          pollingRefs.current.delete(jobId);
        }
      } catch (err) {
        console.error('Status poll failed:', err);
        // Retry on error with longer delay
        const timeoutId = setTimeout(poll, 5000);
        pollingRefs.current.set(jobId, timeoutId);
      }
    };

    poll();
  }, []);

  const removeJob = useCallback((jobId: string) => {
    // Stop polling
    const timeoutId = pollingRefs.current.get(jobId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      pollingRefs.current.delete(jobId);
    }

    // Clean up blob URL
    setJobs(prev => {
      const job = prev.find(j => j.jobId === jobId);
      if (job?.originalUrl) {
        URL.revokeObjectURL(job.originalUrl);
      }
      return prev.filter(j => j.jobId !== jobId);
    });
  }, []);

  const clearAllJobs = useCallback(() => {
    // Stop all polling
    pollingRefs.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    pollingRefs.current.clear();

    // Clean up blob URLs
    jobs.forEach(job => {
      if (job.originalUrl) {
        URL.revokeObjectURL(job.originalUrl);
      }
    });

    setJobs([]);
  }, [jobs]);

  return {
    jobs,
    addJob,
    removeJob,
    clearAllJobs,
  };
}
