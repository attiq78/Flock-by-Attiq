import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import UserAddress from '../../../models/UserAddress';
import Cart from '../../../models/Cart';
import Product from '../../../models/Product';
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

    const { addressId, paymentMethod, stripePaymentIntentId } = req.body;

    if (!addressId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Address ID and payment method are required'
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name price images')
      .lean();

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Get shipping address
    const address = await UserAddress.findOne({ _id: addressId, user: userId });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Calculate totals
    const subtotal = cart.totalPrice;
    const shippingFee = subtotal >= 50 ? 0 : 5;
    const tax = subtotal * 0.1;
    const total = subtotal + shippingFee + tax;

    // Create order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      name: item.product.name,
      image: item.product.images[0] || '/placeholder-product.jpg'
    }));

    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        phoneNumber: address.phoneNumber,
        building: address.building,
        colony: address.colony,
        province: address.province,
        city: address.city,
        area: address.area,
        address: address.address,
        label: address.label
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      orderStatus: 'pending',
      subtotal,
      shippingFee,
      tax,
      total,
      stripePaymentIntentId: paymentMethod === 'card' ? stripePaymentIntentId : undefined
    });

    await order.save();

    // Clear cart after successful order
    await Cart.findOneAndDelete({ user: userId });

    res.status(201).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Order creation error:', error);
    if (error.message === 'No token provided' || error.message.includes('jwt')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
