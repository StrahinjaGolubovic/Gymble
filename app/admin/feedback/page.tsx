'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDateTimeDisplay } from '@/lib/timezone';
import { ConfirmModal } from '@/components/ConfirmModal';

interface FeedbackEntry {
  id: number;
  userId: number | null;
  username: string;
  text: string;
  createdAt: string;
}

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  variant: 'danger' | 'default';
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'default',
  });

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/feedback');
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
      } else if (response.status === 403) {
        router.push('/dashboard');
      } else {
        setError('Failed to load feedback');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  function showConfirm(
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'danger' | 'default' = 'default'
  ) {
    setConfirmModal({ isOpen: true, title, message, onConfirm, variant });
  }

  async function handleDeleteFeedback(feedbackId: number) {
    showConfirm(
      'Delete Feedback',
      'Are you sure you want to delete this feedback? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch('/api/admin/feedback', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedbackId }),
          });

          const data = await response.json();

          if (response.ok) {
            setFeedback((prev) => prev.filter((f) => f.id !== feedbackId));
          } else {
            alert(data.error || 'Failed to delete feedback');
          }
        } catch (err) {
          alert('An error occurred');
        }
      },
      'danger'
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary-400">Feedback</h1>
          <div className="flex gap-2">
            <Link
              href="/admin/dashboard"
              className="text-gray-200 hover:text-gray-100 px-4 py-2.5 rounded-md hover:bg-gray-700 active:bg-gray-600 transition-colors text-sm sm:text-base touch-manipulation min-h-[44px]"
            >
              Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Navigation */}
        <div className="mb-6 sm:mb-8">
          <nav className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              Users
            </Link>
            <Link
              href="/admin/crews"
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              Crews
            </Link>
            <Link
              href="/admin/verification"
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              Photo Verification
            </Link>
            <Link
              href="/admin/chat"
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              Chat Moderation
            </Link>
            <Link
              href="/admin/feedback"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              Feedback
            </Link>
            <Link
              href="/admin/system"
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              System
            </Link>
          </nav>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-4 sm:mb-6">User Feedback ({feedback.length})</h2>
          
          {feedback.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No feedback submitted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 sm:p-5 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-100">
                        {entry.username}
                      </span>
                      {entry.userId && (
                        <Link
                          href={`/profile/${encodeURIComponent(entry.username)}`}
                          className="text-xs text-primary-400 hover:text-primary-300"
                        >
                          View Profile
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs sm:text-sm text-gray-400">
                        {formatDateTimeDisplay(entry.createdAt)}
                      </span>
                      <button
                        onClick={() => handleDeleteFeedback(entry.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs sm:text-sm"
                        title="Delete feedback"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap break-words">
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        variant={confirmModal.variant}
      />
    </div>
  );
}

