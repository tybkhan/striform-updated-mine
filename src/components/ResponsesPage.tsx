import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Eye, FileText, Image as ImageIcon, File, X, AlertCircle } from 'lucide-react'
import { Form } from '../types'

interface ResponsesPageProps {
  user: { isPro: boolean }
}

const ResponsesPage: React.FC<ResponsesPageProps> = ({ user }) => {
  const { formId } = useParams<{ formId: string }>()
  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [showPartial, setShowPartial] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<{
    type: 'image' | 'signature' | 'file'
    url: string
    name?: string
  } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch form data
        const formResponse = await fetch(`/api/forms/${formId}`)
        if (!formResponse.ok) {
          throw new Error('Failed to fetch form')
        }
        const formData = await formResponse.json()
        setForm(formData)

        // Fetch responses
        const responsesResponse = await fetch(`/api/responses/form/${formId}`)
        if (!responsesResponse.ok) {
          throw new Error('Failed to fetch responses')
        }
        const responsesData = await responsesResponse.json()
        setResponses(responsesData)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load form data')
      } finally {
        setLoading(false)
      }
    }

    if (formId) {
      loadData()
    }
  }, [formId])

  const formatAnswer = (type: string, answer: any): React.ReactNode => {
    if (!answer) return '-'

    switch (type) {
      case 'contactInfo':
        return (
          <div className="space-y-1">
            {answer.firstName && <div><span className="font-medium">First Name:</span> {answer.firstName}</div>}
            {answer.lastName && <div><span className="font-medium">Last Name:</span> {answer.lastName}</div>}
            {answer.email && <div><span className="font-medium">Email:</span> {answer.email}</div>}
            {answer.phone && <div><span className="font-medium">Phone:</span> {answer.phone}</div>}
            {answer.company && <div><span className="font-medium">Company:</span> {answer.company}</div>}
          </div>
        )

      case 'fileUpload':
        return (
          <div className="flex flex-wrap gap-2">
            {Array.isArray(answer) && answer.map((file: any, index: number) => {
              const isImage = file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
              return (
                <button
                  key={index}
                  onClick={() => setPreviewContent({
                    type: isImage ? 'image' : 'file',
                    url: file.dataUrl,
                    name: file.name
                  })}
                  className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                >
                  {isImage ? (
                    <ImageIcon size={16} className="mr-1" />
                  ) : (
                    <FileText size={16} className="mr-1" />
                  )}
                  {file.name}
                </button>
              )
            })}
          </div>
        )

      case 'signature':
        return (
          <button
            onClick={() => setPreviewContent({
              type: 'signature',
              url: answer
            })}
            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
          >
            <Eye size={16} className="mr-1" />
            View Signature
          </button>
        )

      case 'checkbox':
        return Array.isArray(answer) ? answer.join(', ') : answer

      default:
        if (typeof answer === 'object' && answer !== null) {
          return JSON.stringify(answer)
        }
        return String(answer)
    }
  }

  const handleExportCSV = () => {
    if (!form || !responses.length) return

    const headers = ['Submission Date', 'Status', ...form.questions.map(q => q.question)]
    const csvData = responses.map(response => {
      const row = [
        new Date(response.submittedAt).toLocaleString(),
        response.isPartial ? 'Partial' : 'Complete'
      ]

      form.questions.forEach(question => {
        const answerData = response.answers[question.id]
        let formattedAnswer = ''
        
        if (answerData) {
          if (answerData.type === 'contactInfo') {
            const fields = []
            const answer = answerData.answer
            if (answer.firstName) fields.push(`First Name: ${answer.firstName}`)
            if (answer.lastName) fields.push(`Last Name: ${answer.lastName}`)
            if (answer.email) fields.push(`Email: ${answer.email}`)
            if (answer.phone) fields.push(`Phone: ${answer.phone}`)
            if (answer.company) fields.push(`Company: ${answer.company}`)
            formattedAnswer = fields.join('; ')
          } else if (answerData.type === 'signature') {
            formattedAnswer = answerData.answer ? 'Signed' : 'Not signed'
          } else if (answerData.type === 'fileUpload') {
            formattedAnswer = Array.isArray(answerData.answer) 
              ? answerData.answer.map((f: any) => f.name).join('; ')
              : ''
          } else {
            formattedAnswer = String(answerData.answer)
          }
        }
        
        row.push(formattedAnswer)
      })

      return row
    })

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.title}_responses.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-purple-600 hover:text-purple-800 mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Responses for {form.title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user.isPro && (
              <div className="flex items-center">
                <label htmlFor="showPartial" className="mr-2 text-sm font-medium text-gray-700">
                  Show Partial Submissions
                </label>
                <input
                  type="checkbox"
                  id="showPartial"
                  checked={showPartial}
                  onChange={(e) => setShowPartial(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-purple-600 rounded"
                />
              </div>
            )}
            <button
              onClick={handleExportCSV}
              disabled={!responses.length}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Responses Yet</h2>
            <p className="text-gray-600">This form hasn't received any responses.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submission Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {form.questions.map((question) => (
                      <th key={question.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {question.question}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {responses
                    .filter(response => showPartial || !response.isPartial)
                    .map((response) => (
                      <tr key={response._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(response.submittedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            response.isPartial 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {response.isPartial ? 'Partial' : 'Complete'}
                          </span>
                        </td>
                        {form.questions.map((question) => {
                          const answerData = response.answers[question.id]
                          return (
                            <td key={question.id} className="px-6 py-4 text-sm text-gray-900">
                              {answerData ? formatAnswer(answerData.type, answerData.answer) : '-'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {previewContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {previewContent.type === 'signature' ? 'Signature' : 
                 previewContent.type === 'image' ? 'Image Preview' : 
                 'File Preview'}
              </h3>
              <button
                onClick={() => setPreviewContent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex justify-center">
              {previewContent.type === 'file' ? (
                <div className="text-center">
                  <File size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">{previewContent.name}</p>
                  <a
                    href={previewContent.url}
                    download={previewContent.name}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    <Download size={16} className="mr-2" />
                    Download File
                  </a>
                </div>
              ) : (
                <img
                  src={previewContent.url}
                  alt={previewContent.type === 'signature' ? 'Signature' : 'Preview'}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResponsesPage