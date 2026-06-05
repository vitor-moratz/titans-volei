import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    playerName: { type: String, required: true, trim: true },
    paymentType: { type: String, enum: ['mensal', 'avulso'], default: 'mensal' },
    hasPaid: { type: Boolean, default: false },
    isSubstitute: { type: Boolean, default: false },
    substituteFor:   { type: String, default: '', trim: true },
    comprovantePath:      { type: String, default: null },
    comprovanteId:        { type: String, default: null },
    comprovantePaymentId: { type: String, default: null },
  },
  { timestamps: true }
);

// Prevent duplicate player in same session
attendanceSchema.index({ session: 1, playerName: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
