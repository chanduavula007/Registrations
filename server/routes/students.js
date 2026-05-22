const express  = require('express');
const router   = express.Router();
const ExcelJS  = require('exceljs');
const Student  = require('../models/Student');
const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// PUBLIC — POST /api/students  (student self-register)
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({
      success: true,
      message: 'Student registered successfully!',
      data: {
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `A student with this ${field} already exists.` });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// ADMIN ONLY — GET /api/students  (list all)
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { search = '', department = '', program = '', year = '' } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName:  { $regex: search, $options: 'i' } },
        { lastName:   { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { studentId:  { $regex: search, $options: 'i' } },
      ];
    }
    if (department) query.department = department;
    if (program)    query.program    = program;
    if (year)       query.enrollmentYear = year;

    const students = await Student.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// ADMIN ONLY — GET /api/students/export/excel
// ─────────────────────────────────────────────
router.get('/export/excel', protect, async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    const workbook  = new ExcelJS.Workbook();
    workbook.creator = 'Student Registration System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Students', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // ── Column definitions ──
    sheet.columns = [
      { header: 'Student ID',       key: 'studentId',      width: 18 },
      { header: 'First Name',       key: 'firstName',      width: 16 },
      { header: 'Last Name',        key: 'lastName',       width: 16 },
      { header: 'Date of Birth',    key: 'dob',            width: 14 },
      { header: 'Gender',           key: 'gender',         width: 12 },
      { header: 'Nationality',      key: 'nationality',    width: 14 },
      { header: 'Email',            key: 'email',          width: 28 },
      { header: 'Phone',            key: 'phone',          width: 16 },
      { header: 'Alt Phone',        key: 'altPhone',       width: 16 },
      { header: 'Address',          key: 'address',        width: 30 },
      { header: 'City',             key: 'city',           width: 14 },
      { header: 'ZIP Code',         key: 'zipCode',        width: 12 },
      { header: 'Enrollment Year',  key: 'enrollmentYear', width: 16 },
      { header: 'Department',       key: 'department',     width: 20 },
      { header: 'Program',          key: 'program',        width: 16 },
      { header: 'Subjects',         key: 'subjects',       width: 30 },
      { header: 'Emergency Name',   key: 'emergencyName',  width: 20 },
      { header: 'Relationship',     key: 'relationship',   width: 14 },
      { header: 'Emergency Phone',  key: 'emergencyPhone', width: 16 },
      { header: 'Registered On',    key: 'createdAt',      width: 20 },
    ];

    // ── Style header row ──
    const headerRow = sheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FF667EEA' },
      };
      cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top:    { style: 'thin' }, bottom: { style: 'thin' },
        left:   { style: 'thin' }, right:  { style: 'thin' },
      };
    });
    headerRow.height = 22;

    // ── Add data rows ──
    students.forEach((s, idx) => {
      const row = sheet.addRow({
        studentId:      s.studentId,
        firstName:      s.firstName,
        lastName:       s.lastName,
        dob:            s.dob ? new Date(s.dob).toLocaleDateString() : '',
        gender:         s.gender,
        nationality:    s.nationality || '',
        email:          s.email,
        phone:          s.phone,
        altPhone:       s.altPhone || '',
        address:        s.address,
        city:           s.city,
        zipCode:        s.zipCode || '',
        enrollmentYear: s.enrollmentYear,
        department:     s.department,
        program:        s.program,
        subjects:       (s.subjects || []).join(', '),
        emergencyName:  s.emergencyName,
        relationship:   s.relationship,
        emergencyPhone: s.emergencyPhone,
        createdAt:      new Date(s.createdAt).toLocaleString(),
      });

      // Alternate row shading
      const bgColor = idx % 2 === 0 ? 'FFFAFAFA' : 'FFF0F4FF';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { vertical: 'middle', wrapText: false };
        cell.border = {
          top:    { style: 'hair' }, bottom: { style: 'hair' },
          left:   { style: 'hair' }, right:  { style: 'hair' },
        };
      });
      row.height = 18;
    });

    // ── Auto-filter ──
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to:   { row: 1, column: sheet.columns.length },
    };

    // ── Freeze header ──
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // ── Send file ──
    const filename = `students_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate Excel file.' });
  }
});

// ─────────────────────────────────────────────
// ADMIN ONLY — GET /api/students/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// ADMIN ONLY — DELETE /api/students/:id
// ─────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, message: 'Student deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
