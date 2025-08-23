import React from 'react';

const DataExplanationCard = ({ type }) => {
  const isOverview = type === 'overview';
  
  return (
    <div className="glass rounded-xl p-6 border border-gray-700 bg-gradient-to-r from-blue-500/5 to-green-500/5">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-3">
            {isOverview ? 'Overview Data Calculation' : 'Analytics Data Calculation'}
          </h3>
          
          <div className="space-y-3">
            {isOverview ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">Only Successful Payments</p>
                    <p className="text-gray-400 text-xs">Includes payments with status: 'success' or 'paid'</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">All-Time Statistics</p>
                    <p className="text-gray-400 text-xs">Shows complete payment history from account creation</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">Real-Time Updates</p>
                    <p className="text-gray-400 text-xs">Data refreshes automatically when new payments are made</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">All Payment Types</p>
                    <p className="text-gray-400 text-xs">Includes successful, failed, pending, and cancelled payments</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">Time-Period Filtered</p>
                    <p className="text-gray-400 text-xs">Data filtered by selected period (7 days, 30 days, etc.)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">Detailed Breakdown</p>
                    <p className="text-gray-400 text-xs">Shows payment types, trends, and recent activity</p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-white">Why the difference?</span> Overview shows your actual spending (successful payments only), while Analytics provides comprehensive insights including all payment attempts for better analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplanationCard;
