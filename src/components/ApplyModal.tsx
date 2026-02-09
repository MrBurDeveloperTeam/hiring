import { useState, useEffect } from 'react';
import { UploadCloud } from 'lucide-react';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Toast } from './ui/toast';
import { Job, Resume } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { createApplication } from '../lib/api/applications';
import { createDocument, uploadResumeFile } from '../lib/api/profiles';

interface ApplyModalProps {
  open: boolean;
  job?: Job;
  onClose: () => void;
  resumes: Resume[];
  onSuccess?: () => void;
}

export function ApplyModal({ open, job, onClose, resumes, onSuccess }: ApplyModalProps) {
  const { user, userRole, openAuthModal } = useAuth();
  const [selectedResume, setSelectedResume] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', description: '', variant: 'success' as 'success' | 'error' });
  const [isLoading, setIsLoading] = useState(false);

  // Filter out resumes with invalid UUIDs
  const validResumes = resumes.filter(r => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.id));

  useEffect(() => {
    // If modal opens but user is not authenticated or not a seeker, redirect to login
    if (open && (!user || userRole !== 'seeker')) {
      onClose();
      openAuthModal('login', job ? `/jobs/${job.id}` : '/jobs');
    }
    if (!open) {
      // Reset selection when closed so it re-calculates default on next open
      setSelectedResume('');
    }
  }, [open, user, userRole, openAuthModal, onClose, job]);

  const handleSubmit = async () => {
    if (!user || userRole !== 'seeker' || !job) return;

    // Validate inputs
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const hasNewFile = fileInput?.files && fileInput.files.length > 0;

    if (!selectedResume && !hasNewFile) {
      setToastMessage({
        title: 'Resume required',
        description: 'Please select an existing resume or upload a new one.',
        variant: 'error'
      });
      setShowToast(true);
      return;
    }

    // Validate UUID if using existing resume
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (selectedResume && !uuidRegex.test(selectedResume)) {
      setToastMessage({
        title: 'Invalid Resume',
        description: 'The selected resume has an invalid ID. Please upload a new one.',
        variant: 'error'
      });
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      let resumeDocId = selectedResume;

      // Handle file upload if new file is selected
      if (hasNewFile && fileInput.files?.[0]) {
        const file = fileInput.files[0];
        const storagePath = await uploadResumeFile(file, user.id);
        const newDoc = await createDocument({
          user_id: user.id,
          title: file.name,
          storage_path: storagePath,
          doc_type: 'resume',
          is_default: true // Set as default as requested
        });
        resumeDocId = newDoc.id;
      }

      await createApplication({
        job_id: job.id,
        org_id: job.orgId,
        seeker_user_id: user.id,
        resume_doc_id: resumeDocId,
        screening_answers: answers,
      });

      setToastMessage({
        title: 'Application submitted',
        description: 'The clinic will review your profile.',
        variant: 'success'
      });
      setShowToast(true);

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setShowToast(false);
        onClose();
        // Reset form
        setAnswers({});
        setUploadedFile('');
        setSelectedResume('');
        if (fileInput) fileInput.value = '';
      }, 1500);
    } catch (error) {
      console.error('Application error:', error);
      setToastMessage({
        title: 'Submission failed',
        description: 'There was an error submitting your application. Please try again.',
        variant: 'error'
      });
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-select default resume
  useEffect(() => {
    if (open && validResumes.length > 0) {
      const defaultResume = validResumes.find(r => r.isDefault);
      // Always prioritize default resume if found, 
      // or fallback to first resume if nothing is selected yet
      if (defaultResume) {
        setSelectedResume(defaultResume.id);
      } else if (!selectedResume) {
        setSelectedResume(validResumes[0].id);
      }
    }
  }, [open, validResumes, selectedResume]);

  // Don't render modal if user is not authenticated
  if (!user || userRole !== 'seeker') {
    return null;
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Quick Apply${job ? ` - ${job.roleType}` : ''}`}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Resume</label>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <span className="truncate">
                {selectedResume
                  ? validResumes.find(r => r.id === selectedResume)?.name || 'Default Resume'
                  : 'No resume selected'}
              </span>
              <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                {selectedResume && validResumes.find(r => r.id === selectedResume)?.isDefault ? 'Default' : ''}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-brand/40 bg-brand/5 p-4">
            <p className="text-sm font-semibold text-gray-800">Upload a new resume</p>
            <p className="text-xs text-gray-600">Supported formats: PDF, DOCX (Max 5MB)</p>
            <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-brand shadow-sm transition hover:bg-brand/10">
              <UploadCloud className="h-4 w-4" />
              <span>{uploadedFile || 'Choose file'}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadedFile(file.name);
                    setSelectedResume(''); // Clear selection when uploading new
                  }
                }}
              />
            </label>
          </div>

          <div className="grid gap-3">
            <Textarea
              label="Have you assisted in 4-hand dentistry?"
              placeholder="Share your experience..."
              value={answers.q1 || ''}
              onChange={(e) => setAnswers({ ...answers, q1: e.target.value })}
            />
            <Textarea
              label="Comfort with intraoral scanning?"
              placeholder="IOS brands, number of scans done, etc."
              value={answers.q2 || ''}
              onChange={(e) => setAnswers({ ...answers, q2: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </div>
      </Modal>
      <Toast
        open={showToast}
        onClose={() => setShowToast(false)}
        title={toastMessage.title}
        description={toastMessage.description}
        variant={toastMessage.variant}
      />
    </>
  );
}
