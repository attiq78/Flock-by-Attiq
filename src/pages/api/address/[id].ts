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

  const { id } = req.query;

  try {
    await connectDB();
    const userId = authenticateUser(req);

    if (req.method === 'GET') {
      // Get specific address
      const address = await UserAddress.findOne({ _id: id, user: userId }).lean();

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      res.status(200).json({
        success: true,
        data: address
      });
    } else if (req.method === 'PUT') {
      // Update address
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

      const updatedAddress = await UserAddress.findOneAndUpdate(
        { _id: id, user: userId },
        {
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
        },
        { new: true, runValidators: true }
      );

      if (!updatedAddress) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedAddress
      });
    } else if (req.method === 'DELETE') {
      // Delete address
      const deletedAddress = await UserAddress.findOneAndDelete({ _id: id, user: userId });

      if (!deletedAddress) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Address deleted successfully'
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Address API error:', error);
    if (error.message === 'No token provided' || error.message.includes('jwt')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
