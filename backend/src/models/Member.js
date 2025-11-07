import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema(
  {
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    name: { type: String, required: true },
    gmail: { type: String, default: null },
    photoUrl: { type: String, default: null },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    dateOfBirth: { type: Date, default: null },
    spouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    parentIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Member', default: [] },
    childIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Member', default: [] }
  },
  { timestamps: true }
);

export const Member = mongoose.model('Member', MemberSchema);


