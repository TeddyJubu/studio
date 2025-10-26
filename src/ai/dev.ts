import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-customer-inquiry.ts';
import '@/ai/flows/parse-booking-details.ts';
import '@/ai/flows/generate-avatar.ts';
