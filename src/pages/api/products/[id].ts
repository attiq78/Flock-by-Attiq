import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongodb';
import Product from '../../../models/Product';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json');
  
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      await connectDB();

      const product = await Product.findOne({ 
        _id: id, 
        isActive: true 
      }).lean();

      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: 'Product not found' 
        });
      }

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Product API error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
