import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import './RegistrationForm.css'

// ─── Constants ───────────────────────────────────────────────────────────────
const INITIAL = {
  firstName: '', lastName: '', dob: '', gender: '', nationality: '',
  email: '', phone: '', altPhone: '', address: '', city: '', zipCode: '',
  studentId: '', enrollmentYear: '', department: '', program: '', subjects: [],
  emergencyName: '', relationship: '', emergencyPhone: '',
  terms: false,
}

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics']

// ─── FormField — MUST be outside component to prevent cursor-jump bug ────────
function FormField({ id, label, required, hint, error, children }) {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label}{required && <span className="req"> *</span>}
      </label>
      {children}
      {error && <span className="err-msg">⚠ {error}</span>}
      {hint && !error && <span className="hint-msg">{hint}</span>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RegistrationForm({ onRegistered }) {
  const [form, setForm]     = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)   // null | 'loading' | 'success' | 'error'
  const [apiMsg, setApiMsg] = useState('')
  const [modal, setModal]   = useState(null)   // { studentId, name }

  // ── Handlers ──────────────────────────────────────────────────────────────
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

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.firstName.trim())      e.firstName      = 'First name is required.'
    if (!form.lastName.trim())       e.lastName       = 'Last name is required.'
    if (!form.dob)                   e.dob            = 'Date of birth is required.'
    if (!form.gender)                e.gender         = 'Please select a gender.'
    if (!form.email.trim())          e.email          = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.phone.trim())          e.phone          = 'Phone number is required.'
    if (!form.address.trim())        e.address        = 'Address is required.'
    if (!form.city.trim())           e.city           = 'City is required.'
    if (!form.enrollmentYear)        e.enrollmentYear = 'Please select an enrollment year.'
    if (!form.department)            e.department     = 'Please select a department.'
    if (!form.program)               e.program        = 'Please select a program.'
    if (!form.emergencyName.trim())  e.emergencyName  = 'Emergency contact name is required.'
    if (!form.relationship)          e.relationship   = 'Please select a relationship.'
    if (!form.emergencyPhone.trim()) e.emergencyPhone = 'Emergency phone is required.'
    if (!form.terms)                 e.terms          = 'You must agree to the terms and conditions.'
    return e
  }

  // ── Submit ────────────────────────────────────────────────────────────────
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
        setApiMsg(data.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setStatus('error')
      const msg = err.response?.data?.message || 'Cannot connect to server. Make sure the backend is running.'
      setApiMsg(msg)
    }
  }

  const handleReset = () => {
    setForm(INITIAL)
    setErrors({})
    setStatus(null)
    setApiMsg('')
  }

  const cls = (id) => `field${errors[id] ? ' invalid' : ''}`

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="rf-page">
      <div className="rf-container">

        {/* ── Header ── */}
        <div className="rf-header">
          <div className="rf-header-top">
            <div className="rf-logo-wrap">
              <span className="rf-logo">🎓</span>
            </div>
            <Link to="/login" className="admin-link">🔐 Admin Login</Link>
          </div>
          <h1 className="rf-title">Student Registration</h1>
          <p className="rf-subtitle">Complete the form below to register as a student</p>
          <div className="rf-steps">
            <span className="step active">Personal</span>
            <span className="step-divider">›</span>
            <span className="step active">Contact</span>
            <span className="step-divider">›</span>
            <span className="step active">Academic</span>
            <span className="step-divider">›</span>
            <span className="step active">Emergency</span>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {status === 'error' && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{apiMsg}</span>
            <button className="alert-close" onClick={() => setStatus(null)}>✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="rf-form">

          {/* ══ SECTION 1: Personal ══ */}
          <div className="rf-section">
            <div className="section-header">
              <div className="section-icon">👤</div>
              <div>
                <h2 className="section-title">Personal Information</h2>
                <p className="section-desc">Your basic personal details</p>
              </div>
            </div>
            <div className="section-body">
              <div className="row-2">
                <FormField id="firstName" label="First Name" required error={errors.firstName}>
                  <input id="firstName" name="firstName" className={cls('firstName')}
                    value={form.firstName} onChange={handleChange} placeholder="Enter first name"
                    autoComplete="given-name" />
                </FormField>
                <FormField id="lastName" label="Last Name" required error={errors.lastName}>
                  <input id="lastName" name="lastName" className={cls('lastName')}
                    value={form.lastName} onChange={handleChange} placeholder="Enter last name"
                    autoComplete="family-name" />
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
                    <option value="">-- Select Gender --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not">Prefer not to say</option>
                  </select>
                </FormField>
              </div>
              <FormField id="nationality" label="Nationality" error={errors.nationality}>
                <input id="nationality" name="nationality" className="field"
                  value={form.nationality} onChange={handleChange} placeholder="e.g. Indian, American" />
              </FormField>
            </div>
          </div>

          {/* ══ SECTION 2: Contact ══ */}
          <div className="rf-section">
            <div className="section-header">
              <div className="section-icon">📞</div>
              <div>
                <h2 className="section-title">Contact Information</h2>
                <p className="section-desc">How we can reach you</p>
              </div>
            </div>
            <div className="section-body">
              <FormField id="email" label="Email Address" required error={errors.email}>
                <input id="email" name="email" type="email" className={cls('email')}
                  value={form.email} onChange={handleChange} placeholder="example@email.com"
                  autoComplete="email" />
              </FormField>
              <div className="row-2">
                <FormField id="phone" label="Phone Number" required error={errors.phone}>
                  <input id="phone" name="phone" type="tel" className={cls('phone')}
                    value={form.phone} onChange={handleChange} placeholder="+91 98765 43210"
                    autoComplete="tel" />
                </FormField>
                <FormField id="altPhone" label="Alternate Phone" error={errors.altPhone}>
                  <input id="altPhone" name="altPhone" type="tel" className="field"
                    value={form.altPhone} onChange={handleChange} placeholder="+91 98765 43210" />
                </FormField>
              </div>
              <FormField id="address" label="Full Address" required error={errors.address}>
                <textarea id="address" name="address" className={cls('address')} rows={3}
                  value={form.address} onChange={handleChange}
                  placeholder="House No., Street, Area..." autoComplete="street-address" />
              </FormField>
              <div className="row-2">
                <FormField id="city" label="City" required error={errors.city}>
                  <input id="city" name="city" className={cls('city')}
                    value={form.city} onChange={handleChange} placeholder="City name"
                    autoComplete="address-level2" />
                </FormField>
                <FormField id="zipCode" label="ZIP / Postal Code" error={errors.zipCode}>
                  <input id="zipCode" name="zipCode" className="field"
                    value={form.zipCode} onChange={handleChange} placeholder="e.g. 500001"
                    autoComplete="postal-code" />
                </FormField>
              </div>
            </div>
          </div>

          {/* ══ SECTION 3: Academic ══ */}
          <div className="rf-section">
            <div className="section-header">
              <div className="section-icon">📚</div>
              <div>
                <h2 className="section-title">Academic Information</h2>
                <p className="section-desc">Your course and enrollment details</p>
              </div>
            </div>
            <div className="section-body">
              <div className="row-2">
                <FormField id="studentId" label="Student ID" hint="Leave blank to auto-generate" error={errors.studentId}>
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
                    <option value="">-- Select Department --</option>
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
                    <option value="">-- Select Program --</option>
                    <option value="bachelor">Bachelor's Degree</option>
                    <option value="master">Master's Degree</option>
                    <option value="phd">PhD</option>
                    <option value="diploma">Diploma</option>
                    <option value="certificate">Certificate</option>
                  </select>
                </FormField>
              </div>
              <div className="form-group">
                <label>Subjects of Interest <span className="optional-tag">optional</span></label>
                <div className="checkbox-grid">
                  {SUBJECTS.map(s => (
                    <label key={s} className="cb-item">
                      <input type="checkbox" name="subjects" value={s}
                        checked={form.subjects.includes(s)} onChange={handleChange} />
                      <span className="cb-box"></span>
                      <span className="cb-text">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ══ SECTION 4: Emergency ══ */}
          <div className="rf-section">
            <div className="section-header">
              <div className="section-icon">🚨</div>
              <div>
                <h2 className="section-title">Emergency Contact</h2>
                <p className="section-desc">Someone we can contact in case of emergency</p>
              </div>
            </div>
            <div className="section-body">
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
            </div>
          </div>

          {/* ══ Terms ══ */}
          <div className="rf-section rf-section-terms">
            <label className="terms-label">
              <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} />
              <span className="terms-box"></span>
              <span>
                I agree to the <a href="#" className="terms-link">Terms and Conditions</a> and{' '}
                <a href="#" className="terms-link">Privacy Policy</a>
              </span>
            </label>
            {errors.terms && <span className="err-msg">⚠ {errors.terms}</span>}
          </div>

          {/* ══ Actions ══ */}
          <div className="rf-actions">
            <button type="button" className="btn-reset" onClick={handleReset}>
              ↺ Reset Form
            </button>
            <button type="submit" className="btn-submit" disabled={status === 'loading'}>
              {status === 'loading'
                ? <><span className="spinner"></span> Registering...</>
                : '✓ Register Now'}
            </button>
          </div>

        </form>
      </div>

      {/* ── Success Modal ── */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="success-modal" onClick={e => e.stopPropagation()}>
            <div className="success-icon">🎉</div>
            <h2>Registration Successful!</h2>
            <p className="success-name">Welcome, <strong>{modal.name}</strong>!</p>
            <div className="success-id-box">
              <span className="success-id-label">Your Student ID</span>
              <span className="success-id">{modal.studentId}</span>
            </div>
            <p className="success-note">Your details have been saved to the database successfully.</p>
            <button className="btn-submit" onClick={() => setModal(null)}>
              ✓ Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
