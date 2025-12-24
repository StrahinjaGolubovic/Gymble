'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ToastContainer, Toast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';

interface CrewInfo {
  id: number;
  name: string;
  leader_username: string;
  member_count: number;
  average_streak: number;
  average_trophies: number;
  is_member: boolean;
  is_leader: boolean;
  has_pending_request: boolean;
}

interface CrewMemberInfo {
  id: number;
  user_id: number;
  username: string;
  trophies: number;
  current_streak: number;
  longest_streak: number;
  profile_picture: string | null;
  joined_at: string;
  is_leader: boolean;
}

interface CrewRequestInfo {
  id: number;
  crew_id: number;
  crew_name: string;
  user_id: number;
  username: string;
  trophies: number;
  current_streak: number;
  created_at: string;
}

export default function CrewsPage() {
  const router = useRouter();
  const [myCrew, setMyCrew] = useState<CrewInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CrewInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [crewDetails, setCrewDetails] = useState<{
    crew: CrewInfo;
    members: CrewMemberInfo[];
    requests: CrewRequestInfo[];
  } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'default';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchMyCrew = useCallback(async () => {
    try {
      const response = await fetch('/api/crews/my-crew');
      if (response.ok) {
        const data = await response.json();
        setMyCrew(data.crew);
      }
    } catch (err) {
      console.error('Error fetching my crew:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCrew();
  }, [fetchMyCrew]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/crews/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.crews || []);
      }
    } catch (err) {
      console.error('Error searching crews:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function showConfirm(
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'danger' | 'default' = 'default'
  ) {
    setConfirmModal({ isOpen: true, title, message, onConfirm, variant });
  }

  async function handleCreateCrew() {
    if (!newCrewName.trim()) {
      showToast('Please enter a crew name', 'error');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/crews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCrewName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Crew created successfully!', 'success');
        setShowCreateModal(false);
        setNewCrewName('');
        await fetchMyCrew();
      } else {
        showToast(data.error || 'Failed to create crew', 'error');
      }
    } catch (err) {
      showToast('An error occurred', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleRequestJoin(crewId: number) {
    try {
      const response = await fetch('/api/crews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crewId }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Join request sent!', 'success');
        // Refresh search results to update request status
        handleSearch(searchQuery);
      } else {
        showToast(data.error || 'Failed to send request', 'error');
      }
    } catch (err) {
      showToast('An error occurred', 'error');
    }
  }

  async function handleAcceptRequest(requestId: number) {
    try {
      const response = await fetch('/api/crews/accept-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Request accepted!', 'success');
        await fetchCrewDetails(crewDetails!.crew.id);
      } else {
        showToast(data.error || 'Failed to accept request', 'error');
      }
    } catch (err) {
      showToast('An error occurred', 'error');
    }
  }

  async function handleRejectRequest(requestId: number) {
    try {
      const response = await fetch('/api/crews/reject-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Request rejected', 'info');
        await fetchCrewDetails(crewDetails!.crew.id);
      } else {
        showToast(data.error || 'Failed to reject request', 'error');
      }
    } catch (err) {
      showToast('An error occurred', 'error');
    }
  }

  async function handleLeaveCrew() {
    showConfirm(
      'Leave Crew',
      'Are you sure you want to leave this crew?',
      async () => {
        try {
          const response = await fetch('/api/crews/leave', {
            method: 'POST',
          });

          const data = await response.json();

          if (response.ok) {
            showToast('Left crew successfully', 'success');
            setMyCrew(null);
            if (showDetailsModal) {
              setShowDetailsModal(false);
              setCrewDetails(null);
            }
          } else {
            showToast(data.error || 'Failed to leave crew', 'error');
          }
        } catch (err) {
          showToast('An error occurred', 'error');
        }
      },
      'danger'
    );
  }

  async function fetchCrewDetails(crewId: number) {
    try {
      const response = await fetch(`/api/crews/${crewId}`);
      if (response.ok) {
        const data = await response.json();
        setCrewDetails(data);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error('Error fetching crew details:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/streakd_logo.png"
                alt="STREAKD."
                width={180}
                height={52}
                priority
                unoptimized
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-200 hover:text-gray-100 px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">Crews</h1>
          <p className="text-gray-400">Join or create a crew to compete with others!</p>
        </div>

        {/* My Crew Section */}
        {myCrew && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-100 mb-2">My Crew: {myCrew.name}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Members:</span>
                    <span className="ml-2 text-gray-100 font-semibold">{myCrew.member_count}/30</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Avg Streak:</span>
                    <span className="ml-2 text-gray-100 font-semibold">{myCrew.average_streak}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Avg Trophies:</span>
                    <span className="ml-2 text-gray-100 font-semibold">{myCrew.average_trophies}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Leader:</span>
                    <span className="ml-2 text-gray-100 font-semibold">@{myCrew.leader_username}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchCrewDetails(myCrew.id)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  View Details
                </button>
                {!myCrew.is_leader && (
                  <button
                    onClick={handleLeaveCrew}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Leave
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search and Create Section */}
        {!myCrew && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search crews by name..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors whitespace-nowrap"
              >
                Create Crew
              </button>
            </div>

            {/* Search Results */}
            {searching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mx-auto"></div>
              </div>
            )}

            {!searching && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-4 text-gray-400">No crews found</div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((crew) => (
                  <div
                    key={crew.id}
                    className="bg-gray-700 border border-gray-600 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-100 mb-1">{crew.name}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Leader:</span>
                          <span className="ml-2 text-gray-200">@{crew.leader_username}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Members:</span>
                          <span className="ml-2 text-gray-200">{crew.member_count}/30</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Avg Streak:</span>
                          <span className="ml-2 text-gray-200">{crew.average_streak}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Avg Trophies:</span>
                          <span className="ml-2 text-gray-200">{crew.average_trophies}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchCrewDetails(crew.id)}
                        className="px-4 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500 transition-colors"
                      >
                        View
                      </button>
                      {!crew.has_pending_request && !crew.is_member && (
                        <button
                          onClick={() => handleRequestJoin(crew.id)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                        >
                          Request Join
                        </button>
                      )}
                      {crew.has_pending_request && (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-500 text-gray-300 rounded-md cursor-not-allowed"
                        >
                          Pending
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Crew Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-100 mb-4">Create New Crew</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Crew Name</label>
                <input
                  type="text"
                  value={newCrewName}
                  onChange={(e) => setNewCrewName(e.target.value)}
                  placeholder="Enter crew name..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  maxLength={30}
                />
                <p className="mt-1 text-xs text-gray-400">3-30 characters, letters, numbers, underscores, and spaces</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateCrew}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCrewName('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Crew Details Modal */}
        {showDetailsModal && crewDetails && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDetailsModal(false)}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-100">{crewDetails.crew.name}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Crew Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Members</div>
                  <div className="text-2xl font-bold text-gray-100">{crewDetails.crew.member_count}/30</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Avg Streak</div>
                  <div className="text-2xl font-bold text-gray-100">{crewDetails.crew.average_streak}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Avg Trophies</div>
                  <div className="text-2xl font-bold text-gray-100">{crewDetails.crew.average_trophies}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Leader</div>
                  <div className="text-lg font-semibold text-gray-100">@{crewDetails.crew.leader_username}</div>
                </div>
              </div>

              {/* Pending Requests (Leader Only) */}
              {crewDetails.crew.is_leader && crewDetails.requests.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-100 mb-3">Pending Requests</h4>
                  <div className="space-y-2">
                    {crewDetails.requests.map((request) => (
                      <div key={request.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-100">@{request.username}</div>
                          <div className="text-sm text-gray-400">
                            {request.trophies} trophies • {request.current_streak} day streak
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div>
                <h4 className="text-lg font-semibold text-gray-100 mb-3">Members</h4>
                <div className="space-y-2">
                  {crewDetails.members.map((member) => (
                    <div key={member.id} className="bg-gray-700 rounded-lg p-4 flex items-center gap-4">
                      {member.profile_picture ? (
                        <Image
                          src={`/api/files/${member.profile_picture}`}
                          alt={member.username}
                          width={40}
                          height={40}
                          className="rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-semibold">
                          {member.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-100">@{member.username}</span>
                          {member.is_leader && (
                            <span className="px-2 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded">Leader</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {member.trophies} trophies • {member.current_streak} day streak
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        variant={confirmModal.variant}
      />
    </div>
  );
}

