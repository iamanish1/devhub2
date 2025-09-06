/**
 * Subscription Middleware
 * Enforces subscription limits and features
 */

import { getPlanConfig, checkPlanLimits } from '../config/subscriptionPlans.js';
import ApiError from '../utils/ApiError.js';

/**
 * Check if user can perform an action based on subscription
 */
export const checkSubscriptionPermission = (actionType, limitType = null) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new ApiError(401, 'Authentication required');
      }

      // Get user's subscription status
      const subscription = user.subscription;
      
      if (!subscription || !subscription.isActive) {
        // Free user limits
        const freeLimits = {
          maxProjects: 2,
          maxTeamMembers: 1,
          maxFileUploads: 10,
          maxBids: 3
        };

        // Check if action is allowed for free users
        if (actionType === 'bid' && req.body.bidCount >= freeLimits.maxBids) {
          throw new ApiError(403, `Free users can only place ${freeLimits.maxBids} bids. Upgrade to premium for unlimited bids.`);
        }

        if (actionType === 'list_project' && req.body.projectCount >= freeLimits.maxProjects) {
          throw new ApiError(403, `Free users can only list ${freeLimits.maxProjects} projects. Upgrade to premium for more projects.`);
        }

        if (actionType === 'team_collaboration') {
          throw new ApiError(403, 'Team collaboration is a premium feature. Upgrade to Pro or Enterprise plan.');
        }

        if (actionType === 'project_boosting') {
          throw new ApiError(403, 'Project boosting is a premium feature. Upgrade to Pro or Enterprise plan.');
        }

        if (actionType === 'advanced_analytics') {
          throw new ApiError(403, 'Advanced analytics is a premium feature. Upgrade to Pro or Enterprise plan.');
        }

        if (actionType === 'custom_profile') {
          throw new ApiError(403, 'Custom profile is a premium feature. Upgrade to Pro or Enterprise plan.');
        }

        if (actionType === 'priority_support') {
          throw new ApiError(403, 'Priority support is a premium feature. Upgrade to Pro or Enterprise plan.');
        }

        if (actionType === 'early_access') {
          throw new ApiError(403, 'Early access is a premium feature. Upgrade to Pro or Enterprise plan.');
        }

        return next();
      }

      // Check subscription expiration
      if (subscription.expiresAt && new Date(subscription.expiresAt) <= new Date()) {
        throw new ApiError(403, 'Your subscription has expired. Please renew to continue using premium features.');
      }

      // Get plan configuration
      const planConfig = getPlanConfig(subscription.planName, subscription.planType);
      
      if (!planConfig) {
        throw new ApiError(500, 'Invalid subscription configuration');
      }

      // Check specific limits
      if (limitType && req.body.currentUsage !== undefined) {
        const canPerform = checkPlanLimits(user, limitType, req.body.currentUsage);
        
        if (!canPerform) {
          const limit = planConfig.limits[limitType];
          const limitText = limit === -1 ? 'unlimited' : limit;
          throw new ApiError(403, `You have reached your ${limitType} limit (${limitText}). Upgrade your plan for higher limits.`);
        }
      }

      // Check feature permissions
      switch (actionType) {
        case 'team_collaboration':
          if (!subscription.features.teamCollaboration) {
            throw new ApiError(403, 'Team collaboration requires Enterprise plan.');
          }
          break;
        
        case 'project_boosting':
          if (!subscription.features.projectBoosting) {
            throw new ApiError(403, 'Project boosting requires Pro or Enterprise plan.');
          }
          break;
        
        case 'advanced_analytics':
          if (!subscription.features.advancedAnalytics) {
            throw new ApiError(403, 'Advanced analytics requires Pro or Enterprise plan.');
          }
          break;
        
        case 'custom_profile':
          if (!subscription.features.customProfile) {
            throw new ApiError(403, 'Custom profile requires Pro or Enterprise plan.');
          }
          break;
        
        case 'priority_support':
          if (!subscription.features.prioritySupport) {
            throw new ApiError(403, 'Priority support requires Pro or Enterprise plan.');
          }
          break;
        
        case 'early_access':
          if (!subscription.features.earlyAccess) {
            throw new ApiError(403, 'Early access requires Pro or Enterprise plan.');
          }
          break;
      }

      // Add subscription info to request for use in controllers
      req.subscription = {
        isActive: subscription.isActive,
        planName: subscription.planName,
        planType: subscription.planType,
        features: subscription.features,
        limits: subscription.limits,
        expiresAt: subscription.expiresAt
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has active subscription
 */
export const requireActiveSubscription = (req, res, next) => {
  const user = req.user;
  
  if (!user || !user.subscription || !user.subscription.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required for this feature',
      upgradeRequired: true
    });
  }

  // Check if subscription is expired
  if (user.subscription.expiresAt && new Date(user.subscription.expiresAt) <= new Date()) {
    return res.status(403).json({
      success: false,
      message: 'Your subscription has expired. Please renew to continue.',
      subscriptionExpired: true
    });
  }

  next();
};

/**
 * Middleware to check specific subscription features
 */
export const requireFeature = (featureName) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user || !user.subscription || !user.subscription.isActive) {
      return res.status(403).json({
        success: false,
        message: `Feature '${featureName}' requires an active subscription`,
        upgradeRequired: true
      });
    }

    if (!user.subscription.features[featureName]) {
      return res.status(403).json({
        success: false,
        message: `Feature '${featureName}' is not available in your current plan`,
        featureRequired: featureName,
        upgradeRequired: true
      });
    }

    next();
  };
};

/**
 * Middleware to check subscription limits
 */
export const checkLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const currentUsage = req.body.currentUsage || 0;

      const canPerform = checkPlanLimits(user, limitType, currentUsage);
      
      if (!canPerform) {
        const planConfig = getPlanConfig(user.subscription?.planName, user.subscription?.planType);
        const limit = planConfig?.limits[limitType] || 0;
        
        return res.status(403).json({
          success: false,
          message: `You have reached your ${limitType} limit (${limit}). Upgrade your plan for higher limits.`,
          limitReached: true,
          limitType,
          currentLimit: limit,
          currentUsage
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  checkSubscriptionPermission,
  requireActiveSubscription,
  requireFeature,
  checkLimit
};
