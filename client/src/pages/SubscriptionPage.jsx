import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';
import PaymentModal from '../components/payment/PaymentModal';
import LoadingSpinner from '../components/LoadingSpinner';
import NavBar from '../components/NavBar';
import PremiumBadge, { SubscriptionStatusBadge } from '../components/PremiumBadge';
import notificationService from '../services/notificationService';
import paymentApi from '../services/paymentApi';
import { 
  PAYMENT_TYPES, 
  PAYMENT_AMOUNTS, 
  PAYMENT_STATUS 
} from '../constants/paymentConstants';
import { 
  formatCurrency, 
  getPaymentStatusColor, 
  getPaymentStatusIcon, 
  formatPaymentDate
} from '../utils/paymentUtils.jsx';

const SubscriptionPage = () => {
  const { 
    subscriptionStatus, 
    isProcessing, 
    refreshData
  } = usePayment();

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanType, setSelectedPlanType] = useState('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Fetch subscription plans and current status
  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const [plansResponse, statusResponse] = await Promise.all([
        paymentApi.getSubscriptionPlans(),
        paymentApi.getSubscriptionStatus()
      ]);
      
      setPlans(plansResponse.plans || []);
      setCurrentSubscription(statusResponse);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      notificationService.error('Failed to fetch subscription information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
    refreshData();
  }, [refreshData]);

  const handlePlanSelect = (plan, planType) => {
    setSelectedPlan(plan);
    setSelectedPlanType(planType);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (result) => {
    console.log('Subscription payment successful:', result);
    setShowPaymentModal(false);
    setSelectedPlan(null);
    
    // Refresh subscription data
    await fetchSubscriptionData();
    await refreshData();
    
    notificationService.success('🎉 Subscription activated successfully! Welcome to premium!');
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will retain access until your current period ends.')) {
      return;
    }

    try {
      await paymentApi.cancelSubscription();
      await fetchSubscriptionData();
      await refreshData();
      notificationService.success('Subscription cancelled successfully');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      notificationService.error('Failed to cancel subscription');
    }
  };

  const getPlanPrice = (plan, planType) => {
    const planDetails = plan.plans.find(p => p.type === planType);
    return planDetails ? planDetails.price : 0;
  };

  const getPlanSavings = (plan, planType) => {
    const planDetails = plan.plans.find(p => p.type === planType);
    return planDetails ? planDetails.savings : 0;
  };

  const isCurrentPlan = (planName, planType) => {
    return currentSubscription?.subscription?.planName === planName && 
           currentSubscription?.subscription?.planType === planType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white">
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 mt-[5vmin]">
          <h1 className="text-4xl font-bold text-white mb-2">Subscription Plans</h1>
          <p className="text-gray-300">Choose the perfect plan for your development journey</p>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription?.isActive && (
          <div className="glass rounded-xl p-6 border border-gray-700 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Current Subscription</h2>
                <div className="flex items-center space-x-4">
                  <PremiumBadge 
                    planName={currentSubscription.subscription.planName}
                    planType={currentSubscription.subscription.planType}
                    size="large"
                  />
                  <div className="text-gray-300">
                    <p>Expires: {formatPaymentDate(currentSubscription.subscription.expiresAt)}</p>
                    <p>Auto-renewal: {currentSubscription.subscription.autoRenew ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        )}

        {/* Plan Type Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#2A2A2A] rounded-lg p-1 flex">
            {['weekly', 'monthly', 'yearly'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedPlanType(type)}
                className={`px-6 py-2 rounded-md transition-colors ${
                  selectedPlanType === type
                    ? 'bg-[#00A8E8] text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => {
            const price = getPlanPrice(plan, selectedPlanType);
            const savings = getPlanSavings(plan, selectedPlanType);
            const isCurrent = isCurrentPlan(plan.name, selectedPlanType);
            const isPopular = plan.plans.find(p => p.type === selectedPlanType)?.popular;

            return (
              <div
                key={plan.name}
                className={`glass rounded-xl p-6 border-2 transition-all duration-300 ${
                  isPopular 
                    ? 'border-[#00A8E8] ring-2 ring-[#00A8E8]/20' 
                    : 'border-gray-700 hover:border-gray-600'
                } ${isCurrent ? 'opacity-75' : ''}`}
              >
                {isPopular && (
                  <div className="bg-[#00A8E8] text-white text-center py-1 rounded-t-lg -m-6 mb-6">
                    <span className="text-sm font-semibold">Most Popular</span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <PremiumBadge 
                    planName={plan.name}
                    size="large"
                    className="mb-4"
                  />
                  <h3 className="text-xl font-bold text-white mb-2">{plan.displayName}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{formatCurrency(price)}</span>
                    <span className="text-gray-400 ml-2">/{selectedPlanType}</span>
                    {savings > 0 && (
                      <div className="text-green-400 text-sm mt-1">
                        Save {savings}% with {selectedPlanType} billing
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features && Object.entries(plan.features).map(([feature, enabled]) => {
                    if (!enabled) return null;
                    
                    const featureNames = {
                      unlimitedBids: 'Unlimited Project Bids',
                      prioritySupport: 'Priority Customer Support',
                      advancedAnalytics: 'Advanced Project Analytics',
                      premiumBadge: 'Premium Profile Badge',
                      earlyAccess: 'Early Access to New Features',
                      customProfile: 'Custom Profile Customization',
                      projectBoosting: 'Project Visibility Boosting',
                      teamCollaboration: 'Advanced Team Collaboration'
                    };

                    return (
                      <div key={feature} className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-300 text-sm">{featureNames[feature]}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Limits */}
                {plan.limits && (
                  <div className="bg-[#2A2A2A] rounded-lg p-3 mb-6">
                    <h4 className="text-white font-semibold mb-2">Plan Limits</h4>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div>Max Projects: {plan.limits.maxProjects === -1 ? 'Unlimited' : plan.limits.maxProjects}</div>
                      <div>Max Team Members: {plan.limits.maxTeamMembers === -1 ? 'Unlimited' : plan.limits.maxTeamMembers}</div>
                      <div>Max File Uploads: {plan.limits.maxFileUploads === -1 ? 'Unlimited' : plan.limits.maxFileUploads}</div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handlePlanSelect(plan, selectedPlanType)}
                  disabled={isCurrent || isProcessing}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : isPopular
                      ? 'bg-[#00A8E8] hover:bg-[#0096D6] text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Subscribe ${formatCurrency(price)}/${selectedPlanType}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="glass rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Why Choose Premium?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#00A8E8] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Unlimited Bids</h3>
              <p className="text-gray-400 text-sm">Bid on unlimited projects without restrictions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#00A8E8] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Priority Support</h3>
              <p className="text-gray-400 text-sm">Get help faster with priority customer support</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#00A8E8] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-gray-400 text-sm">Detailed insights into your project performance</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#00A8E8] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Premium Badge</h3>
              <p className="text-gray-400 text-sm">Stand out with a premium profile badge</p>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedPlan && (
          <PaymentModal
            paymentType={PAYMENT_TYPES.SUBSCRIPTION}
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            amount={getPlanPrice(selectedPlan, selectedPlanType)}
            onSuccess={handlePaymentSuccess}
            planName={selectedPlan.name}
            planType={selectedPlanType}
          />
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
