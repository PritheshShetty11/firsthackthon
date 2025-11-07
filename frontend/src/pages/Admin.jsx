import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { UserGroupIcon, CreditCardIcon, WrenchScrewdriverIcon, TrashIcon } from '@heroicons/react/24/outline' 

// 1. New state variable outside the component to hold the test user's email
let testUserEmail = 'owner@apnaparivar.com'; // Default to Owner for management access

// FIX 1: Mock useAuth and createApiClient to resolve import errors
const useAuth = () => ({ 
    // Return the current test email in the user object
    idToken: 'MOCK_AUTH_TOKEN_ABC', 
    user: { email: testUserEmail } 
});
const createApiClient = (getToken, apiBaseUrl) => ({
    post: async (path, data) => {
        console.log(`MOCK API POST as ${testUserEmail} to ${apiBaseUrl}${path}`, data);
        return { success: true, message: 'Simulated API success' };
    },
    patch: async (path, data) => {
        console.log(`MOCK API PATCH as ${testUserEmail} to ${apiBaseUrl}${path}`, data);
        return { success: true, message: 'Simulated API success' };
    }
});

export default function Admin() {
  const { idToken, user } = useAuth() // Get the currently mocked user
  // FIX 2: Replaced import.meta.env with a placeholder URL
  const apiBase = 'http://localhost:4000' 
  const api = useMemo(() => createApiClient(async () => idToken, apiBase), [idToken, apiBase])
  
  // State for Role Management
  const [familyId, setFamilyId] = useState('')
  const [emailAdmin, setEmailAdmin] = useState('')
  const [emailViewer, setEmailViewer] = useState('')
  const [emailRemove, setEmailRemove] = useState('')
  
  // State for Custom Field Configuration (Placeholder for 6 fields)
  const [customFieldNames, setCustomFieldNames] = useState({
    occupation: 'Occupation',
    birthplace: 'Birth Place',
    birthdate: 'Birth Date',
    mobile: 'Mobile Number',
    notes: 'Notes/Remarks',
    role: 'Family Role/Title',
  });
  
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentMockEmail, setCurrentMockEmail] = useState(testUserEmail); // Local state for the input field

  // Helper to update a single custom field label
  const handleFieldNameChange = (key, value) => {
    setCustomFieldNames(prev => ({ ...prev, [key]: value }));
  };

  // Function to set the global test email
  const switchMockUser = (e) => {
    e.preventDefault();
    testUserEmail = currentMockEmail; // Update the global variable used by the mock hook
    setError(`Switched authenticated user to: ${testUserEmail}`);
    // A quick way to refresh component state based on the new user
    // Since useAuth is a mock, we just force a small state change to refresh
    setResult(null); 
  };


  // Helper function to get Family ID from the Dashboard (simulated)
  const getFamilyIdFromDashboard = () => {
    setFamilyId('65f6f3b0e3b9c0a8f8d7c4a1'); // Placeholder ID
    setError('Simulated Family ID loaded for testing.');
  };


  // 1. Role Update Logic (Add/Remove)
  async function updateRoles(actionType) {
    setError('')
    setLoading(true)
    if (!familyId) return setError('Family ID is required for role management.');
    
    let payload = {};
    let successMessage = '';
    
    if (actionType === 'addAdmin' && emailAdmin) {
      payload = { addAdmin: emailAdmin };
      successMessage = `Success: Added ${emailAdmin} as Admin.`;
    } else if (actionType === 'addViewer' && emailViewer) {
      payload = { addViewer: emailViewer };
      successMessage = `Success: Added ${emailViewer} as Viewer.`;
    } else if (actionType === 'removeRole' && emailRemove) {
      payload = { removeAdmin: emailRemove, removeViewer: emailRemove };
      successMessage = `Success: Removed role for ${emailRemove}.`;
    } else {
      setLoading(false);
      return setError('Missing email or invalid action type.');
    }
    
    try {
      const res = await api.post(`/families/${familyId}/roles`, payload);
      setResult(res);
      setError(successMessage);
    } catch (e) {
      setError(e?.data?.error || 'Role update failed. (Owner permission required)');
    } finally {
      setLoading(false);
      setEmailAdmin('');
      setEmailViewer('');
      setEmailRemove('');
    }
  }

  // 2. Monetization/Payment Logic
  async function mockPay() {
    setError('')
    setLoading(true)
    if (!familyId) return setError('Family ID is required for payment.');
    
    try {
      const res = await api.post('/payments/mock', { familyId, amount: 500 });
      setResult(res);
      setError('Success: Payment processed. Subscription extended by 1 year.');
    } catch (e) {
      setError(e?.data?.error || 'Mock payment failed. Check API.');
    } finally {
      setLoading(false);
    }
  }

  // 3. Custom Field Saving Logic
  async function saveCustomFieldConfig() {
    setError('')
    setLoading(true)
    if (!familyId) return setError('Family ID is required to save configuration.');
    
    try {
      const res = await api.patch(`/families/${familyId}`, { 
        customFieldNames: customFieldNames 
      });
      setResult(res);
      setError('Success: Custom field names saved successfully (Requires Owner role).');
    } catch (e) {
      setError(e?.data?.error || 'Configuration failed. Check API endpoint and permissions.');
    } finally {
      setLoading(false);
    }
  }


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-6"
    >
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">ApnaParivar Super Admin Console</h2>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-4 mb-4 rounded-lg ${error.startsWith('Success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}
          >
            {error}
          </motion.div>
        )}
        
        {/* === MOCK USER SWITCHER (FOR TESTING ROLES) === */}
        <div className="border p-4 rounded-lg mb-6 bg-yellow-50">
            <h3 className="font-semibold text-orange-700 mb-2">Test Role Simulation</h3>
            <form onSubmit={switchMockUser} className="flex gap-2">
                <input
                    type="email"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Set Mock User Email (e.g., viewer@test.com)"
                    value={currentMockEmail}
                    onChange={e => setCurrentMockEmail(e.target.value)}
                />
                <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                    Switch Auth User
                </button>
            </form>
            <p className="text-xs text-gray-600 mt-2">
                Currently Authenticated As: <strong>{user.email}</strong>
            </p>
        </div>
        {/* === END MOCK USER SWITCHER === */}

        {/* Family ID Input & Load */}
        <div className="border-b pb-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Family ID (Required)</label>
          <div className="flex gap-2">
            <input 
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Enter family ID"
              value={familyId}
              onChange={e => setFamilyId(e.target.value)}
            />
            <button 
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors text-sm font-medium"
              onClick={getFamilyIdFromDashboard}
            >
              Load ID from Dashboard
            </button>
          </div>
        </div>

        {/* 1. Role Management Section */}
        <div className="grid md:grid-cols-2 gap-8 border-b pb-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 col-span-2 flex items-center mb-4">
            <UserGroupIcon className="w-6 h-6 mr-2 text-indigo-500" />
            User & Role Management (Owner Only)
          </h3>
          
          {/* Add Roles */}
          <div className="space-y-4 p-4 border rounded-lg bg-indigo-50">
            <h4 className="font-semibold text-indigo-700">Add Roles (Admin2/3 & Viewer)</h4>
            <input 
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Add Admin (Gmail)"
              value={emailAdmin}
              onChange={e => setEmailAdmin(e.target.value)}
            />
            <button 
              className={`w-full px-4 py-2 rounded-lg bg-indigo-600 text-white transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
              onClick={() => updateRoles('addAdmin')}
              disabled={loading || !emailAdmin}
            >
              Add Admin
            </button>

            <input 
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Add Viewer (Gmail)"
              value={emailViewer}
              onChange={e => setEmailViewer(e.target.value)}
            />
            <button 
              className={`w-full px-4 py-2 rounded-lg bg-indigo-500 text-white transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-600'}`}
              onClick={() => updateRoles('addViewer')}
              disabled={loading || !emailViewer}
            >
              Add Viewer
            </button>
          </div>
          
          {/* Remove Roles */}
          <div className="space-y-4 p-4 border rounded-lg bg-red-50">
            <h4 className="font-semibold text-red-700">Remove/Revoke Roles</h4>
            <input 
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Email to Remove (Admin or Viewer)"
              value={emailRemove}
              onChange={e => setEmailRemove(e.target.value)}
            />
            <button 
              className={`w-full flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 text-white transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
              onClick={() => updateRoles('removeRole')}
              disabled={loading || !emailRemove}
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Revoke Role
            </button>
          </div>
        </div>

        {/* 2. Custom Field Configuration Section */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <WrenchScrewdriverIcon className="w-6 h-6 mr-2 text-indigo-500" />
            Configure 6 Programmable Fields (Owner Only)
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(customFieldNames).map(([key, value], index) => (
              <div key={key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">Field {index + 1} Key: {key}</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  placeholder={`Display Name for ${key}`}
                  value={value}
                  onChange={e => handleFieldNameChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <button 
            className={`mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
            onClick={saveCustomFieldConfig}
            disabled={loading || !familyId}
          >
            Save Configuration
          </button>
        </div>

        {/* 3. Monetization Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <CreditCardIcon className="w-6 h-6 mr-2 text-indigo-500" />
            Subscription Management (Owner Only)
          </h3>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="font-semibold text-emerald-700">Annual Subscription Renewal (₹500)</p>
              <p className="text-sm text-emerald-600">Free for the first year. Click below to renew access.</p>
            </div>
            <button 
              className={`px-4 py-2 rounded-lg bg-emerald-600 text-white transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}
              onClick={mockPay}
              disabled={loading || !familyId}
            >
              Renew for ₹500
            </button>
          </div>
        </div>
        
        {result && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <h4 className="text-lg font-semibold text-gray-800 mb-2">API Response (For Debugging)</h4>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto border border-gray-200">
                {JSON.stringify(result, null, 2)}
              </pre>
            </motion.div>
          )}
      </div>
    </motion.div>
  )
}
