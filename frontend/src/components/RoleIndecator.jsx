import React from 'react'

const roleColor = {
  Admin1: 'bg-amber-500 text-amber-900',
  Admin2: 'bg-indigo-500 text-white',
  Admin3: 'bg-emerald-500 text-white',
  Viewer: 'bg-gray-200 text-gray-800'
}

export default function RoleIndicator({ user = {}, role = 'Viewer' }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={user?.photoURL || '/logo.png'}
        alt={user?.displayName || 'User'}
        className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-900 truncate">{user?.displayName || 'Guest'}</div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor[role] || roleColor.Viewer}`}>
            {role || 'Viewer'}
          </span>
        </div>
        <div className="text-xs text-gray-500 truncate">{user?.email || 'Not signed in'}</div>
      </div>
    </div>
  )
}