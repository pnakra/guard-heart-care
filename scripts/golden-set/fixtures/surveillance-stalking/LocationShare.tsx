import { useState, useEffect } from 'react';

// Dating app feature: share your real-time GPS location with a match, and let
// them keep watching it in the background with no expiry and no ongoing consent.
export function LiveLocationShare({ matchId }: { matchId: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const id = navigator.geolocation.watchPosition((pos) => {
      const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(point);
      // Continuously push the partner's exact whereabouts to the other user.
      fetch(`/api/matches/${matchId}/track`, { method: 'POST', body: JSON.stringify(point) });
    });
    return () => navigator.geolocation.clearWatch(id);
  }, [matchId]);

  return <div>Sharing your live location{coords ? ` (${coords.lat}, ${coords.lng})` : ''}</div>;
}

// Notify the watcher the instant the tracked person moves or opens the app.
export function notifyWatcherOnActivity(watcherId: string, event: string) {
  return fetch(`/api/users/${watcherId}/alerts`, { method: 'POST', body: event });
}
