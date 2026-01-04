'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface ShopItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  item_type: string;
  enabled: number;
}

export default function ShopPage() {
  const router = useRouter();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchShopData();
  }, []);

  async function fetchShopData() {
    try {
      const itemsRes = await fetch('/api/shop/items');
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data.items || []);
      }

      const dashRes = await fetch('/api/dashboard');
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setUserCoins(dashData.coins || 0);
      } else if (dashRes.status === 401) {
        router.push('/login');
        return;
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function purchaseItem(itemId: number) {
    setPurchasing(itemId);
    setMessage(null);

    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message || 'Purchase successful!', type: 'success' });
        setUserCoins(data.newBalance);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: data.error || 'Purchase failed', type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setMessage({ text: 'An error occurred', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </Link>
            
            <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-900/50 to-amber-900/50 px-4 py-2 rounded-xl border border-yellow-600/40 shadow-lg">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <span className="text-yellow-400 text-xl">🪙</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-yellow-300/70 font-medium">Your Balance</span>
                <span className="font-bold text-lg text-yellow-200">{userCoins.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            Coin Shop
          </h1>
          <p className="text-gray-400 text-lg">Spend your coins on exclusive items and power-ups</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-900/30 border border-green-700/50 text-green-300'
                : 'bg-red-900/30 border border-red-700/50 text-red-300'
            }`}
          >
            <span className="text-2xl">{message.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Shop Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {items.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="text-6xl mb-4">🏪</div>
              <p className="text-gray-400 text-lg">No items available at the moment</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="group relative bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300"
              >
                {/* Item Icon/Badge */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl">
                    {item.item_type === 'rest_day' ? '😴' : '🎁'}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 bg-yellow-900/30 px-3 py-2 rounded-lg border border-yellow-600/30">
                    <span className="text-yellow-400 text-lg">🪙</span>
                    <span className="font-bold text-yellow-200">{item.price}</span>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => purchaseItem(item.id)}
                  disabled={purchasing === item.id || userCoins < item.price}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                    userCoins < item.price
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : purchasing === item.id
                      ? 'bg-primary-600 text-white cursor-wait'
                      : 'bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:from-primary-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {purchasing === item.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Purchasing...
                    </span>
                  ) : userCoins < item.price ? (
                    'Not Enough Coins'
                  ) : (
                    'Purchase Now'
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-bold text-blue-300">Earn Coins</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Claim <strong className="text-white">75-100 coins</strong> daily from your dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Invite friends and earn <strong className="text-white">150 coins</strong> when they get their first photo verified</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-700/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-bold text-purple-300">Pro Tips</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Save coins for strategic rest day purchases</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>More items coming soon - stay tuned!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
