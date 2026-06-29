'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, Loader2 } from 'lucide-react';

/**
 * PushNotificationToggle — standalone component to enable/disable push notifications.
 * Can be used in settings, preferences, or inline anywhere.
 */
export default function PushNotificationToggle() {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe, error } =
    usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <BellOff size={16} />
        <span>Push notifications not supported in this browser</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <BellOff size={16} />
        <span>
          Notifications blocked. Enable them in your browser settings.
        </span>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
          ${
            isSubscribed
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-700 hover:bg-indigo-50'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isSubscribed ? (
          <Bell size={16} className="text-indigo-600" />
        ) : (
          <BellOff size={16} />
        )}
        <span>
          {isLoading
            ? 'Processing...'
            : isSubscribed
              ? 'Push notifications enabled'
              : 'Enable push notifications'}
        </span>
      </button>
      {error && (
        <p className="text-xs text-red-500 ml-1">{error}</p>
      )}
    </div>
  );
}
