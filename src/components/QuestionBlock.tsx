import React, { useState } from 'react'
import { FormQuestion } from '../types'
import { Trash2, GripVertical, Plus, Settings } from 'lucide-react'
import LogicBuilder from './LogicBuilder'
import classNames from 'classnames'

interface QuestionBlockProps {
  question: FormQuestion
  onUpdate: (updatedQuestion: FormQuestion) => void
  onRemove: () => void
  onAddBlock: () => void
  dragHandleProps?: any
  isPro?: boolean
  allQuestions: FormQuestion[]
  onVisibilityChange?: (questionId: string, isVisible: boolean) => void
}

const QuestionBlock: React.FC<QuestionBlockProps> = ({
  question,
  onUpdate,
  onRemove,
  onAddBlock,
  dragHandleProps,
  isPro = false,
  allQuestions,
  onVisibilityChange
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [showLogic, setShowLogic] = useState(false)

  const handleUpdate = (field: keyof FormQuestion, value: any) => {
    onUpdate({ ...question, [field]: value })
  }

  const handleContactFieldToggle = (field: keyof Required<FormQuestion>['contactFields']) => {
    if (question.type === 'contactInfo' && question.contactFields) {
      const updatedFields = {
        ...question.contactFields,
        [field]: !question.contactFields[field]
      }
      onUpdate({
        ...question,
        contactFields: updatedFields
      })
    }
  }

  const renderContactFields = () => {
    if (question.type !== 'contactInfo' || !question.contactFields) return null

    return (
      <div className="space-y-2 mt-2">
        <div className="text-sm font-medium text-gray-700 mb-2">Enabled Fields:</div>
        {Object.entries(question.contactFields).map(([field, enabled]) => (
          <label key={field} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => handleContactFieldToggle(field as keyof Required<FormQuestion>['contactFields'])}
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
            />
            <span className="text-gray-700 capitalize">
              {field.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </label>
        ))}
      </div>
    )
  }

  const renderOptions = () => {
    if (!['multipleChoice', 'checkbox', 'singleSelect'].includes(question.type)) return null

    return (
      <div className="space-y-2 mt-2">
        {question.options?.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...(question.options || [])]
                newOptions[index] = e.target.value
                handleUpdate('options', newOptions)
              }}
              className="flex-1 p-2 border border-gray-300 rounded"
              placeholder={`Option ${index + 1}`}
            />
            <button
              onClick={() => {
                const newOptions = question.options?.filter((_, i) => i !== index)
                handleUpdate('options', newOptions)
              }}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          onClick={() => handleUpdate('options', [...(question.options || []), ''])}
          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          + Add Option
        </button>
      </div>
    )
  }

  return (
    <div className={classNames(
      "bg-white p-4 rounded-lg shadow-md mb-4 relative",
      { "opacity-50": question.visible === false }
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center flex-grow">
          <div {...dragHandleProps}>
            <GripVertical size={20} className="text-gray-400 mr-2 cursor-move" />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={question.question}
              onChange={(e) => handleUpdate('question', e.target.value)}
              className="flex-1 text-lg font-semibold bg-gray-100 border border-gray-300 rounded px-2 py-1"
              onBlur={() => setIsEditing(false)}
              autoFocus
            />
          ) : (
            <h3
              className="text-lg font-semibold cursor-pointer flex-grow"
              onClick={() => setIsEditing(true)}
            >
              {question.question}
            </h3>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLogic(!showLogic)}
            className="text-purple-600 hover:text-purple-700"
            title="Logic Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={onAddBlock}
            className="text-gray-500 hover:text-gray-700"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="mb-2">
        <select
          value={question.type}
          onChange={(e) => handleUpdate('type', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="text">Short Text</option>
          <option value="longText">Long Text</option>
          <option value="number">Number</option>
          <option value="multipleChoice">Multiple Choice</option>
          <option value="checkbox">Checkbox</option>
          <option value="date">Date</option>
          <option value="email">Email</option>
          <option value="signature">Signature</option>
          <option value="statement">Statement</option>
          <option value="url">URL</option>
          <option value="fileUpload">File Upload</option>
          <option value="contactInfo">Contact Info</option>
        </select>
      </div>

      {renderOptions()}
      {renderContactFields()}

      <div className="mt-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={question.required || false}
            onChange={(e) => handleUpdate('required', e.target.checked)}
            className="form-checkbox h-4 w-4 text-purple-600 rounded"
          />
          <span className="text-sm text-gray-700">Required field</span>
        </label>
      </div>

      {showLogic && (
        <LogicBuilder
          question={question}
          questions={allQuestions}
          onUpdateLogic={(questionId, logic) => handleUpdate('logic', logic)}
        />
      )}
    </div>
  )
}

export default QuestionBlock