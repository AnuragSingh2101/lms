import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please add a lesson title'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  youtubeId: {
    type: String,
    required: [true, 'Please add a YouTube video ID']
  },
  notesPdf: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    required: [true, 'Please add lesson duration (e.g. 15 mins)']
  },
  order: {
    type: Number,
    default: 0
  }
});

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
