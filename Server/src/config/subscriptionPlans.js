/**
 * Subscription Plans Configuration
 * Revenue-optimized pricing with multiple tiers and billing cycles
 */

export const SUBSCRIPTION_PLANS = {
  STARTER: {
    name: 'starter',
    displayName: 'Starter',
    description: 'Perfect for beginners and freelancers',
    plans: {
      weekly: {
        price: 99,
        duration: 7, // days
        savings: 0,
        popular: false
      },
      monthly: {
        price: 299,
        duration: 30, // days
        savings: 0,
        popular: true
      },
      yearly: {
        price: 2999,
        duration: 365, // days
        savings: 17, // 17% savings
        popular: false
      }
    },
    features: {
      unlimitedBids: true,
      prioritySupport: false,
      advancedAnalytics: false,
      premiumBadge: true,
      earlyAccess: false,
      customProfile: false,
      projectBoosting: false,
      teamCollaboration: false
    },
    limits: {
      maxProjects: 5,
      maxTeamMembers: 2,
      maxFileUploads: 100
    }
  },
  
  PRO: {
    name: 'pro',
    displayName: 'Pro',
    description: 'For serious developers and small teams',
    plans: {
      weekly: {
        price: 199,
        duration: 7,
        savings: 0,
        popular: false
      },
      monthly: {
        price: 599,
        duration: 30,
        savings: 0,
        popular: true
      },
      yearly: {
        price: 5999,
        duration: 365,
        savings: 17,
        popular: false
      }
    },
    features: {
      unlimitedBids: true,
      prioritySupport: true,
      advancedAnalytics: true,
      premiumBadge: true,
      earlyAccess: true,
      customProfile: true,
      projectBoosting: true,
      teamCollaboration: false
    },
    limits: {
      maxProjects: 20,
      maxTeamMembers: 5,
      maxFileUploads: 500
    }
  },
  
  ENTERPRISE: {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'For large teams and organizations',
    plans: {
      weekly: {
        price: 399,
        duration: 7,
        savings: 0,
        popular: false
      },
      monthly: {
        price: 1299,
        duration: 30,
        savings: 0,
        popular: false
      },
      yearly: {
        price: 12999,
        duration: 365,
        savings: 17,
        popular: true
      }
    },
    features: {
      unlimitedBids: true,
      prioritySupport: true,
      advancedAnalytics: true,
      premiumBadge: true,
      earlyAccess: true,
      customProfile: true,
      projectBoosting: true,
      teamCollaboration: true
    },
    limits: {
      maxProjects: -1, // unlimited
      maxTeamMembers: -1, // unlimited
      maxFileUploads: -1 // unlimited
    }
  }
};

/**
 * Get plan configuration by name and type
 */
export const getPlanConfig = (planName, planType) => {
  const plan = SUBSCRIPTION_PLANS[planName.toUpperCase()];
  if (!plan) return null;
  
  const planDetails = plan.plans[planType];
  if (!planDetails) return null;
  
  return {
    ...plan,
    planDetails,
    planType,
    planName: plan.name
  };
};

/**
 * Calculate subscription pricing
 */
export const calculateSubscriptionPricing = (planName, planType) => {
  const config = getPlanConfig(planName, planType);
  if (!config) return null;
  
  const { planDetails } = config;
  const monthlyEquivalent = (planDetails.price / planDetails.duration) * 30;
  
  return {
    price: planDetails.price,
    duration: planDetails.duration,
    monthlyEquivalent: Math.round(monthlyEquivalent),
    savings: planDetails.savings,
    popular: planDetails.popular,
    features: config.features,
    limits: config.limits
  };
};

/**
 * Get all available plans for display
 */
export const getAllPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS).map(plan => ({
    name: plan.name,
    displayName: plan.displayName,
    description: plan.description,
    plans: Object.entries(plan.plans).map(([type, details]) => ({
      type,
      ...details,
      monthlyEquivalent: Math.round((details.price / details.duration) * 30)
    })),
    features: plan.features,
    limits: plan.limits
  }));
};

/**
 * Check if user has specific feature
 */
export const hasFeature = (user, featureName) => {
  if (!user.subscription || !user.subscription.isActive) {
    return false;
  }
  
  return user.subscription.features[featureName] === true;
};

/**
 * Check if user has reached plan limits
 */
export const checkPlanLimits = (user, limitType, currentUsage) => {
  if (!user.subscription || !user.subscription.isActive) {
    // Free user limits
    const freeLimits = {
      maxProjects: 2,
      maxTeamMembers: 1,
      maxFileUploads: 10
    };
    return currentUsage < freeLimits[limitType];
  }
  
  const planConfig = getPlanConfig(user.subscription.planName, user.subscription.planType);
  if (!planConfig) return false;
  
  const limit = planConfig.limits[limitType];
  if (limit === -1) return true; // unlimited
  
  return currentUsage < limit;
};

/**
 * Get subscription benefits for display
 */
export const getSubscriptionBenefits = (planName) => {
  const plan = SUBSCRIPTION_PLANS[planName.toUpperCase()];
  if (!plan) return [];
  
  const benefits = [];
  
  if (plan.features.unlimitedBids) {
    benefits.push('Unlimited project bids');
  }
  if (plan.features.prioritySupport) {
    benefits.push('Priority customer support');
  }
  if (plan.features.advancedAnalytics) {
    benefits.push('Advanced project analytics');
  }
  if (plan.features.premiumBadge) {
    benefits.push('Premium profile badge');
  }
  if (plan.features.earlyAccess) {
    benefits.push('Early access to new features');
  }
  if (plan.features.customProfile) {
    benefits.push('Custom profile customization');
  }
  if (plan.features.projectBoosting) {
    benefits.push('Project visibility boosting');
  }
  if (plan.features.teamCollaboration) {
    benefits.push('Advanced team collaboration tools');
  }
  
  return benefits;
};

export default SUBSCRIPTION_PLANS;
