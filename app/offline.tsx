'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Add event listeners for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md mx-auto bg-card p-8 rounded-lg shadow-lg border">
        <WifiOff className="h-16 w-16 mx-auto mb-6 text-red-500" />
        <h1 className="text-2xl font-bold mb-4">आप ऑफलाइन हैं</h1>
        <p className="mb-6 text-muted-foreground">
          इंटरनेट कनेक्शन नहीं है। RecipeReady ऐप कुछ सीमित फीचर्स के साथ ऑफलाइन मोड में चल रहा है।
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          आप पहले से सेव किए गए रेसिपी देख सकते हैं, लेकिन नई रेसिपी जेनरेट करने के लिए इंटरनेट कनेक्शन की आवश्यकता होगी।
        </p>
        <Button 
          onClick={handleRefresh} 
          className="w-full"
          variant={isOnline ? "default" : "outline"}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          {isOnline ? 'वापस जाएं' : 'पुनः प्रयास करें'}
        </Button>
      </div>
    </div>
  );
}