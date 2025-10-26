import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-customer-inquiry.ts';
import '@/ai/flows/intelligent-appointment-parsing.ts';
import '@/ai/flows/get-available-slots.ts';
import '@/ai/flows/generate-avatar.ts';
