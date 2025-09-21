import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images: string[];
    stock: number;
  };
  quantity: number;
  price: number;
}

interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  getCartItemCount: () => number;
  getCartTotal: () => number;
  getShippingFee: () => number;
  getFinalTotal: () => number;
  isInCart: (productId: string) => boolean;
  getCartItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch cart when user logs in
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const cartData = await response.json();
          setCart(cartData.data);
        } else {
          console.error('API returned non-JSON response');
          setCart(null);
        }
      } else if (response.status === 404) {
        // Cart doesn't exist yet, that's okay
        setCart(null);
      } else {
        console.error('Cart API error:', response.status, response.statusText);
        setCart(null);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // If it's a JSON parsing error, the API might be returning HTML
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('API returned invalid JSON - might be returning HTML');
      }
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1): Promise<boolean> => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response');
        toast.error('Server error - please try again');
        return false;
      }

      const data = await response.json();

      if (response.ok) {
        setCart(data.data);
        toast.success('Product added to cart!');
        return true;
      } else {
        toast.error(data.message || 'Failed to add product to cart');
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding product to cart');
      return false;
    }
  };

  const removeFromCart = async (productId: string): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update - remove item immediately
    if (cart) {
      const updatedCart = { ...cart };
      updatedCart.items = updatedCart.items.filter(item => item.product._id !== productId);
      // Recalculate totals
      updatedCart.totalItems = updatedCart.items.reduce((total, item) => total + item.quantity, 0);
      updatedCart.totalPrice = updatedCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      setCart(updatedCart);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();

      if (response.ok) {
        // Update with server response to ensure consistency
        setCart(data.data);
        toast.success('Product removed from cart');
        return true;
      } else {
        // Revert optimistic update on error
        fetchCart();
        toast.error(data.message || 'Failed to remove product from cart');
        return false;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Revert optimistic update on error
      fetchCart();
      toast.error('Error removing product from cart');
      return false;
    }
  };

  const updateQuantity = async (productId: string, quantity: number): Promise<boolean> => {
    if (!user) return false;

    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    // Optimistic update - update UI immediately
    if (cart) {
      const updatedCart = { ...cart };
      const itemIndex = updatedCart.items.findIndex(item => item.product._id === productId);
      
      if (itemIndex !== -1) {
        updatedCart.items[itemIndex].quantity = quantity;
        // Recalculate totals
        updatedCart.totalItems = updatedCart.items.reduce((total, item) => total + item.quantity, 0);
        updatedCart.totalPrice = updatedCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        setCart(updatedCart);
      }
    }

    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce API call by 500ms
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/cart/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId, quantity })
        });

        const data = await response.json();

        if (response.ok) {
          // Update with server response to ensure consistency
          setCart(data.data);
        } else {
          // Revert optimistic update on error
          fetchCart();
          toast.error(data.message || 'Failed to update cart');
        }
      } catch (error) {
        console.error('Error updating cart:', error);
        // Revert optimistic update on error
        fetchCart();
        toast.error('Error updating cart');
      }
    }, 500);

    return true;
  };

  const clearCart = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCart(null);
        toast.success('Cart cleared');
        return true;
      } else {
        toast.error(data.message || 'Failed to clear cart');
        return false;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Error clearing cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCartItemCount = (): number => {
    return cart?.totalItems || 0;
  };

  const getCartTotal = (): number => {
    return cart?.totalPrice || 0;
  };

  const isInCart = (productId: string): boolean => {
    return cart?.items.some(item => item.product._id === productId) || false;
  };

  const getCartItemQuantity = (productId: string): number => {
    const item = cart?.items.find(item => item.product._id === productId);
    return item?.quantity || 0;
  };

  const getShippingFee = (): number => {
    if (!cart) return 0;
    return cart.totalPrice >= 50 ? 0 : 5;
  };

  const getFinalTotal = (): number => {
    if (!cart) return 0;
    const shipping = getShippingFee();
    const tax = cart.totalPrice * 0.1;
    return cart.totalPrice + shipping + tax;
  };

  const value: CartContextType = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal,
    getShippingFee,
    getFinalTotal,
    isInCart,
    getCartItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
