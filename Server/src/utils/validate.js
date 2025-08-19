import Joi from 'joi';
import { ApiError } from './error.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new ApiError(400, errorMessage));
    }
    
    req.body = value;
    next();
  };
};

// Payment validation schemas
export const bidFeeSchema = Joi.object({
  projectId: Joi.string().required(),
  bidId: Joi.string().required()
});

export const listingFeeSchema = Joi.object({
  projectId: Joi.string().required()
});

export const bonusSchema = Joi.object({
  projectId: Joi.string().required(),
  contributorsCount: Joi.number().integer().min(1).required()
});

export const subscriptionSchema = Joi.object({
  planType: Joi.string().valid('monthly', 'yearly').default('monthly')
});

export const withdrawalSchema = Joi.object({
  amount: Joi.number().positive().max(10000).required()
});

export const webhookSchema = Joi.object({
  id: Joi.string().required(),
  event: Joi.string().required(),
  payload: Joi.object().required()
});

export const completeProjectSchema = Joi.object({
  projectId: Joi.string().required()
});
