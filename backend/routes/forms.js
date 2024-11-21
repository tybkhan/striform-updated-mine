const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const { AppError } = require('../middleware/errorHandler');
const auth = require('../middleware/auth');

// Validation rules
const formValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Form title cannot be empty'),
  
  body('questions')
    .optional()
    .isArray()
    .withMessage('Questions must be an array'),
  
  body('questions.*.id')
    .optional()
    .isString()
    .withMessage('Question ID must be a string'),
  
  body('questions.*.type')
    .optional()
    .isIn([
      'text',
      'longText',
      'number',
      'multipleChoice',
      'checkbox',
      'date',
      'email',
      'signature',
      'statement',
      'url',
      'singleSelect',
      'fileUpload'
    ])
    .withMessage('Invalid question type'),
  
  body('questions.*.question')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Question text cannot be empty'),
  
  body('questions.*.options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),
  
  body('questions.*.required')
    .optional()
    .isBoolean()
    .withMessage('Required field must be a boolean'),
  
  body('questions.*.visible')
    .optional()
    .isBoolean()
    .withMessage('Visible field must be a boolean'),
  
  body('questions.*.fileUploadConfig')
    .optional()
    .isObject()
    .withMessage('File upload config must be an object')
];

// Get all forms for authenticated user
router.get('/', auth, async (req, res, next) => {
  try {
    console.log('Fetching forms for user:', req.user.userId);
    const forms = await Form.find({ userId: req.user.userId })
      .select('-__v')
      .sort({ createdAt: -1 });
    console.log('Found forms:', forms.length);
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    next(new AppError('Error fetching forms', 500));
  }
});

// Get a specific form
router.get('/:id', async (req, res, next) => {
  try {
    console.log('Fetching form:', req.params.id);
    const form = await Form.findOne({ id: req.params.id });
    if (!form) {
      return next(new AppError('Form not found', 404));
    }
    res.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    next(new AppError('Error fetching form', 500));
  }
});

// Create a new form
router.post('/', auth, formValidation, async (req, res, next) => {
  try {
    console.log('Creating new form for user:', req.user.userId);
    const formData = {
      ...req.body,
      userId: req.user.userId
    };
    console.log('Form data:', formData);

    const form = new Form(formData);
    const newForm = await form.save();
    console.log('Form created:', newForm.id);
    res.status(201).json(newForm);
  } catch (error) {
    console.error('Error creating form:', error);
    next(new AppError(error.message || 'Error creating form', 500));
  }
});

// Update a form
router.put('/:id', auth, formValidation, async (req, res, next) => {
  try {
    console.log('Updating form:', req.params.id);
    
    // Find the form by id field, not _id
    const existingForm = await Form.findOne({ id: req.params.id });
    
    if (!existingForm) {
      return next(new AppError('Form not found', 404));
    }

    // Update all fields except id and userId
    Object.keys(req.body).forEach(key => {
      if (key !== 'id' && key !== 'userId') {
        existingForm[key] = req.body[key];
      }
    });

    // Save the updated form
    const updatedForm = await existingForm.save();
    
    console.log('Form updated:', updatedForm.id);
    res.json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    next(new AppError('Error updating form', 500));
  }
});

// Delete a form
router.delete('/:id', auth, async (req, res, next) => {
  try {
    console.log('Deleting form:', req.params.id);
    const form = await Form.findOneAndDelete({
      id: req.params.id,
      userId: req.user.userId
    });
    
    if (!form) {
      return next(new AppError('Form not found', 404));
    }
    
    console.log('Form deleted:', req.params.id);
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    next(new AppError('Error deleting form', 500));
  }
});

module.exports = router;