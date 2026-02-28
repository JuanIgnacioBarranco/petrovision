// ============================================================
// PetroVision — Push Notification Hook
// Manages Web Push subscription via VAPID / Service Worker
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

/**
 * Convert a base64url-encoded string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface UsePushReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  error: string | null;
}

export function usePushNotifications(): UsePushReturn {
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    isSupported ? Notification.permission : 'unsupported'
  );
  const [error, setError] = useState<string | null>(null);

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch {
        // SW not ready yet
      }
    })();
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Notificaciones push no soportadas en este navegador');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setError('Permiso de notificaciones denegado');
        setIsLoading(false);
        return;
      }

      // 2. Get VAPID public key from server
      const keyRes = await api.get('/push/vapid-key');
      const vapidPublicKey = keyRes.data.public_key;

      // 3. Subscribe via Push API
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 4. Extract keys and send to backend
      const subJson = subscription.toJSON();
      await api.post('/push/subscribe', {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh || '',
        auth: subJson.keys?.auth || '',
      });

      setIsSubscribed(true);
    } catch (err: any) {
      console.error('[PetroVision] Push subscribe error:', err);
      setError(err?.response?.data?.detail || err.message || 'Error al suscribirse');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        const subJson = subscription.toJSON();
        // Unsubscribe from backend
        await api.delete('/push/unsubscribe', {
          data: {
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh || '',
            auth: subJson.keys?.auth || '',
          },
        });
        // Unsubscribe from browser
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err: any) {
      console.error('[PetroVision] Push unsubscribe error:', err);
      setError(err?.response?.data?.detail || err.message || 'Error al desuscribirse');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    error,
  };
}
