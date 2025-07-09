import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const RealTimeTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('NOT_CONNECTED');
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [eventCount, setEventCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const { currentUser } = useSupabaseAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 19)]);
  };

  const testConnection = () => {
    if (!currentUser) {
      addLog('❌ No user authenticated');
      return;
    }

    addLog('🔄 Testing real-time connection...');
    
    const channel = supabase
      .channel('test_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          addLog(`🎯 Event received: ${payload.eventType}`);
          setLastEvent(payload);
          setEventCount(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        addLog(`📡 Status: ${status}`);
        setConnectionStatus(status);
      });

    // Clean up after 10 seconds
    setTimeout(() => {
      addLog('🧹 Cleaning up test connection...');
      supabase.removeChannel(channel);
    }, 10000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBSCRIBED': return 'bg-green-500';
      case 'CHANNEL_ERROR': return 'bg-red-500';
      case 'TIMED_OUT': return 'bg-yellow-500';
      case 'CLOSED': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Real-time Connection Test
          <Badge className={getStatusColor(connectionStatus)}>
            {connectionStatus}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test tool to debug real-time connection issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button onClick={testConnection} disabled={!currentUser}>
            Test Connection
          </Button>
          <div className="text-sm text-gray-600">
            Events received: {eventCount}
          </div>
        </div>

        {lastEvent && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Last Event:</h4>
            <pre className="text-xs">{JSON.stringify(lastEvent, null, 2)}</pre>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold">Connection Logs:</h4>
          <div className="max-h-64 overflow-y-auto bg-black text-green-400 p-3 rounded-lg font-mono text-xs">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>User ID: {currentUser?.user_id || 'Not authenticated'}</p>
          <p>Connection will auto-cleanup after 10 seconds</p>
        </div>
      </CardContent>
    </Card>
  );
}; 