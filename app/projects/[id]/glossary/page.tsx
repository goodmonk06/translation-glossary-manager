'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface GlossaryTerm {
  id: string
  sourceTerm: string
  sourceLocale: string
  targetLocale: string
  targetTerm: string
  notes?: string
  tagsJson?: string
}

interface Project {
  id: string
  name: string
  slug: string
  defaultLocale: string
}

export default function ProjectGlossaryPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    sourceTerm: '',
    sourceLocale: '',
    targetLocale: '',
    targetTerm: '',
    notes: '',
    tagsJson: '',
  })

  useEffect(() => {
    fetchProject()
    fetchTerms()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
        setFormData((prev) => ({ ...prev, sourceLocale: data.defaultLocale }))
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  const fetchTerms = async () => {
    try {
      const response = await fetch(`/api/glossary-terms?projectId=${projectId}`)
      const data = await response.json()
      setTerms(data)
    } catch (error) {
      console.error('Error fetching glossary terms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingId ? `/api/glossary-terms/${editingId}` : '/api/glossary-terms'
    const method = editingId ? 'PATCH' : 'POST'
    const body = editingId
      ? { ...formData }
      : { ...formData, projectId }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          sourceTerm: '',
          sourceLocale: project?.defaultLocale || '',
          targetLocale: '',
          targetTerm: '',
          notes: '',
          tagsJson: '',
        })
        setShowForm(false)
        setEditingId(null)
        fetchTerms()
      } else {
        const error = await response.json()
        alert(`Error: ${JSON.stringify(error)}`)
      }
    } catch (error) {
      console.error('Error saving glossary term:', error)
    }
  }

  const handleEdit = (term: GlossaryTerm) => {
    setFormData({
      sourceTerm: term.sourceTerm,
      sourceLocale: term.sourceLocale,
      targetLocale: term.targetLocale,
      targetTerm: term.targetTerm,
      notes: term.notes || '',
      tagsJson: term.tagsJson || '',
    })
    setEditingId(term.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this glossary term?')) return

    try {
      const response = await fetch(`/api/glossary-terms/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTerms()
      }
    } catch (error) {
      console.error('Error deleting glossary term:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/projects" className="text-blue-600 hover:underline">
            ← Back to Projects
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project?.name} - Glossary
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage glossary terms
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingId(null)
              setFormData({
                sourceTerm: '',
                sourceLocale: project?.defaultLocale || '',
                targetLocale: '',
                targetTerm: '',
                notes: '',
                tagsJson: '',
              })
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : 'New Term'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              {editingId ? 'Edit Term' : 'Create New Term'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Source Term
                  </label>
                  <input
                    type="text"
                    value={formData.sourceTerm}
                    onChange={(e) => setFormData({ ...formData, sourceTerm: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Source Locale
                  </label>
                  <input
                    type="text"
                    value={formData.sourceLocale}
                    onChange={(e) => setFormData({ ...formData, sourceLocale: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Target Term
                  </label>
                  <input
                    type="text"
                    value={formData.targetTerm}
                    onChange={(e) => setFormData({ ...formData, targetTerm: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Target Locale
                  </label>
                  <input
                    type="text"
                    value={formData.targetLocale}
                    onChange={(e) => setFormData({ ...formData, targetLocale: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Tags JSON (optional, e.g., ["technical", "medical"])
                </label>
                <input
                  type="text"
                  value={formData.tagsJson}
                  onChange={(e) => setFormData({ ...formData, tagsJson: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder='["tag1", "tag2"]'
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update Term' : 'Create Term'}
              </button>
            </form>
          </div>
        )}

        {terms.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400">
              No glossary terms yet. Create your first term to get started.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {terms.map((term) => (
                  <tr key={term.id}>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">{term.sourceTerm}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{term.sourceLocale}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">{term.targetTerm}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{term.targetLocale}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {term.notes || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {term.tagsJson || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(term)}
                        className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(term.id)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
