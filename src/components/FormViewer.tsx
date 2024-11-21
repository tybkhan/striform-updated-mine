import React, { useState, useRef } from 'react'
import { Form, FormQuestion } from '../types'
import { ArrowRight, Check, Upload } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import SignatureCanvas from 'react-signature-canvas'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

interface FormViewerProps {
  form: Form
  isPreview?: boolean
  onComplete?: (formId: string, answers: Record<string, any>) => void
}

const FormViewer: React.FC<FormViewerProps> = ({ form, isPreview = false, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const signatureRef = useRef<SignatureCanvas>(null)
  const questionRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentQuestion = form.questions[currentQuestionIndex]

  const handleAnswer = async (answer: any) => {
    if (!currentQuestion) return

    if (currentQuestion.type === 'fileUpload' && answer instanceof FileList) {
      const files = Array.from(answer)
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          const reader = new FileReader()
          return new Promise((resolve) => {
            reader.onload = () => {
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: reader.result
              })
            }
            reader.readAsDataURL(file)
          })
        })
      )
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: processedFiles }))
    } else if (currentQuestion.type === 'contactInfo') {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          ...answer
        }
      }))
    } else {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))
    }
  }

  const renderQuestion = (question: FormQuestion) => {
    const answer = answers[question.id]

    switch (question.type) {
      case 'contactInfo':
        return (
          <div className="space-y-4">
            {question.contactFields?.firstName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name {question.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={answer?.firstName || ''}
                  onChange={(e) => {
                    const currentAnswer = answer || {}
                    handleAnswer({ ...currentAnswer, firstName: e.target.value })
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required={question.required}
                />
              </div>
            )}

            {question.contactFields?.lastName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name {question.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={answer?.lastName || ''}
                  onChange={(e) => {
                    const currentAnswer = answer || {}
                    handleAnswer({ ...currentAnswer, lastName: e.target.value })
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required={question.required}
                />
              </div>
            )}

            {question.contactFields?.email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email {question.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  value={answer?.email || ''}
                  onChange={(e) => {
                    const currentAnswer = answer || {}
                    handleAnswer({ ...currentAnswer, email: e.target.value })
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required={question.required}
                />
              </div>
            )}

            {question.contactFields?.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone {question.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="tel"
                  value={answer?.phone || ''}
                  onChange={(e) => {
                    const currentAnswer = answer || {}
                    handleAnswer({ ...currentAnswer, phone: e.target.value })
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required={question.required}
                />
              </div>
            )}

            {question.contactFields?.company && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company {question.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={answer?.company || ''}
                  onChange={(e) => {
                    const currentAnswer = answer || {}
                    handleAnswer({ ...currentAnswer, company: e.target.value })
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required={question.required}
                />
              </div>
            )}
          </div>
        )

      case 'text':
        return (
          <input
            type="text"
            value={answer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter your answer"
            required={question.required}
          />
        )

      case 'longText':
        return (
          <textarea
            value={answer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={4}
            placeholder="Enter your answer"
            required={question.required}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={answer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="0"
            required={question.required}
          />
        )

      case 'multipleChoice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.id}
                  checked={answer === option}
                  onChange={() => handleAnswer(option)}
                  required={question.required}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(answer) ? answer.includes(option) : false}
                  onChange={(e) => {
                    const currentAnswers = Array.isArray(answer) ? answer : []
                    const updatedAnswers = e.target.checked
                      ? [...currentAnswers, option]
                      : currentAnswers.filter(a => a !== option)
                    handleAnswer(updatedAnswers)
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case 'date':
        return (
          <input
            type="date"
            value={answer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required={question.required}
          />
        )

      case 'email':
        return (
          <input
            type="email"
            value={answer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="email@example.com"
            required={question.required}
          />
        )

      case 'signature':
        return (
          <div>
            <div className="border border-gray-300 rounded-md">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-40',
                }}
                onEnd={() => {
                  if (signatureRef.current) {
                    handleAnswer(signatureRef.current.toDataURL())
                  }
                }}
              />
            </div>
            <button
              onClick={() => {
                if (signatureRef.current) {
                  signatureRef.current.clear()
                  handleAnswer(null)
                }
              }}
              className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear Signature
            </button>
          </div>
        )

      case 'statement':
        return (
          <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-sm">
            <ReactMarkdown 
              className="prose prose-purple max-w-none"
              components={{
                h3: ({node, ...props}) => <h3 className="text-2xl font-bold text-purple-800 mb-4" {...props} />,
                p: ({node, ...props}) => <p className="text-gray-600 mb-3" {...props} />,
                em: ({node, ...props}) => <em className="text-purple-600 font-medium" {...props} />
              }}
            >
              {question.statement || ''}
            </ReactMarkdown>
          </div>
        )

      case 'url':
        return (
          <input
            type="url"
            value={answer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="https://example.com"
            required={question.required}
          />
        )

      case 'fileUpload':
        return (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) {
                  handleAnswer(e.target.files)
                }
              }}
              multiple
              className="hidden"
              required={question.required}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <Upload className="inline-block mr-2" size={20} />
              Upload File(s)
            </button>
            {answer && Array.isArray(answer) && (
              <ul className="mt-2">
                {answer.map((file: any, index: number) => (
                  <li key={index} className="text-sm text-gray-600">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                  </li>
                ))}
              </ul>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const goToNextQuestion = () => {
    if (currentQuestion.required && !answers[currentQuestion.id]) {
      alert('This question is required')
      return
    }

    if (currentQuestionIndex < form.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (!isPreview) {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!isPreview && onComplete) {
      try {
        await onComplete(form.id, answers)
        setIsSubmitted(true)

        if (form.redirectUrl) {
          window.location.href = form.redirectUrl
        }
      } catch (error) {
        console.error('Error submitting form:', error)
        alert('Failed to submit form. Please try again.')
      }
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ 
        background: form.backgroundColor || 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
      }}>
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
          <Check size={64} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
          <p className="text-xl text-gray-600 mb-8">Your form has been submitted successfully.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ 
      background: form.backgroundColor || 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
    }}>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: form.titleColor || 'inherit' }}>
          {form.title}
        </h1>
        {form.description && (
          <p className="text-gray-600 mb-8 text-center" style={{ color: form.descriptionColor || 'inherit' }}>
            <ReactMarkdown>{form.description}</ReactMarkdown>
          </p>
        )}
        <TransitionGroup>
          <CSSTransition
            key={currentQuestionIndex}
            timeout={300}
            classNames="fade"
            nodeRef={questionRef}
          >
            <div ref={questionRef}>
              {currentQuestion && (
                <div className="mb-6" style={{ textAlign: form.textAlign || 'left' }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: form.questionColor || 'inherit' }}>
                    {currentQuestion.question}
                    {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
                  </h2>
                  {renderQuestion(currentQuestion)}
                </div>
              )}
            </div>
          </CSSTransition>
        </TransitionGroup>
        <div className="flex justify-between items-center mt-8">
          <div className="text-gray-500">
            Question {currentQuestionIndex + 1} of {form.questions.length}
          </div>
          <button
            onClick={goToNextQuestion}
            className="text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors duration-300 flex items-center"
            style={{ backgroundColor: form.submitButtonColor || '#6366F1' }}
          >
            {currentQuestionIndex === form.questions.length - 1 ? (
              form.buttonText || 'Submit'
            ) : (
              'Next'
            )}
            <ArrowRight className="ml-2" size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default FormViewer