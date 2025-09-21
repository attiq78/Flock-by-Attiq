import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Truck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Debug: Log the environment variable
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Fallback key if environment variable is not working
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51S9XVtEdFVqgWbUB9GViPAch0OybNh81T363dQC5JS8m9VkrluOUtI5kN8fefmSieoPzXPU3VxKZhI6vWsK6eSin002WAqRjx2';

const stripePromise = STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

interface PaymentFormProps {
  amount: number;
  addressId: string;
  onPaymentSuccess: (paymentMethod: string, paymentIntentId?: string) => void;
  onPaymentError: (error: string) => void;
}

const PaymentFormComponent: React.FC<PaymentFormProps> = ({
  amount,
  addressId,
  onPaymentSuccess,
  onPaymentError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');

  const handleCardPayment = async () => {
    if (!stripe || !elements) {
      onPaymentError('Stripe is not available. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount,
          addressId
        })
      });

      const { clientSecret } = await response.json();

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        onPaymentError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        onPaymentSuccess('card', paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCODPayment = () => {
    onPaymentSuccess('cod');
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Payment */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              paymentMethod === 'card'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setPaymentMethod('card')}
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">Credit/Debit Card</h4>
                <p className="text-sm text-gray-600">Visa, Mastercard, American Express</p>
              </div>
            </div>
          </div>

          {/* Cash on Delivery */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              paymentMethod === 'cod'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setPaymentMethod('cod')}
          >
            <div className="flex items-center space-x-3">
              <Truck className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">Cash on Delivery</h4>
                <p className="text-sm text-gray-600">Pay when your order arrives</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Card Details</h4>
          <div className="p-4 border border-gray-300 rounded-lg">
            <CardElement options={cardElementOptions} />
          </div>
          <button
            onClick={handleCardPayment}
            disabled={!stripe || loading}
            className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </button>
        </div>
      )}

      {/* Cash on Delivery */}
      {paymentMethod === 'cod' && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Truck className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-800">Cash on Delivery</h4>
            </div>
            <p className="text-sm text-green-700">
              You will pay ${amount.toFixed(2)} when your order is delivered to your address.
            </p>
          </div>
          <button
            onClick={handleCODPayment}
            className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <Truck className="h-5 w-5 mr-2" />
            Place Order (Cash on Delivery)
          </button>
        </div>
      )}
    </div>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  if (!stripePromise) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Stripe is not configured. Please contact support.</p>
        <p className="text-sm text-red-500 mt-2">
          Debug: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'undefined'}
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormComponent {...props} />
    </Elements>
  );
};

export default PaymentForm;
