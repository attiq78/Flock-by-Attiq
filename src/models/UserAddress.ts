import mongoose, { Document, Schema } from 'mongoose';

export interface IUserAddress extends Document {
  user: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const UserAddressSchema = new Schema<IUserAddress>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot be more than 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        // Remove all non-digit characters for validation
        const digitsOnly = v.replace(/\D/g, '');
        // Check if it's between 10-15 digits
        return digitsOnly.length >= 10 && digitsOnly.length <= 15;
      },
      message: 'Please enter a valid phone number (10-15 digits)'
    }
  },
  building: {
    type: String,
    required: [true, 'Building/House number is required'],
    trim: true,
    maxlength: [200, 'Building address cannot be more than 200 characters']
  },
  colony: {
    type: String,
    required: [true, 'Colony/Suburb is required'],
    trim: true,
    maxlength: [200, 'Colony cannot be more than 200 characters']
  },
  province: {
    type: String,
    required: [true, 'Province is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot be more than 500 characters']
  },
  label: {
    type: String,
    required: [true, 'Address label is required'],
    enum: ['HOME', 'OFFICE'],
    default: 'HOME'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
UserAddressSchema.index({ user: 1 });
UserAddressSchema.index({ user: 1, isDefault: 1 });

// Ensure only one default address per user
UserAddressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await (this.constructor as any).updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export default mongoose.models.UserAddress || mongoose.model<IUserAddress>('UserAddress', UserAddressSchema);
