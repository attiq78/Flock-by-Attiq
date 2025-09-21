import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectDB from '../../../lib/mongodb';
import UserAddress from '../../../models/UserAddress';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Fallback Stripe key if environment variable is not working
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51S9XVtEdFVqgWbUBYWe9djPs6wATpV0eoG381PWz2HwlQb182pQ4lWkemSUji4urdEa8ChEBXDxQnQmSt3u7buAG00THVAf7Ua';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const authenticateUser = (req: NextApiRequest) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return decoded.userId;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    await connectDB();
    const userId = authenticateUser(req);

    const { amount, addressId } = req.body;

    if (!amount || !addressId) {
      return res.status(400).json({
        success: false,
        message: 'Amount and address ID are required'
      });
    }

    // Verify address belongs to user
    const address = await UserAddress.findOne({ _id: addressId, user: userId });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: userId,
        addressId: addressId
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    if (error.message === 'No token provided' || error.message.includes('jwt')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment request',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
