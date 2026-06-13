import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Please add total marks']
  },
  referenceMaterial: {
    type: String,
    default: ''
  }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
