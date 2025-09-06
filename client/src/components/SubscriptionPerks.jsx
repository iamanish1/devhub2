import React from 'react';
import { useSubscription } from '../utils/subscriptionUtils';

/**
 * Subscription Perks Component
 * Displays user's current subscription perks and features
 */
const SubscriptionPerks = ({ 
  showTitle = true, 
  showLimits = true, 
  showBenefits = true,
  className = '' 
}) => {
  const { 
    subscription, 
    isActive, 
    getBenefits, 
    getUserLimits, 
    getStatusText,
    getDaysRemaining,
    isExpiringSoon 
  } = useSubscription();

  if (!isActive) {
    return (
      <div className={`glass rounded-xl p-6 border border-gray-700 ${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Free Plan Features
          </h3>
        )}
        
        <div className="space-y-3">
          <div className="text-gray-300 text-sm">
            You're currently on the free plan. Upgrade to unlock premium features!
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Max Projects:</span>
              <span className="text-white font-medium">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Bids:</span>
              <span className="text-white font-medium">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Team Members:</span>
              <span className="text-white font-medium">1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max File Uploads:</span>
              <span className="text-white font-medium">10</span>
            </div>
          </div>
          
          <div className="pt-4">
            <a 
              href="/subscription" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] hover:from-[#0096D6] hover:to-[#0056CC] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Upgrade to Premium
            </a>
          </div>
        </div>
      </div>
    );
  }

  const benefits = getBenefits();
  const limits = getUserLimits();
  const daysRemaining = getDaysRemaining();
  const expiringSoon = isExpiringSoon();

  return (
    <div className={`glass rounded-xl p-6 border border-gray-700 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00A8E8]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {getStatusText()}
          </h3>
          
          {expiringSoon && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {daysRemaining} days left
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {showBenefits && benefits.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Premium Benefits
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        )}

        {showLimits && (
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
              Plan Limits
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Max Projects:</span>
                <span className="text-white font-medium">
                  {limits.maxProjects === -1 ? 'Unlimited' : limits.maxProjects}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Bids:</span>
                <span className="text-white font-medium">
                  {limits.maxBids === -1 ? 'Unlimited' : limits.maxBids}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Team Members:</span>
                <span className="text-white font-medium">
                  {limits.maxTeamMembers === -1 ? 'Unlimited' : limits.maxTeamMembers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max File Uploads:</span>
                <span className="text-white font-medium">
                  {limits.maxFileUploads === -1 ? 'Unlimited' : limits.maxFileUploads}
                </span>
              </div>
            </div>
          </div>
        )}

        {expiringSoon && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Your subscription expires in {daysRemaining} days. 
              <a href="/subscription" className="underline hover:no-underline">
                Renew now
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPerks;
