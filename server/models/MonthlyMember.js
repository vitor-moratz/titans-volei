import mongoose from 'mongoose';

const monthlyMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    hasPaid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    comprovantePath:      { type: String, default: null },
    comprovanteId:        { type: String, default: null },
    comprovantePaymentId: { type: String, default: null },
  },
  { timestamps: true }
);

// Unique per (name, month, year)
monthlyMemberSchema.index({ name: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('MonthlyMember', monthlyMemberSchema);
