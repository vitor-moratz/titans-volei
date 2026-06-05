import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['mensalista', 'quadra'],
      default: 'mensalista',
      required: true,
    },
    playerName: { type: String, trim: true, default: '' }, // required only for 'mensalista'
    month: { type: String, required: true },
    year: { type: Number, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true }, // Cloudinary secure_url
    cloudinaryId: { type: String, default: '' }, // Cloudinary public_id
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ['pendente', 'confirmado', 'rejeitado'],
      default: 'pendente',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
