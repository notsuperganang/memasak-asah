// web/src/components/layout/Topbar.tsx
'use client';

import { User, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Test User</p>
              <p className="text-xs text-gray-500">testuser@gmail.com</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              <button className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Settings</span>
              </button>
              <hr className="my-2 border-gray-200" />
              <button className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 text-red-600">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}