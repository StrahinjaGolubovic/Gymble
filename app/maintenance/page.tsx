'use client';

import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="text-3xl sm:text-4xl font-extrabold text-gray-100 mb-3">Maintenance Break</div>
        <div className="text-gray-400 mb-6">
          We’re doing a quick maintenance break. Please check again later.
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
          <Link
            href="/login"
            className="px-4 py-2 rounded-md bg-gray-700 text-gray-100 hover:bg-gray-600 transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}


