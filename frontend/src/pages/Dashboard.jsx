import React, { useEffect, useMemo, useState } from 'react'
// ⚠️ CORRECTION: Ensure useAuth returns the user object (e.g., { email: string })
import useAuth from '../hooks/useAuth' 
import { createApiClient } from '../utils/apiClient'
// ⚠️ NOTE: You'll need to create the FamilyDashboard component later
// import FamilyDashboard from './FamilyDashboard'


export default function Dashboard() {
  // ⚠️ CORRECTION: Destructure 'user' from useAuth
  const { idToken, loading, user } = useAuth() 
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
  const api = useMemo(() => createApiClient(async () => idToken, apiBase), [idToken, apiBase])

  const [families, setFamilies] = useState([])
  const [selectedFamily, setSelectedFamily] = useState(null) // State to switch to FamilyDashboard view
  const [familyName, setFamilyName] = useState('')
  const [error, setError] = useState('')
  const [fetching, setFetching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [globalSearchTerm, setGlobalSearchTerm] = useState('') // Global Search State

  useEffect(() => {
    if (!idToken) return
    setFetching(true)
    setError('')
    api.get('/families/mine')
      .then((res) => setFamilies(res || []))
      .catch((err) => setError(err?.data?.error || 'Failed to load families'))
      .finally(() => setFetching(false))
  }, [idToken])

  async function createFamily(e) {
    e.preventDefault()
    if (!familyName.trim()) return
    setError('')
    setCreating(true)
    try {
      const fam = await api.post('/families', { familyName })
      setFamilies(prev => [fam, ...prev])
      setFamilyName('')
    } catch (err) {
      setError(err?.data?.error || 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  // Helper to determine if the user is an owner of at least one family
  const isFamilyOwner = families.some(f => f.ownerGmail === user?.email)
  const userBasicRole = isFamilyOwner ? 'SuperAdmin/Owner' : 'Approved User'

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ⚠️ Placeholder for the FamilyDashboard component when a family is selected
  // if (selectedFamily) {
  //   const userRole = selectedFamily.ownerGmail === user?.email ? 'Admin1' : 'Viewer';
  //   return <FamilyDashboard family={selectedFamily} userRole={userRole} api={api} onBack={() => setSelectedFamily(null)} />;
  // }


  return (
    <div className="max-w-5xl mx-auto p-6">
      
      {/* 1. ROLE INDICATOR & GLOBAL SEARCH BAR (Dashboard Essentials) */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div className="text-sm text-gray-500">
            Logged in as: <strong className="text-gray-800">{user?.email || 'N/A'}</strong>
            {user?.email && (
                <span className="ml-3 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                    Role: {userBasicRole}
                </span>
            )}
        </div>
        <input
            value={globalSearchTerm}
            onChange={e => setGlobalSearchTerm(e.target.value)}
            // The search here would typically filter the family list, 
            // but is mainly designed for filtering members once a family is open.
            className="w-1/3 border border-gray-200 rounded-lg px-4 py-2 focus:ring-1 focus:ring-indigo-500 transition text-sm"
            placeholder="Search family member by Name or Keyword..."
            disabled={families.length === 0}
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Your Families (Family Selector)</h2>
        <div className="text-sm text-gray-500">Manage family groups you own or belong to</div>
      </div>

      <form onSubmit={createFamily} className="flex gap-3 mb-6">
        <input
          value={familyName}
          onChange={e => setFamilyName(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition"
          placeholder="New family name (e.g., ApnaParivar)"
          aria-label="Family name"
        />
        <button
          type="submit"
          disabled={creating || !familyName.trim()}
          className={`px-4 py-2 rounded-lg font-medium text-white transition ${creating || !familyName.trim()
            ? 'bg-indigo-300 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {fetching ? (
        <div className="grid gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-gray-200 rounded" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : families.length === 0 ? (
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No families yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first family to start building your family tree.</p>
          <button
            onClick={() => document.querySelector('input[aria-label="Family name"]')?.focus()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Create a Family
          </button>
        </div>
      ) : (
        <ul className="grid gap-4">
          {families.map(f => (
            <li key={f._id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800">{f.familyName}</div>
                <div className="text-sm text-gray-500">Owner: {f.ownerGmail}</div>
              </div>
              <div className="flex items-center gap-3">
                {/* ⚠️ To implement the Family Dashboard view, you would replace this <a> tag 
                     with a button that calls setSelectedFamily(f). */}
                <a
                  href={`/tree?familyId=${f._id}`} 
                  className="text-indigo-600 hover:underline text-sm"
                >
                  Open Tree (Family Dashboard)
                </a>
                <a
                  href={`/families/${f._id}`}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Manage
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}