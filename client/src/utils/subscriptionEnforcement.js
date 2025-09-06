/**
 * Subscription Enforcement Utilities
 * Frontend utilities to enforce subscription limits and show upgrade prompts
 */

import { useSubscription } from './subscriptionUtils';
import { notificationService } from '../services/notificationService';

/**
 * Hook to check if user can perform an action
 */
export const useSubscriptionEnforcement = () => {
  const { canPerformAction, isActive, getStatusText } = useSubscription();

  const checkPermission = (actionType, currentUsage = 0) => {
    return canPerformAction(actionType, currentUsage);
  };

  const showUpgradePrompt = (featureName, planRequired = 'Pro') => {
    notificationService.info(
      `🔒 ${featureName} is a premium feature. Upgrade to ${planRequired} plan to unlock this feature.`,
      {
        duration: 5000,
        action: {
          label: 'Upgrade Now',
          onClick: () => {
            window.location.href = '/subscription';
          }
        }
      }
    );
  };

  const enforceAction = (actionType, currentUsage = 0, featureName = null, planRequired = 'Pro') => {
    const canPerform = checkPermission(actionType, currentUsage);
    
    if (!canPerform) {
      const feature = featureName || actionType.replace('_', ' ');
      showUpgradePrompt(feature, planRequired);
      return false;
    }
    
    return true;
  };

  return {
    checkPermission,
    showUpgradePrompt,
    enforceAction,
    isActive,
    getStatusText
  };
};

/**
 * Component wrapper to conditionally render based on subscription
 */
export const SubscriptionGate = ({ 
  children, 
  feature, 
  planRequired = 'Pro',
  fallback = null,
  showUpgradePrompt = true 
}) => {
  const { enforceAction } = useSubscriptionEnforcement();
  
  const canAccess = enforceAction(feature, 0, feature, planRequired);
  
  if (!canAccess && showUpgradePrompt) {
    return fallback || (
      <div className="glass rounded-lg p-4 border border-gray-700 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-white font-medium mb-2">Premium Feature</h3>
        <p className="text-gray-400 text-sm mb-4">
          {feature.replace('_', ' ')} is available with {planRequired} plan
        </p>
        <a 
          href="/subscription"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] hover:from-[#0096D6] hover:to-[#0056CC] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          Upgrade to {planRequired}
        </a>
      </div>
    );
  }
  
  return canAccess ? children : fallback;
};

/**
 * Hook to manage subscription-based actions
 */
export const useSubscriptionActions = () => {
  const { enforceAction, isActive } = useSubscriptionEnforcement();

  const handleBid = (currentBidCount) => {
    return enforceAction('bid', currentBidCount, 'Unlimited Bidding', 'Starter');
  };

  const handleProjectListing = (currentProjectCount) => {
    return enforceAction('list_project', currentProjectCount, 'More Projects', 'Starter');
  };

  const handleTeamCollaboration = () => {
    return enforceAction('team_collaboration', 0, 'Team Collaboration', 'Enterprise');
  };

  const handleProjectBoosting = () => {
    return enforceAction('project_boosting', 0, 'Project Boosting', 'Pro');
  };

  const handleAdvancedAnalytics = () => {
    return enforceAction('advanced_analytics', 0, 'Advanced Analytics', 'Pro');
  };

  const handleCustomProfile = () => {
    return enforceAction('custom_profile', 0, 'Custom Profile', 'Pro');
  };

  const handlePrioritySupport = () => {
    return enforceAction('priority_support', 0, 'Priority Support', 'Pro');
  };

  const handleEarlyAccess = () => {
    return enforceAction('early_access', 0, 'Early Access', 'Pro');
  };

  return {
    handleBid,
    handleProjectListing,
    handleTeamCollaboration,
    handleProjectBoosting,
    handleAdvancedAnalytics,
    handleCustomProfile,
    handlePrioritySupport,
    handleEarlyAccess,
    isActive
  };
};

/**
 * Utility to get upgrade message for specific features
 */
export const getUpgradeMessage = (feature, planRequired = 'Pro') => {
  const messages = {
    bid: `Unlimited bidding is available with Starter plan and above.`,
    list_project: `More projects are available with Starter plan and above.`,
    team_collaboration: `Team collaboration requires Enterprise plan.`,
    project_boosting: `Project boosting requires ${planRequired} plan.`,
    advanced_analytics: `Advanced analytics requires ${planRequired} plan.`,
    custom_profile: `Custom profile requires ${planRequired} plan.`,
    priority_support: `Priority support requires ${planRequired} plan.`,
    early_access: `Early access requires ${planRequired} plan.`
  };

  return messages[feature] || `This feature requires ${planRequired} plan.`;
};

/**
 * Utility to check if user should see upgrade prompts
 */
export const shouldShowUpgradePrompt = (user, feature) => {
  // Don't show upgrade prompts if user already has the feature
  if (user?.subscription?.features?.[feature]) {
    return false;
  }

  // Don't show upgrade prompts if user is on free plan and feature is available in starter
  const starterFeatures = ['unlimitedBids', 'premiumBadge'];
  if (!user?.subscription?.isActive && starterFeatures.includes(feature)) {
    return true;
  }

  // Show upgrade prompts for premium features
  const premiumFeatures = ['teamCollaboration', 'projectBoosting', 'advancedAnalytics', 'customProfile', 'prioritySupport', 'earlyAccess'];
  if (premiumFeatures.includes(feature)) {
    return true;
  }

  return false;
};

export default {
  useSubscriptionEnforcement,
  SubscriptionGate,
  useSubscriptionActions,
  getUpgradeMessage,
  shouldShowUpgradePrompt
};
