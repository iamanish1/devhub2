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
  projectId: Joi.string().optional(), // Optional for new projects
  contributorsCount: Joi.number().integer().min(1).required(),
  projectTitle: Joi.string().optional(), // For new projects
  amountPerContributor: Joi.number().integer().min(200).optional(), // For new projects
  isNewProject: Joi.boolean().optional() // For new projects
}).custom((value, helpers) => {
  // For existing projects, projectId is required
  if (value.isNewProject === false && !value.projectId) {
    return helpers.error('any.invalid', { message: 'Project ID is required for existing projects' });
  }
  // For new projects, projectTitle and amountPerContributor are required
  if (value.isNewProject === true && (!value.projectTitle || !value.amountPerContributor)) {
    return helpers.error('any.invalid', { message: 'Project title and amount per contributor are required for new projects' });
  }
  return value;
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
