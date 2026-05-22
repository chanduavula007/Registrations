const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    // Personal
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    dob:         { type: Date,   required: true },
    gender:      { type: String, required: true, enum: ['male', 'female', 'other', 'prefer_not'] },
    nationality: { type: String, trim: true, default: '' },

    // Contact
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:    { type: String, required: true, trim: true },
    altPhone: { type: String, trim: true, default: '' },
    address:  { type: String, required: true, trim: true },
    city:     { type: String, required: true, trim: true },
    zipCode:  { type: String, trim: true, default: '' },

    // Academic
    studentId:      { type: String, unique: true },
    enrollmentYear: { type: String, required: true },
    department:     { type: String, required: true },
    program:        { type: String, required: true },
    subjects:       { type: [String], default: [] },

    // Emergency
    emergencyName:  { type: String, required: true, trim: true },
    relationship:   { type: String, required: true },
    emergencyPhone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Auto-generate studentId before saving
studentSchema.pre('save', function (next) {
  if (!this.studentId) {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    this.studentId = `STU-${year}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
