import React from 'react'
import { Link } from 'react-router-dom'
import LoginButton from './LoginButton'

export default function Navbar() {
  return (
    <header className="w-full border-b">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-3">
        <nav className="flex gap-4 items-center">
          <Link to="/" className="font-semibold">Apna Family Tree 🌳</Link>
          <Link to="/dashboard" className="text-sm text-gray-700">Dashboard</Link>
          <Link to="/tree" className="text-sm text-gray-700">Family Tree</Link>
          <Link to="/admin" className="text-sm text-gray-700">Admin</Link>
        </nav>
        <LoginButton />
      </div>
    </header>
  )
}


