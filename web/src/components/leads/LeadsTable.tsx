// web/src/components/leads/LeadsTable.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Lead {
  id: string;
  age: number;
  job: string;
  marital: string;
  education: string;
  balance: number;
  probability: number;
  risk_level: 'Low' | 'Medium' | 'High';
}

interface LeadsTableProps {
  campaignId: string;
}

// Mock data (replace with API call)
const mockLeads: Lead[] = [
  {
    id: '1',
    age: 45,
    job: 'management',
    marital: 'married',
    education: 'tertiary',
    balance: 2500,
    probability: 0.85,
    risk_level: 'High',
  },
  {
    id: '2',
    age: 32,
    job: 'technician',
    marital: 'single',
    education: 'secondary',
    balance: 1200,
    probability: 0.62,
    risk_level: 'Medium',
  },
  {
    id: '3',
    age: 28,
    job: 'services',
    marital: 'single',
    education: 'secondary',
    balance: 450,
    probability: 0.28,
    risk_level: 'Low',
  },
];

export function LeadsTable({ campaignId }: LeadsTableProps) {
  const [leads] = useState<Lead[]>(mockLeads);
  const [sortBy, setSortBy] = useState<'probability' | 'age' | 'balance'>('probability');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterRisk, setFilterRisk] = useState<string>('');

  const handleSort = (column: 'probability' | 'age' | 'balance') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const filteredLeads = filterRisk 
    ? leads.filter(lead => lead.risk_level === filterRisk)
    : leads;

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Risk:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Levels</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <p className="text-sm text-gray-600">
            Showing {sortedLeads.length} of {leads.length} leads
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age
                <button onClick={() => handleSort('age')} className="ml-1">
                  {sortBy === 'age' ? (
                    sortOrder === 'desc' ? <ChevronDown className="w-4 h-4 inline" /> : <ChevronUp className="w-4 h-4 inline" />
                  ) : null}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Education
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
                <button onClick={() => handleSort('balance')} className="ml-1">
                  {sortBy === 'balance' ? (
                    sortOrder === 'desc' ? <ChevronDown className="w-4 h-4 inline" /> : <ChevronUp className="w-4 h-4 inline" />
                  ) : null}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Probability
                <button onClick={() => handleSort('probability')} className="ml-1">
                  {sortBy === 'probability' ? (
                    sortOrder === 'desc' ? <ChevronDown className="w-4 h-4 inline" /> : <ChevronUp className="w-4 h-4 inline" />
                  ) : null}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.age}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {lead.job}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {lead.education}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${lead.balance.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${lead.probability * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {(lead.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    lead.risk_level === 'High' ? 'bg-green-100 text-green-800' :
                    lead.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.risk_level}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link href={`/leads/${lead.id}`}>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
        <span className="text-sm text-gray-700">
          Page 1 of 1
        </span>
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      </div>
    </div>
  );
}