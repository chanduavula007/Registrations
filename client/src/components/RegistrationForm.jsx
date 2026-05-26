import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import './RegistrationForm.css'

const INITIAL = {
  firstName: '', lastName: '', dob: '', gender: '', nationality: '',
  email: '', phone: '', altPhone: '', address: '', city: '', zipCode: '',
  studentId: '', enrollmentYear: '', department: '', program: '', subjects: [],
  emergencyName: '', relationship: '', emergencyPhone: '',
  terms: false,
}

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics']

// ── Field wrapper — defined OUTSIDE component to prevent cursor jump ──
function FormField({ id, label, required, hint, error, children }) {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {error && <span className="err">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  )
}

export default function RegistrationForm({ onRegistered }) {
  const [form, setForm]     = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [apiMsg, setApiMsg] = useState('')
  const [modal, setModal]   = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox' && name === 'subjects') {
      setForm(f => ({
        ...f,
        subjects: checked ? [...f.subjects, value] : f.subjects.filter(s => s !== value),
      }))
    } else if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: checked }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.firstName.trim())      e.firstName      = 'First name is required.'
    if (!form.lastName.trim())       e.lastName       = 'Last name is required.'
    if (!form.dob)                   e.dob            = 'Date of birth is required.'
    if (!form.gender)                e.gender         = 'Please select a gender.'
    if (!form.email.trim())          e.email          = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.'
    if (!form.phone.trim())          e.phone          = 'Phone number is required.'
    if (!form.address.trim())        e.address        = 'Address is required.'
    if (!form.city.trim())           e.city           = 'City is required.'
    if (!form.enrollmentYear)        e.enrollmentYear = 'Please select a year.'
    if (!form.department)            e.department     = 'Please select a department.'
    if (!form.program)               e.program        = 'Please select a program.'
    if (!form.emergencyName.trim())  e.emergencyName  = 'Emergency contact name is required.'
    if (!form.relationship)          e.relationship   = 'Please select a relationship.'
    if (!form.emergencyPhone.trim()) e.emergencyPhone = 'Emergency phone is required.'
    if (!form.terms)                 e.terms          = 'You must agree to the terms.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      const firstKey = Object.keys(errs)[0]
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setStatus('loading')
    try {
      const res  = await api.post('/api/students', form)
      const data = res.data
      if (data.success) {
        setStatus('success')
        setModal({ studentId: data.data.studentId, name: data.data.name })
        setForm(INITIAL)
        setErrors({})
        onRegistered?.()
      } else {
        setStatus('error')
        setApiMsg(data.message || 'Registration failed.')
      }
    } catch {
      setStatus('error')
      setApiMsg('Cannot connect to server. Make sure the backend is running.')
    }
  }

  const handleReset = () => { setForm(INITIAL); setErrors({}); setStatus(null); setApiMsg('') }

  const cls = (id) => `field ${errors[id] ? 'invalid' : ''}`

  return (
    <div className="rf-container">
      <div className="rf-card">

        {/* Header */}
        <div className="rf-header">
          <div className="rf-logo">🎓</div>
          <h2>Student Registration</h2>
          <p>Fill in the details below to register</p>
          <Link to="/login" className="admin-link">🔐 Admin Login</Link>
        </div>

        {status === 'error' && (
          <div className="banner banner-error">⚠️ {apiMsg}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Personal ── */}
          <section className="rf-section">
            <h3 className="section-title">👤 Personal Information</h3>
            <div className="row-2">
              <FormField id="firstName" label="First Name" required error={errors.firstName}>
                <input id="firstName" name="firstName" className={cls('firstName')}
                  value={form.firstName} onChange={handleChange} placeholder="First name" />
              </FormField>
              <FormField id="lastName" label="Last Name" required error={errors.lastName}>
                <input id="lastName" name="lastName" className={cls('lastName')}
                  value={form.lastName} onChange={handleChange} placeholder="Last name" />
              </FormField>
            </div>
            <div className="row-2">
              <FormField id="dob" label="Date of Birth" required error={errors.dob}>
                <input id="dob" name="dob" type="date" className={cls('dob')}
                  value={form.dob} onChange={handleChange} />
              </FormField>
              <FormField id="gender" label="Gender" required error={errors.gender}>
                <select id="gender" name="gender" className={cls('gender')}
                  value={form.gender} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not">Prefer not to say</option>
                </select>
              </FormField>
            </div>
            <FormField id="nationality" label="Nationality" error={errors.nationality}>
              <input id="nationality" name="nationality" className="field"
                value={form.nationality} onChange={handleChange} placeholder="Nationality" />
            </FormField>
          </section>

          {/* ── Contact ── */}
          <section className="rf-section">
            <h3 className="section-title">📞 Contact Information</h3>
            <FormField id="email" label="Email Address" required error={errors.email}>
              <input id="email" name="email" type="email" className={cls('email')}
                value={form.email} onChange={handleChange} placeholder="example@email.com" />
            </FormField>
            <div className="row-2">
              <FormField id="phone" label="Phone Number" required error={errors.phone}>
                <input id="phone" name="phone" type="tel" className={cls('phone')}
                  value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              </FormField>
              <FormField id="altPhone" label="Alternate Phone" error={errors.altPhone}>
                <input id="altPhone" name="altPhone" type="tel" className="field"
                  value={form.altPhone} onChange={handleChange} placeholder="+91 98765 43210" />
              </FormField>
            </div>
            <FormField id="address" label="Address" required error={errors.address}>
              <textarea id="address" name="address" className={cls('address')} rows={3}
                value={form.address} onChange={handleChange} placeholder="Full address" />
            </FormField>
            <div className="row-2">
              <FormField id="city" label="City" required error={errors.city}>
                <input id="city" name="city" className={cls('city')}
                  value={form.city} onChange={handleChange} placeholder="City" />
              </FormField>
              <FormField id="zipCode" label="ZIP / Postal Code" error={errors.zipCode}>
                <input id="zipCode" name="zipCode" className="field"
                  value={form.zipCode} onChange={handleChange} placeholder="ZIP Code" />
              </FormField>
            </div>
          </section>

          {/* ── Academic ── */}
          <section className="rf-section">
            <h3 className="section-title">🎓 Academic Information</h3>
            <div className="row-2">
              <FormField id="studentId" label="Student ID" hint="Auto-generated if left blank" error={errors.studentId}>
                <input id="studentId" name="studentId" className="field"
                  value={form.studentId} onChange={handleChange} placeholder="Optional" />
              </FormField>
              <FormField id="enrollmentYear" label="Enrollment Year" required error={errors.enrollmentYear}>
                <select id="enrollmentYear" name="enrollmentYear" className={cls('enrollmentYear')}
                  value={form.enrollmentYear} onChange={handleChange}>
                  <option value="">-- Select Year --</option>
                  {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </FormField>
            </div>
            <div className="row-2">
              <FormField id="department" label="Department" required error={errors.department}>
                <select id="department" name="department" className={cls('department')}
                  value={form.department} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="cs">Computer Science</option>
                  <option value="ee">Electrical Engineering</option>
                  <option value="me">Mechanical Engineering</option>
                  <option value="ce">Civil Engineering</option>
                  <option value="ba">Business Administration</option>
                  <option value="med">Medicine</option>
                  <option value="law">Law</option>
                  <option value="arts">Arts & Humanities</option>
                </select>
              </FormField>
              <FormField id="program" label="Program" required error={errors.program}>
                <select id="program" name="program" className={cls('program')}
                  value={form.program} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="bachelor">Bachelor's Degree</option>
                  <option value="master">Master's Degree</option>
                  <option value="phd">PhD</option>
                  <option value="diploma">Diploma</option>
                  <option value="certificate">Certificate</option>
                </select>
              </FormField>
            </div>
            <div className="form-group">
              <label>Subjects of Interest</label>
              <div className="checkbox-group">
                {SUBJECTS.map(s => (
                  <label key={s} className="cb-label">
                    <input type="checkbox" name="subjects" value={s}
                      checked={form.subjects.includes(s)} onChange={handleChange} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* ── Emergency ── */}
          <section className="rf-section">
            <h3 className="section-title">🚨 Emergency Contact</h3>
            <div className="row-2">
              <FormField id="emergencyName" label="Contact Name" required error={errors.emergencyName}>
                <input id="emergencyName" name="emergencyName" className={cls('emergencyName')}
                  value={form.emergencyName} onChange={handleChange} placeholder="Full name" />
              </FormField>
              <FormField id="relationship" label="Relationship" required error={errors.relationship}>
                <select id="relationship" name="relationship" className={cls('relationship')}
                  value={form.relationship} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="parent">Parent</option>
                  <option value="guardian">Guardian</option>
                  <option value="sibling">Sibling</option>
                  <option value="spouse">Spouse</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
            </div>
            <FormField id="emergencyPhone" label="Emergency Phone" required error={errors.emergencyPhone}>
              <input id="emergencyPhone" name="emergencyPhone" type="tel" className={cls('emergencyPhone')}
                value={form.emergencyPhone} onChange={handleChange} placeholder="+91 98765 43210" />
            </FormField>
          </section>

          {/* ── Terms ── */}
          <section className="rf-section">
            <div className="form-group">
              <label className="cb-label terms-label">
                <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} />
                I agree to the <a href="#" className="link">Terms and Conditions</a> and{' '}
                <a href="#" className="link">Privacy Policy</a>
              </label>
              {errors.terms && <span className="err">{errors.terms}</span>}
            </div>
          </section>

          {/* ── Actions ── */}
          <div className="rf-actions">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
            <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? '⏳ Registering...' : '🚀 Register Now'}
            </button>
          </div>

        </form>
      </div>

      {/* Success Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">✅</div>
            <h2>Registration Successful!</h2>
            <p>Welcome, <strong>{modal.name}</strong>!</p>
            <p className="student-id-badge">🪪 Student ID: <strong>{modal.studentId}</strong></p>
            <p className="modal-sub">Your details have been saved to the database.</p>
            <button className="btn btn-primary" onClick={() => setModal(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
