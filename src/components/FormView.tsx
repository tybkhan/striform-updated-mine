import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Form } from '../types'
import FormViewer from './FormViewer'
import { AlertCircle } from 'lucide-react'
import Toast from './Toast'

const FormView: React.FC = () => {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/forms/${formId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch form')
        }

        const formData = await response.json()
        setForm(formData)
      } catch (err) {
        console.error('Error loading form:', err)
        setError('Failed to load form')
      } finally {
        setLoading(false)
      }
    }

    if (formId) {
      loadForm()
    }
  }, [formId])

  const handleComplete = async (formId: string, answers: Record<string, any>) => {
    try {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          answers,
          submittedAt: new Date().toISOString(),
          isPartial: false
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      setToast({
        message: 'Form submitted successfully!',
        type: 'success'
      })

      // If form has a redirect URL, use it
      if (form?.redirectUrl) {
        window.location.href = form.redirectUrl
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setToast({
        message: 'Failed to submit form. Please try again.',
        type: 'error'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The form you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-300"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <FormViewer form={form} onComplete={handleComplete} />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}

export default FormView