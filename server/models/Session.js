import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    dateStr: { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
    date: { type: Date, required: true },                    // stored at noon UTC
    isHoliday: { type: Boolean, default: false },
    holidayName: { type: String, default: '' },
    isCancelled: { type: Boolean, default: false },
    cancelReason: { type: String, default: '' },
    maxPlayers: { type: Number, default: 18 },
    hourlyRate: { type: Number, default: 90 },   // R$/h
    durationHours: { type: Number, default: 2 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
