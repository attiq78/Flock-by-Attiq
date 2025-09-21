import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Product from '../../../models/Product';
import User from '../../../models/User';

// Authentication middleware
const authenticateUser = (req: NextApiRequest): string | null => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    await connectDB();

    const userId = authenticateUser(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get analytics data
    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      ordersByCategory,
      recentOrders,
      ordersByStatus
    ] = await Promise.all([
      // Total orders count
      Order.countDocuments(),
      
      // Total revenue
      Order.aggregate([
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      
      // Total users count
      User.countDocuments(),
      
      // Total products count
      Product.countDocuments(),
      
      // Orders by category
      Order.aggregate([
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $group: { _id: '$product.category', count: { $sum: 1 }, revenue: { $sum: '$items.price' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Recent orders
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber total orderStatus paymentStatus createdAt user')
        .lean(),
      
      // Orders by status
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ])
    ]);

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0;

    // Format analytics data
    const analytics = {
      overview: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalUsers,
        totalProducts,
        averageOrderValue: Math.round(avgOrderValue * 100) / 100
      },
      categories: ordersByCategory.map(cat => ({
        name: cat._id,
        orders: cat.count,
        revenue: Math.round(cat.revenue * 100) / 100
      })),
      recentOrders: recentOrders.map(order => ({
        orderNumber: order.orderNumber,
        customer: order.user?.name || 'Unknown',
        amount: order.total,
        status: order.orderStatus,
        date: order.createdAt
      })),
      orderStatus: ordersByStatus.map(status => ({
        status: status._id,
        count: status.count
      }))
    };

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  }
}
