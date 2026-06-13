import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  timeLimit: {
    type: Number,
    required: [true, 'Please add a time limit in minutes']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Please add total marks']
  },
  questions: [{
    questionText: {
      type: String,
      required: true
    },
    options: [{
      type: String,
      required: true
    }],
    correctOptionIndex: {
      type: Number,
      required: true
    }
  }]
});

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
