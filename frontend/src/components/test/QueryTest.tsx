'use client';

import { useQuery } from '@tanstack/react-query';

// Simple API call to test React Query integration
async function fetchApiStatus() {
  const response = await fetch('http://localhost:8000/api/v1/status');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

export default function QueryTest() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['apiStatus'],
    queryFn: fetchApiStatus,
    retry: 1,
    refetchOnMount: false,
  });

  if (isLoading) return <div className="text-blue-500">Loading API status...</div>;
  if (error) return <div className="text-red-500">Error: API not available (expected if backend not running)</div>;

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
      <h3 className="text-green-800 font-semibold">✅ React Query Working!</h3>
      <p className="text-green-700 text-sm mt-1">
        Successfully fetched: {data?.api || 'API data'}
      </p>
      <pre className="text-xs text-green-600 mt-2 bg-green-100 p-2 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}