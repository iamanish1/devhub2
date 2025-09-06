import React from 'react';
import { Loader2, FileText, Users, CreditCard, MessageSquare } from 'lucide-react';

// Skeleton loading components
export const SkeletonCard = ({ className = "" }) => (
  <div className={`bg-[#1E1E1E] rounded-lg p-4 animate-pulse ${className}`}>
    <div className="h-4 bg-gray-700 rounded mb-3"></div>
    <div className="h-3 bg-gray-700 rounded mb-2 w-3/4"></div>
    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
  </div>
);

export const SkeletonList = ({ count = 3, className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="bg-[#1E1E1E] rounded-lg overflow-hidden">
    <div className="p-4 border-b border-gray-700">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="p-4 border-b border-gray-700 last:border-b-0">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Contextual loading components
export const ProjectLoadingCard = () => (
  <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700">
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 bg-gray-700 rounded-lg animate-pulse"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-700 rounded mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-700 rounded mb-2 w-3/4 animate-pulse"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      <div className="h-6 bg-gray-700 rounded-full w-16 animate-pulse"></div>
      <div className="h-6 bg-gray-700 rounded-full w-20 animate-pulse"></div>
    </div>
  </div>
);

export const ChatLoadingMessage = () => (
  <div className="flex gap-3 p-4">
    <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
    <div className="flex-1">
      <div className="h-4 bg-gray-700 rounded mb-2 w-1/4 animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Page-level loading components
export const PageLoadingState = ({ title = "Loading...", subtitle = "Please wait while we fetch your data" }) => (
  <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
    <div className="text-center">
      <motion.div
        className="w-16 h-16 border-4 border-[#2A2A2A] border-t-[#00A8E8] rounded-full mx-auto mb-6"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-gray-400">{subtitle}</p>
    </div>
  </div>
);

// Section-specific loading states
export const ProjectsLoadingState = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-6">
      <FileText className="w-5 h-5 text-[#00A8E8]" />
      <h2 className="text-xl font-semibold text-white">Loading Projects...</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <ProjectLoadingCard key={index} />
      ))}
    </div>
  </div>
);

export const UsersLoadingState = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-6">
      <Users className="w-5 h-5 text-[#00A8E8]" />
      <h2 className="text-xl font-semibold text-white">Loading Users...</h2>
    </div>
    <SkeletonTable rows={8} columns={4} />
  </div>
);

export const PaymentLoadingState = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-6">
      <CreditCard className="w-5 h-5 text-[#00A8E8]" />
      <h2 className="text-xl font-semibold text-white">Processing Payment...</h2>
    </div>
    <div className="bg-[#1E1E1E] rounded-lg p-6 text-center">
      <Loader2 className="w-12 h-12 text-[#00A8E8] animate-spin mx-auto mb-4" />
      <p className="text-gray-400">Please don't close this window while we process your payment.</p>
    </div>
  </div>
);

export const ChatLoadingState = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-4">
      <MessageSquare className="w-5 h-5 text-[#00A8E8]" />
      <h2 className="text-lg font-semibold text-white">Loading Messages...</h2>
    </div>
    {Array.from({ length: 5 }).map((_, index) => (
      <ChatLoadingMessage key={index} />
    ))}
  </div>
);

// Inline loading indicator
export const InlineLoader = ({ size = "sm", text = "Loading..." }) => (
  <div className="flex items-center gap-2 text-gray-400">
    <Loader2 className={`animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`} />
    <span className="text-sm">{text}</span>
  </div>
);

export default {
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  ProjectLoadingCard,
  ChatLoadingMessage,
  PageLoadingState,
  ProjectsLoadingState,
  UsersLoadingState,
  PaymentLoadingState,
  ChatLoadingState,
  InlineLoader
};
