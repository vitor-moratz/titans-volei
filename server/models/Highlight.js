import mongoose from 'mongoose';

const HighlightSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    fileName: { type: String, required: true },
    filePath: { type: String, required: true }, // Cloudinary secure_url
    cloudinaryId: { type: String, default: '' }, // Cloudinary public_id
    mimeType: { type: String, required: true },
    description: { type: String, trim: true, default: '' },
    playerName: { type: String, trim: true, default: '' },
    category: { type: String, enum: ['jogada', 'comedia'], default: 'jogada' },
  },
  { timestamps: true }
);

export default mongoose.model('Highlight', HighlightSchema);
