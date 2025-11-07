import { z } from 'zod';

export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message must be less than 5000 characters'),
});

export const profileSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  
  bio: z.string()
    .trim()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  
  hobbies: z.array(
    z.string().trim().max(50, 'Each hobby must be less than 50 characters')
  ).max(20, 'You can add up to 20 hobbies'),
});

export const hobbySchema = z.string()
  .trim()
  .min(1, 'Hobby cannot be empty')
  .max(50, 'Hobby must be less than 50 characters');
