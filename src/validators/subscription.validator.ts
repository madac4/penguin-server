import { z } from 'zod';

export const grantSubscriptionSchema = z.object({
  planId: z.string().min(1, 'planId is required'),
});

export type GrantSubscriptionInput = z.infer<typeof grantSubscriptionSchema>;
