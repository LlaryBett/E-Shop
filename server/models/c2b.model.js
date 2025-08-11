// models/c2b.model.js
import mongoose from 'mongoose';

const c2bUrlSchema = new mongoose.Schema({
  shortCode: { type: String, required: true },
  confirmationURL: { type: String, required: true },
  validationURL: { type: String, required: true },
  response: { type: mongoose.Schema.Types.Mixed }, // Raw API response
  registeredAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

export const C2BURL = mongoose.model('C2BURL', c2bUrlSchema);