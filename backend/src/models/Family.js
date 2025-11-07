import mongoose from 'mongoose';

const FamilySchema = new mongoose.Schema(
  {
    familyName: { type: String, required: true },
    ownerGmail: { type: String, required: true, index: true },
    admins: { type: [String], default: [] },
    approvedUsers: { type: [String], default: [] },
    isPaid: { type: Boolean, default: false },
    paymentDueDate: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Family = mongoose.model('Family', FamilySchema);


