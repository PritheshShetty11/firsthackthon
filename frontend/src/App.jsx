import { Routes, Route } from 'react-router-dom'
import AuthProvider from './context/AuthProvider'
import useAuth from './hooks/useAuth'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Tree from './pages/Tree'
import { motion } from 'framer-motion'

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-8">
            Apna Family Tree 🌳
          </h1>
          <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
            Connect with your roots, preserve your history, and visualize your family connections in one beautiful place.
          </p>
          <motion.div 
            className="flex flex-wrap gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <a href="/tree" className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
              View Family Tree
            </a>
            <a href="/dashboard" className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              Go to Dashboard
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

function Protected({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Please sign in to continue</h2>
        <p className="text-gray-600 mb-8">You need to be logged in to access this page.</p>
        <a href="/" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Back to Home
        </a>
      </div>
    )
  }
  
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/tree" element={<Protected><Tree /></Protected>} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />
        </Routes>
      </div>
    </AuthProvider>
  )
}