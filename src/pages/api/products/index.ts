import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongodb';
import Product from '../../../models/Product';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    await connectDB();

    const {
      page = '1',
      limit = '12',
      category,
      search,
      sort = 'createdAt',
      order = 'desc',
      minPrice,
      maxPrice,
      isFeatured,
      isOnSale
    } = req.query;

    // Build filter object
    const filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      // Only search the first word of the product name
      const searchTerm = (search as string).trim();
      
      // Escape special regex characters for safety
      const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Only match at the start of the product name (first word only)
      const nameFirstWordRegex = new RegExp(`^${escapedSearchTerm}`, 'i');
      
      filter.name = nameFirstWordRegex;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (isFeatured === 'true') {
      filter.isFeatured = true;
    }

    if (isOnSale === 'true') {
      filter.isOnSale = true;
    }

    // Build sort object
    const sortObj: any = {};
    if (sort === 'price') {
      sortObj.price = order === 'asc' ? 1 : -1;
    } else if (sort === 'rating') {
      sortObj.rating = order === 'asc' ? 1 : -1;
    } else if (sort === 'name') {
      sortObj.name = order === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = order === 'asc' ? 1 : -1;
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-specifications -tags -weight -dimensions') // Exclude heavy fields for listing
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts: total,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}
