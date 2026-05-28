import { useEffect, useState } from 'react'
import api from '../api'
import './StudentList.css'

const DEPT_MAP = {
  cs: 'Computer Science', ee: 'Electrical Eng.', me: 'Mechanical Eng.',
  ce: 'Civil Eng.', ba: 'Business Admin.', med: 'Medicine', law: 'Law', arts: 'Arts & Humanities',
}
const PROG_MAP = {
  bachelor: "Bachelor's", master: "Master's", phd: 'PhD', diploma: 'Diploma', certificate: 'Certificate',
}

export default function StudentList() {
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fetchStudents = async () => {
    setLoading(true); setError('')
    try {
      const res  = await api.get('/api/students')
      if (res.data.success) setStudents(res.data.data)
      else setError('Failed to load students.')
    } catch {
      setError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStudents() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student record?')) return
    setDeleting(id)
    try {
      const res = await api.delete(`/api/students/${id}`)
      if (res.data.success) {
        setStudents(s => s.filter(st => st._id !== id))
        if (selected?._id === id) setSelected(null)
      }
    } catch {
      alert('Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.email} ${s.studentId} ${s.department}`
      .toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="sl-container">
      <div className="sl-card">
        <div className="sl-header">
          <div>
            <h2>Registered Students</h2>
            <p>{students.length} student{students.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button className="btn btn-refresh" onClick={fetchStudents}>🔄 Refresh</button>
        </div>

        <div className="sl-search">
          <input
            type="text"
            placeholder="🔍  Search by name, email, ID, department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {loading && <div className="sl-state">⏳ Loading students...</div>}
        {error   && <div className="sl-state sl-error">⚠️ {error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="sl-state">
            {search ? 'No students match your search.' : 'No students registered yet.'}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="sl-table-wrap">
            <table className="sl-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Program</th>
                  <th>Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id} className={selected?._id === s._id ? 'row-selected' : ''}>
                    <td><span className="id-badge">{s.studentId}</span></td>
                    <td className="name-cell">{s.firstName} {s.lastName}</td>
                    <td>{s.email}</td>
                    <td>{DEPT_MAP[s.department] || s.department}</td>
                    <td>{PROG_MAP[s.program] || s.program}</td>
                    <td>{s.enrollmentYear}</td>
                    <td className="actions-cell">
                      <button className="btn-icon btn-view" onClick={() => setSelected(s)} title="View">👁</button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(s._id)}
                        disabled={deleting === s._id}
                        title="Delete"
                      >
                        {deleting === s._id ? '⏳' : '🗑'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <div className="detail-header">
              <div className="detail-avatar">{selected.firstName[0]}{selected.lastName[0]}</div>
              <div>
                <h2>{selected.firstName} {selected.lastName}</h2>
                <span className="id-badge">{selected.studentId}</span>
              </div>
            </div>
            <div className="detail-grid">
              <DetailRow label="Email"        value={selected.email} />
              <DetailRow label="Phone"        value={selected.phone} />
              <DetailRow label="Date of Birth" value={new Date(selected.dob).toLocaleDateString()} />
              <DetailRow label="Gender"       value={selected.gender} />
              <DetailRow label="Nationality"  value={selected.nationality || '—'} />
              <DetailRow label="Address"      value={`${selected.address}, ${selected.city} ${selected.zipCode}`} />
              <DetailRow label="Department"   value={DEPT_MAP[selected.department] || selected.department} />
              <DetailRow label="Program"      value={PROG_MAP[selected.program] || selected.program} />
              <DetailRow label="Enroll Year"  value={selected.enrollmentYear} />
              <DetailRow label="Subjects"     value={selected.subjects?.join(', ') || '—'} />
              <DetailRow label="Emergency"    value={`${selected.emergencyName} (${selected.relationship}) — ${selected.emergencyPhone}`} />
              <DetailRow label="Registered"   value={new Date(selected.createdAt).toLocaleString()} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}
