import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'wechat' | 'alipay';
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  subscriptionType: 'monthly' | 'yearly' | 'lifetime';
  subscriptionDuration: number; // 订阅时长（天）
  wechatPayData?: {
    prepayId?: string;
    transactionId?: string;
    timeEnd?: string;
  };
  alipayData?: {
    tradeNo?: string;
    buyerId?: string;
    gmtPayment?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
}

const PaymentSchema = new Schema<IPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'CNY'
  },
  paymentMethod: {
    type: String,
    enum: ['wechat', 'alipay'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  subscriptionType: {
    type: String,
    enum: ['monthly', 'yearly', 'lifetime'],
    required: true
  },
  subscriptionDuration: {
    type: Number,
    required: true
  },
  wechatPayData: {
    prepayId: String,
    transactionId: String,
    timeEnd: String
  },
  alipayData: {
    tradeNo: String,
    buyerId: String,
    gmtPayment: String
  },
  paidAt: Date
}, {
  timestamps: true
});

// 创建索引
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema); 