import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  User, 
  LogOut,
  MapPin,
  Phone,
  Home,
  Building,
  CreditCard,
  Truck,
  Check,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentForm from '../../components/PaymentForm';

interface UserAddress {
  _id: string;
  fullName: string;
  phoneNumber: string;
  building: string;
  colony: string;
  province: string;
  city: string;
  area: string;
  address: string;
  label: 'HOME' | 'OFFICE';
  isDefault: boolean;
}

const Checkout: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { cart, getCartTotal, getShippingFee, getFinalTotal } = useCart();
  const router = useRouter();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Address form state
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    building: '',
    colony: '',
    province: '',
    city: '',
    area: '',
    address: '',
    label: 'HOME' as 'HOME' | 'OFFICE',
    isDefault: false
  });

  // Redirect to login if not authenticated
  React.useEffect(() => {
    // Don't redirect if still loading authentication
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Redirect to cart if empty
  React.useEffect(() => {
    if (cart && cart.items.length === 0) {
      router.push('/cart');
    }
  }, [cart, router]);

  // Fetch user addresses
  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/address', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data.data);
        
        // Select default address if available
        const defaultAddress = data.data.find((addr: UserAddress) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress._id);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Address saved successfully!');
        setAddresses([...addresses, data.data]);
        setSelectedAddress(data.data._id);
        setShowAddressForm(false);
        setFormData({
          fullName: '',
          phoneNumber: '',
          building: '',
          colony: '',
          province: '',
          city: '',
          area: '',
          address: '',
          label: 'HOME',
          isDefault: false
        });
      } else {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((error: string) => {
            toast.error(error);
          });
        } else {
          toast.error(data.message || 'Failed to save address');
        }
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Error saving address');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleProceedToPay = () => {
    if (!selectedAddress) {
      toast.error('Please select or add a delivery address');
      return;
    }
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = async (paymentMethod: string, paymentIntentId?: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          addressId: selectedAddress,
          paymentMethod,
          stripePaymentIntentId: paymentIntentId
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Order placed successfully!');
        router.push(`/orders/${data.data._id}`);
      } else {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((error: string) => {
            toast.error(error);
          });
        } else {
          toast.error(data.message || 'Failed to place order');
        }
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Error placing order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !cart || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900">FlockByAttiq</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Orders Link */}
              <Link
                href="/orders"
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="My Orders"
              >
                <ShoppingBag className="h-6 w-6" />
              </Link>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery Information */}
          <div className="lg:col-span-2">
            {!showPaymentForm ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Delivery Information
              </h2>

              {/* Existing Addresses */}
              {addresses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Address</h3>
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address._id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedAddress === address._id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAddress(address._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              {address.label === 'HOME' ? (
                                <Home className="h-4 w-4 mr-2 text-orange-500" />
                              ) : (
                                <Building className="h-4 w-4 mr-2 text-teal-500" />
                              )}
                              <span className="font-medium text-gray-900">{address.fullName}</span>
                              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                {address.label}
                              </span>
                              {address.isDefault && (
                                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-1">{address.phoneNumber}</p>
                            <p className="text-gray-600 text-sm">
                              {address.building}, {address.colony}, {address.area}, {address.city}, {address.province}
                            </p>
                          </div>
                          {selectedAddress === address._id && (
                            <Check className="h-5 w-5 text-purple-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Address Button */}
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-colors"
              >
                + Add New Address
              </button>

              {/* Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                        placeholder="Enter your first and last name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                        placeholder="Please enter your phone number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Building / House No / Floor / Street *
                    </label>
                    <input
                      type="text"
                      name="building"
                      value={formData.building}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="Please enter"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Colony / Suburb / Locality / Landmark *
                    </label>
                    <input
                      type="text"
                      name="colony"
                      value={formData.colony}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="Please enter"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Province *
                      </label>
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="">Please choose your province</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Sindh">Sindh</option>
                        <option value="KPK">KPK</option>
                        <option value="Balochistan">Balochistan</option>
                        <option value="Islamabad">Islamabad</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="">Please choose your city</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Faisalabad">Faisalabad</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area *
                      </label>
                      <select
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="">Please choose your area</option>
                        <option value="Gulberg">Gulberg</option>
                        <option value="DHA">DHA</option>
                        <option value="Clifton">Clifton</option>
                        <option value="North Nazimabad">North Nazimabad</option>
                        <option value="Gulshan">Gulshan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="For Example: House# 123, Street# 123, ABC Road"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select a label for effective delivery:
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, label: 'HOME' }))}
                        className={`px-4 py-2 border-2 rounded-lg transition-colors ${
                          formData.label === 'HOME'
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-300 text-gray-600 hover:border-orange-300'
                        }`}
                      >
                        <Home className="h-4 w-4 inline mr-2" />
                        HOME
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, label: 'OFFICE' }))}
                        className={`px-4 py-2 border-2 rounded-lg transition-colors ${
                          formData.label === 'OFFICE'
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-300 text-gray-600 hover:border-teal-300'
                        }`}
                      >
                        <Building className="h-4 w-4 inline mr-2" />
                        OFFICE
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                      Set as default address
                    </label>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'SAVE'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
            ) : (
              /* Payment Form */
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment
                  </h2>
                </div>
                
                <PaymentForm
                  amount={getFinalTotal()}
                  addressId={selectedAddress}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900">Items Total ({cart.totalItems} items)</span>
                  <span className="font-medium text-gray-900">{formatPrice(cart.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900">Delivery Fee</span>
                  <span className={`font-medium ${getShippingFee() === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {getShippingFee() === 0 ? 'Free' : formatPrice(getShippingFee())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900">Tax</span>
                  <span className="font-medium text-gray-900">{formatPrice(cart.totalPrice * 0.1)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(getFinalTotal())}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPay}
                disabled={!selectedAddress}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors mb-4 ${
                  selectedAddress
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CreditCard className="h-5 w-5 inline mr-2" />
                {showPaymentForm ? 'Back to Address' : 'Proceed to Pay'}
              </button>

              <div className="flex items-center text-sm text-gray-600">
                <Truck className="h-4 w-4 mr-2" />
                <span>
                  {cart.totalPrice >= 50 
                    ? 'You qualify for free shipping!' 
                    : `Add ${formatPrice(50 - cart.totalPrice)} more for free shipping`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
