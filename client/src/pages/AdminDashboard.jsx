import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.css'

const DEPT_MAP = {
  cs: 'Computer Science', ee: 'Electrical Eng.', me: 'Mechanical Eng.',
  ce: 'Civil Eng.', ba: 'Business Admin.', med: 'Medicine', law: 'Law', arts: 'Arts & Humanities',
}
const PROG_MAP = {
  bachelor: "Bachelor's", master: "Master's", phd: 'PhD', diploma: 'Diploma', certificate: 'Certificate',
}

export default function AdminDashboard() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  const [students, setStudents]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [deleting, setDeleting]   = useState(null)
  const [exporting, setExporting] = useState(false)
  const [stats, setStats]         = useState({ total: 0, departments: {} })

  const fetchStudents = async (q = '') => {
    setLoading(true); setError('')
    try {
      const res = await axios.get(`/api/students${q ? `?search=${q}` : ''}`)
      if (res.data.success) {
        setStudents(res.data.data)
        // Compute stats
        const depts = {}
        res.data.data.forEach(s => {
          depts[s.department] = (depts[s.department] || 0) + 1
        })
        setStats({ total: res.data.count, departments: depts })
      }
    } catch (err) {
      if (err.response?.status === 401) {
        logout(); navigate('/login')
      } else {
        setError('Failed to load students.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStudents() }, [])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchStudents(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student record permanently?')) return
    setDeleting(id)
    try {
      await axios.delete(`/api/students/${id}`)
      setStudents(s => s.filter(st => st._id !== id))
      if (selected?._id === id) setSelected(null)
      setStats(prev => ({ ...prev, total: prev.total - 1 }))
    } catch {
      alert('Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await axios.get('/api/students/export/excel', { responseType: 'blob' })
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `students_${new Date().toISOString().slice(0,10)}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const topDepts = Object.entries(stats.departments)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="dashboard">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">🎓</div>
        <div className="sidebar-title">Admin Panel</div>
        <nav className="sidebar-nav">
          <div className="nav-item active">📊 Dashboard</div>
        </nav>
        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">{admin?.name?.[0] || 'A'}</div>
            <div>
              <div className="admin-name">{admin?.name || 'Admin'}</div>
              <div className="admin-email">{admin?.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dash-main">

        {/* Header */}
        <div className="dash-header">
          <div>
            <h1>Student Dashboard</h1>
            <p>Manage all registered students</p>
          </div>
          <div className="dash-header-actions">
            <button className="btn-export" onClick={handleExport} disabled={exporting}>
              {exporting ? '⏳ Exporting...' : '📥 Export Excel'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Students</div>
            </div>
          </div>
          {topDepts.map(([dept, count]) => (
            <div className="stat-card" key={dept}>
              <div className="stat-icon">🏫</div>
              <div className="stat-info">
                <div className="stat-value">{count}</div>
                <div className="stat-label">{DEPT_MAP[dept] || dept}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, student ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* Table */}
        <div className="table-card">
          {loading && <div className="table-state">⏳ Loading students...</div>}
          {error   && <div className="table-state table-error">⚠️ {error}</div>}

          {!loading && !error && students.length === 0 && (
            <div className="table-state">
              {search ? 'No students match your search.' : 'No students registered yet.'}
            </div>
          )}

          {!loading && !error && students.length > 0 && (
            <div className="table-wrap">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Program</th>
                    <th>Year</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s._id} className={selected?._id === s._id ? 'row-active' : ''}>
                      <td className="td-num">{i + 1}</td>
                      <td><span className="id-badge">{s.studentId}</span></td>
                      <td className="td-name">{s.firstName} {s.lastName}</td>
                      <td>{s.email}</td>
                      <td>{DEPT_MAP[s.department] || s.department}</td>
                      <td>{PROG_MAP[s.program] || s.program}</td>
                      <td>{s.enrollmentYear}</td>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="td-actions">
                        <button className="btn-view" onClick={() => setSelected(s)} title="View Details">👁 View</button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(s._id)}
                          disabled={deleting === s._id}
                          title="Delete"
                        >
                          {deleting === s._id ? '⏳' : '🗑 Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <div className="detail-head">
              <div className="detail-avatar">{selected.firstName[0]}{selected.lastName[0]}</div>
              <div>
                <h2>{selected.firstName} {selected.lastName}</h2>
                <span className="id-badge">{selected.studentId}</span>
              </div>
            </div>
            <div className="detail-body">
              <Section title="Personal">
                <Row label="Date of Birth" value={new Date(selected.dob).toLocaleDateString()} />
                <Row label="Gender"        value={selected.gender} />
                <Row label="Nationality"   value={selected.nationality || '—'} />
              </Section>
              <Section title="Contact">
                <Row label="Email"   value={selected.email} />
                <Row label="Phone"   value={selected.phone} />
                <Row label="Address" value={`${selected.address}, ${selected.city} ${selected.zipCode || ''}`} />
              </Section>
              <Section title="Academic">
                <Row label="Department"   value={DEPT_MAP[selected.department] || selected.department} />
                <Row label="Program"      value={PROG_MAP[selected.program] || selected.program} />
                <Row label="Enroll Year"  value={selected.enrollmentYear} />
                <Row label="Subjects"     value={selected.subjects?.join(', ') || '—'} />
              </Section>
              <Section title="Emergency Contact">
                <Row label="Name"         value={selected.emergencyName} />
                <Row label="Relationship" value={selected.relationship} />
                <Row label="Phone"        value={selected.emergencyPhone} />
              </Section>
              <Section title="System">
                <Row label="Registered On" value={new Date(selected.createdAt).toLocaleString()} />
              </Section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="detail-section">
      <div className="detail-section-title">{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}
