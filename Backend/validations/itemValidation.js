import Joi from 'joi';

export const itemValidationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  quantity: Joi.number().min(0).required(),
  price: Joi.number().min(0).required(),
  imageURL: Joi.string().uri().optional(),
  description:Joi.string().optional(),
  category: Joi.string().min(2).max(50).required()
});
