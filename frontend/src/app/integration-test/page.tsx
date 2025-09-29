'use client';

import TailwindTest from '@/components/test/TailwindTest';
import QueryTest from '@/components/test/QueryTest';

export default function IntegrationTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Integration Tests
          </h1>
          <p className="text-lg text-gray-600">
            Testing React Query and Tailwind CSS integrations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Tailwind CSS Test
            </h2>
            <TailwindTest />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              React Query Test
            </h2>
            <QueryTest />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            ✅ Integration Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Next.js 15.5.4 with Turbopack</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">TypeScript configuration</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Tailwind CSS integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">React Query with provider setup</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}