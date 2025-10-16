
import { StripePlan } from '../interfaces/stripe-plan.interface';

export const STRIPE_PLANS: StripePlan[] = [
  {
    id: 'price_starter_monthly',
    name: 'Starter',
    description: '30,000 words/month, 750 words/request',
    amount: 1200, // cents ($12)
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    metadata: {
      wordsPerMonth: '30000',
      wordsPerRequest: '750',
      features: 'Advanced Humanization Engine, Generate Human-like Text, Plagiarism-Free Content, Built-in AI Detector, Quality and Error-Free, 80+ Languages Supported, ChatGPT Watermark Removal',
    },
    productId: 'prod_starter',
  },
  {
    id: 'price_pro_monthly',
    name: 'Pro',
    description: '70,000 words/month, 1,500 words/request',
    amount: 2300, // cents ($23)
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    metadata: {
      wordsPerMonth: '70000',
      wordsPerRequest: '1500',
      features: 'Advanced Humanization Engine, Generate Human-like Text, Plagiarism-Free Content, Built-in AI Detector, Quality and Error-Free, 80+ Languages Supported, ChatGPT Watermark Removal',
    },
    productId: 'prod_pro',
  },
  {
    id: 'price_unlimited_monthly',
    name: 'Unlimited',
    description: 'Unlimited words/month, 2,000 words/request',
    amount: 4700, // cents ($47)
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    metadata: {
      wordsPerMonth: 'unlimited',
      wordsPerRequest: '2000',
      features: 'Advanced Humanization Engine, Generate Human-like Text, Plagiarism-Free Content, Built-in AI Detector, Quality and Error-Free, 80+ Languages Supported, ChatGPT Watermark Removal',
    },
    productId: 'prod_unlimited',
  },
];