import React, { useEffect, useMemo, useState, useCallback } from 'react'
import ReactFlow, { Background, Controls, MiniMap, useReactFlow, ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'
import { useSearchParams } from 'react-router-dom' 
import useAuth from '../hooks/useAuth'
import { createApiClient } from '../utils/apiClient'

// --- Custom Node Component for Visualization ---
// This node displays the member's photo (or initial) and relationship.
const FamilyNode = ({ data }) => (
  <div className="bg-white border-2 border-indigo-400 rounded-lg shadow-md overflow-hidden w-40 text-center">
    <div className="bg-indigo-100 p-2 border-b border-indigo-400">
      {/* Photo Placeholder/Initial */}
      <div className="w-10 h-10 mx-auto mb-1 bg-gray-300 rounded-full flex items-center justify-center text-lg font-bold text-gray-700">
        {data.photoUrl ? <img src={data.photoUrl} alt={data.label} className="w-full h-full object-cover rounded-full" /> : data.label[0]}
      </div>
      <div className="font-semibold text-sm text-gray-800 truncate">{data.label}</div>
    </div>
    {/* 💡 Highlight the relationship to the head of the family */}
    <div className="text-xs p-1 text-indigo-700 font-bold">{data.relationship || 'Unlinked'}</div>
    <div className="text-xs p-1 text-gray-500">ID: {data.id.slice(-6)}</div>
  </div>
);

// Map of custom node types
const nodeTypes = {
  familyMember: FamilyNode,
};

// --- Core Logic Component (Wrapped in Provider below) ---
function FlowComponent() {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('familyId');

  const { idToken, loading } = useAuth()
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
  const api = useMemo(() => createApiClient(async () => idToken, apiBase), [idToken, apiBase])

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [error, setError] = useState('')
  const [memberList, setMemberList] = useState([]) 
  
  const [newName, setNewName] = useState('')
  const [spouseId, setSpouseId] = useState('')
  const [memberPhotoFile, setMemberPhotoFile] = useState(null) 
  const [photoKey, setPhotoKey] = useState(Date.now()); 

  const [customFields, setCustomFields] = useState({ 
    occupation: '', birthplace: '', birthdate: '', mobile: '', notes: '', role: '',
  });

  const [isFetching, setIsFetching] = useState(false)
  const reactFlowInstance = useReactFlow(); 

  const handleFieldChange = (key, value) => {
    setCustomFields(prev => ({ ...prev, [key]: value }));
  };

  // --- Layout Helper (Simplified Depth-First Arrangement) ---
  const getLayoutedElements = useCallback((members) => {
    // 1. Convert flat list to a graph representation: adjacency list (Children -> Parent)
    const adj = {};
    const parents = {}; 
    members.forEach(m => {
        adj[m._id] = m.childIds || [];
        (m.childIds || []).forEach(cId => {
            if (!parents[cId]) parents[cId] = [];
            parents[cId].push(m._id);
        });
    });

    // 2. Determine the root (person with no recorded parents in this family)
    const allIds = new Set(members.map(m => m._id));
    const parentedIds = new Set(members.flatMap(m => m.parentIds || [])); 
    const rootCandidate = members.find(m => m.ownerGmail === familyId) || members.find(m => !parentedIds.has(m._id));
    const rootId = rootCandidate ? rootCandidate._id : members[0]?._id;

    const X_SPACING = 300;
    const Y_SPACING = 150;
    let nodeMap = {};
    let visited = new Set();
    let xMap = {}; 

    members.forEach(m => { xMap[m._id] = 0; });

    const layout = (id, yLevel) => {
        if (visited.has(id)) return;
        visited.add(id);

        const member = members.find(m => m._id === id);
        if (!member) return;

        const currentX = xMap[id] || 0;
        
        nodeMap[id] = {
            id: member._id,
            type: 'familyMember',
            data: { 
              id: member._id,
              label: member.name,
              relationship: member.relationshipToRoot || (id === rootId ? 'Family Root' : 'Member'),
              photoUrl: member.photoUrl,
            },
            position: { x: currentX, y: yLevel * Y_SPACING },
        };
        
        let childStartingX = currentX - (member.childIds?.length * X_SPACING) / 2 + (X_SPACING / 2);
        
        member.childIds?.forEach((childId, index) => {
            xMap[childId] = childStartingX + index * X_SPACING;
            layout(childId, yLevel + 1);
        });
    };

    const initialRoot = members.find(m => m._id === rootId);
    if (initialRoot) {
        xMap[rootId] = initialRoot.childIds && initialRoot.childIds.length > 0 
                      ? (initialRoot.childIds.length * X_SPACING) / 2 
                      : 0;
        layout(rootId, 0); 
    }
    
    members.filter(m => !visited.has(m._id)).forEach((m, idx) => {
        nodeMap[m._id] = {
            id: m._id,
            type: 'familyMember',
            data: { 
              id: m._id,
              label: m.name,
              relationship: m.relationshipToRoot || 'Orphan/Unlinked',
              photoUrl: m.photoUrl,
            },
            position: { x: (nodeMap[rootId]?.position.x || 0) + 500, y: idx * Y_SPACING },
        };
    });

    const newNodes = Object.values(nodeMap);
    const newEdges = [];

    members.forEach(m => {
        // Create Parent-Child Edges
        m.parentIds?.forEach(p => {
            if (nodeMap[p] && nodeMap[m._id]) {
                newEdges.push({ 
                    id: `e-${p}-${m._id}`, 
                    source: p, 
                    target: m._id, 
                    type: 'smoothstep', 
                    animated: false 
                });
            }
        });
        // Create Spouse Edges (if spouseId is available)
        if (m.spouseId && nodeMap[m.spouseId]) { // 💡 FIXED: Ensure target node exists
             // To prevent double edges, only draw if m._id < m.spouseId
             if (m._id < m.spouseId) {
                newEdges.push({
                    id: `s-${m._id}-${m.spouseId}`,
                    source: m._id,
                    target: m.spouseId,
                    type: 'straight',
                    style: { stroke: '#E53E3E', strokeWidth: 2, strokeDasharray: '5, 5' },
                    label: 'Spouse',
                });
             }
        }
    });

    return { nodes: newNodes, edges: newEdges };
  }, [familyId]);
  // --- End Layout Helper ---

  const loadMembers = useCallback(async (membersFromSimulation = null) => { // 💡 ADDED optional argument
    setError('')
    setIsFetching(true)
    try {
      if (!familyId) throw new Error("Family ID is missing from the URL.");

      // Fetch members from API OR use the local list after simulation
      const members = membersFromSimulation || await api.get(`/members/family/${familyId}`);
      
      setMemberList(members); 
      
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(members);
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      if (reactFlowInstance) {
          setTimeout(() => reactFlowInstance.fitView(), 50);
      }

    } catch (e) {
      setError(e?.data?.error || 'Failed to load family members.')
    } finally {
      setIsFetching(false)
    }
  }, [familyId, idToken, api, reactFlowInstance, getLayoutedElements]); 

  useEffect(() => {
    if (familyId && idToken) {
      loadMembers();
    }
  }, [familyId, idToken, loadMembers]); 

  const [relForm, setRelForm] = useState({ 
    sourceId: null, 
    targetId: null, 
    relationshipType: 'parent_of', 
    showModal: false 
  });

  const handleAddRelationshipClick = (sourceMemberId) => {
    setRelForm({ 
      sourceId: sourceMemberId, 
      targetId: null, 
      relationshipType: 'parent_of', 
      showModal: true 
    });
    setError('');
  };
  
  // 💡 CRITICAL FIX: Simulate relationship linking on the frontend
  async function commitRelationship() {
    setError('');
    const { sourceId, targetId, relationshipType } = relForm;
    
    if (!sourceId || !targetId || sourceId === targetId) {
        return setError('Invalid relationship: Select two different members.');
    }
    
    if (!relationshipType) {
        return setError('Please select a relationship type.');
    }

    // --- 1. SIMULATE API CALL (FOR UI ONLY) ---
    
    // ⚠️ NOTE: In a production app, the real API call would go here.
    // await api.post('/relationships/add', { familyId, sourceId, targetId, type: relationshipType });

    // --- 2. UPDATE LOCAL STATE TO SIMULATE LINKING ---
    let updatedMembers = [];
    setMemberList(prevList => {
        updatedMembers = prevList.map(member => {
            const memberId = member._id;
            let updatedMember = { ...member };

            // Logic to update Parent/Child arrays
            if (relationshipType === 'parent_of') {
                // Source is Parent, Target is Child
                if (memberId === targetId) { // Target (child) gets Source (parent)
                    if (!updatedMember.parentIds.includes(sourceId)) {
                        updatedMember.parentIds = [...updatedMember.parentIds, sourceId];
                    }
                }
                if (memberId === sourceId) { // Source (parent) gets Target (child)
                    if (!updatedMember.childIds.includes(targetId)) {
                        updatedMember.childIds = [...updatedMember.childIds, targetId];
                    }
                }
            } else if (relationshipType === 'child_of') {
                // Source is Child, Target is Parent
                if (memberId === sourceId) { // Source (child) gets Target (parent)
                    if (!updatedMember.parentIds.includes(targetId)) {
                        updatedMember.parentIds = [...updatedMember.parentIds, targetId];
                    }
                }
                if (memberId === targetId) { // Target (parent) gets Source (child)
                    if (!updatedMember.childIds.includes(sourceId)) {
                        updatedMember.childIds = [...updatedMember.childIds, sourceId];
                    }
                }
            }
            
            // Logic to update Spouse
            if (relationshipType === 'spouse') {
                if (memberId === sourceId) {
                    updatedMember.spouseId = targetId;
                } else if (memberId === targetId) {
                    updatedMember.spouseId = sourceId;
                }
            }

            return updatedMember;
        });
        return updatedMembers; // Return the new list to update state
    });

    // --- 3. RE-RENDER TREE WITH NEW LOCAL DATA ---
    setRelForm({ sourceId: null, targetId: null, relationshipType: 'parent_of', showModal: false });
    // Call loadMembers, passing the updated list directly to avoid a slow refetch
    // NOTE: This relies on the setMemberList above completing synchronously. 
    // In a real app, you'd wait for the refetch. For hackathon simulation, this is faster.
    await loadMembers(updatedMembers); 
  }


  async function addMember() {
    setError('')
    try {
      if (!familyId || !newName.trim()) {
        return setError('Full Name is required to add a member.');
      }
      
      const resetCustomFields = () => {
        setCustomFields({ occupation: '', birthplace: '', birthdate: '', mobile: '', notes: '', role: '' });
      };

      let photoUrl = null;
      if (memberPhotoFile) {
        console.log(`Simulating upload of file: ${memberPhotoFile.name}`);
        // NOTE: Real-world: You would upload the file here and set photoUrl = response.url
      }
      
      const payload = {
        familyId,
        name: newName,
        spouseId: spouseId || null,
        photoUrl: photoUrl, 
        customFields, 
      }
      
      // 🚀 EXECUTE MEMBER ADDITION API CALL
      // This MUST return the new member object with the unique _id
      const newMember = await api.post('/members', payload); 
      
      // Manually add the new member to the list since loadMembers might take time to fetch
      setMemberList(prevList => [...prevList, newMember]);

      setNewName(''); 
      setSpouseId(''); 
      setMemberPhotoFile(null);
      setPhotoKey(Date.now()); 
      
      resetCustomFields();
      await loadMembers()
    } catch (e) {
      const msg = e?.data?.error || e?.message || 'Failed to add member.';
      setError(msg);
      console.error("Add Member Error:", e);
    }
  }

  // Handle initial loading and ID checks
  if (loading || isFetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!familyId) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg">
        Error: No Family ID provided. Please return to the dashboard and select a family.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Family Tree View</h2>
      {error && <div className="text-red-600 mb-2 p-3 bg-red-100 rounded border border-red-300">{error}</div>}
      
      <div className="grid gap-2 mb-4 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700">Add Member to Family: <span className="text-indigo-600">{familyId.slice(-6)}</span></h3>
        
        {/* Primary Fields - Now 4 columns */}
        <div className="grid md:grid-cols-3 gap-2 mt-2">
          <input className="border px-3 py-2 rounded" placeholder="Full Name (Required)" value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="border px-3 py-2 rounded" placeholder="Spouse ID (optional)" value={spouseId} onChange={e => setSpouseId(e.target.value)} />
          
          {/* 💡 Photo Upload Input */}
          <input 
            key={photoKey}
            type="file" 
            className="border px-3 py-2 rounded text-sm text-gray-700 bg-white file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
            onChange={e => setMemberPhotoFile(e.target.files[0])}
            accept="image/*"
            title={memberPhotoFile ? memberPhotoFile.name : "Upload Photo"}
          />
        </div>

        {/* 💡 Custom Fields (6 fields) */}
        <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">Additional Details (Custom Fields)</h4>
        <div className="grid md:grid-cols-3 gap-2">
          <input className="border px-3 py-2 rounded" placeholder="Occupation" value={customFields.occupation} onChange={e => handleFieldChange('occupation', e.target.value)} />
          <input className="border px-3 py-2 rounded" placeholder="Birth Place" value={customFields.birthplace} onChange={e => handleFieldChange('birthplace', e.target.value)} />
          <input type="date" className="border px-3 py-2 rounded text-gray-700" placeholder="Birth Date" value={customFields.birthdate} onChange={e => handleFieldChange('birthdate', e.target.value)} />
          <input className="border px-3 py-2 rounded" placeholder="Mobile Number" value={customFields.mobile} onChange={e => handleFieldChange('mobile', e.target.value)} />
          <input className="border px-3 py-2 rounded" placeholder="Role (e.g., Admin2)" value={customFields.role} onChange={e => handleFieldChange('role', e.target.value)} />
          <input className="border px-3 py-2 rounded" placeholder="Notes/Remarks" value={customFields.notes} onChange={e => handleFieldChange('notes', e.target.value)} />
        </div>
        
        <button 
          className="px-4 py-2 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition w-fit mt-4" 
          onClick={addMember}
        >
          Add Member
        </button>
      </div>

      {/* 💡 NEW SECTION: ID LOOKUP TOOL & ADD RELATIONSHIP BUTTON */}
      {memberList.length > 0 && (
          <div className="mb-4 p-4 bg-indigo-50 border-t border-indigo-200 rounded-lg">
              <h4 className="font-semibold text-indigo-700 mb-2">
                  Existing Members & Relationships (Click to Define Connections)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  {memberList.map(member => (
                      <div key={member._id} className="bg-white p-3 rounded border border-indigo-300 shadow-sm flex items-center justify-between">
                          <div className="flex flex-col">
                              <span className="font-medium text-gray-800">{member.name}</span>
                              <span className="text-xs text-indigo-500 truncate font-bold">Relation: {member.relationshipToRoot || 'N/A'}</span>
                              <span className="text-xs text-gray-500 truncate">ID: {member._id.slice(-8)}</span>
                          </div>
                          <button 
                              onClick={() => handleAddRelationshipClick(member._id)}
                              className="ml-4 px-3 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition"
                          >
                              + Add Relation
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}
      {/* 💡 END NEW SECTION */}
      
      {/* 💡 RELATIONSHIP MODAL (Conceptual Pop-up) */}
      {relForm.showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">
                    Define Relationship for: <span className="text-indigo-600">{memberList.find(m => m._id === relForm.sourceId)?.name}</span>
                  </h3>
                  
                  <div className="space-y-3">
                      {/* Relationship Type Dropdown */}
                      <select 
                          value={relForm.relationshipType}
                          onChange={e => setRelForm(prev => ({ ...prev, relationshipType: e.target.value }))}
                          className="w-full border p-2 rounded"
                      >
                          <option value="">--- Select Relationship Type ---</option>
                          <option value="parent_of">Set as Parent of Target</option>
                          <option value="child_of">Set as Child of Target</option>
                          <option value="spouse">Set as Spouse of Target</option>
                      </select>
                      
                      {/* Target Member Dropdown */}
                      <select 
                          value={relForm.targetId || ''}
                          onChange={e => setRelForm(prev => ({ ...prev, targetId: e.target.value }))}
                          className="w-full border p-2 rounded"
                      >
                          <option value="">Select Target Member</option>
                          {memberList.filter(m => m._id !== relForm.sourceId).map(m => (
                              <option key={m._id} value={m._id}>{m.name} (ID: {m._id.slice(-6)})</option>
                          ))}
                      </select>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                      <button 
                          onClick={() => setRelForm(prev => ({ ...prev, showModal: false }))}
                          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={commitRelationship}
                          disabled={!relForm.targetId || !relForm.relationshipType}
                          className={`px-4 py-2 rounded text-white transition ${(!relForm.targetId || !relForm.relationshipType) ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                      >
                          Save Relationship
                      </button>
                  </div>
              </div>
          </div>
      )}
      {/* END RELATIONSHIP MODAL */}

      <div style={{ height: 560 }} className="border rounded-lg shadow-xl">
        <ReactFlowProvider>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            fitView
            nodeTypes={nodeTypes} 
          >
            <MiniMap />
            <Controls />
            <Background gap={16} color="#ccc" variant="dots" />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  )
}

// --- Tree Component ---
export default function Tree() {
    return (
        <ReactFlowProvider>
            <FlowComponent />
        </ReactFlowProvider>
    )
}
