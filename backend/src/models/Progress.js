import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lessonsCompleted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  completionPercentage: {
    type: Number,
    default: 0
  },
  totalWatchTime: {
    type: Number,
    default: 0
  }
});

// Set compound unique index
progressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
