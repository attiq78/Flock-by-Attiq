import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongodb';
import UserAddress from '../../../models/UserAddress';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateUser = (req: NextApiRequest) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return decoded.userId;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json');

  try {
    console.log('Address API called:', req.method);
    await connectDB();
    console.log('Database connected successfully');
    const userId = authenticateUser(req);
    console.log('User authenticated:', userId);

    if (req.method === 'GET') {
      // Get all addresses for user
      const addresses = await UserAddress.find({ user: userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: addresses
      });
    } else if (req.method === 'POST') {
      // Create new address
      const {
        fullName,
        phoneNumber,
        building,
        colony,
        province,
        city,
        area,
        address,
        label,
        isDefault
      } = req.body;

      // Validate required fields
      if (!fullName || !phoneNumber || !building || !colony || !province || !city || !area || !address) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      const newAddress = new UserAddress({
        user: userId,
        fullName,
        phoneNumber,
        building,
        colony,
        province,
        city,
        area,
        address,
        label: label || 'HOME',
        isDefault: isDefault || false
      });

      await newAddress.save();

      res.status(201).json({
        success: true,
        data: newAddress
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Address API error:', error);
    if ((error as any).message === 'No token provided' || (error as any).message.includes('jwt')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Handle validation errors
    if ((error as any).name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  }
}
