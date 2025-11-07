import React from 'react'

export default function FamilySelector({ families = [], selectedId = '', onSelect = () => {} }) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="family-select" className="sr-only">Select family</label>
      <div className="relative">
        <select
          id="family-select"
          value={selectedId}
          onChange={e => onSelect(e.target.value)}
          className="appearance-none w-64 pl-3 pr-8 py-2 border border-gray-200 bg-white rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300"
        >
          <option value="">Select family</option>
          {families.map(f => (
            <option key={f._id} value={f._id}>
              {f.familyName} {f.ownerGmail ? `— ${f.ownerGmail}` : ''}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 -mt-2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </div>
      <div className="text-sm text-gray-500">
        {families.length} {families.length === 1 ? 'family' : 'families'}
      </div>
    </div>
  )
}