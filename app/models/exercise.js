var mongoose = require("mongoose");

var ExerciseSchema = new mongoose.Schema({
  name: String,
  description: String,
  duration: Number,
  date: Date,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

var Exercise = mongoose.model('Exercise', ExerciseSchema, 'exercise_exercises');

module.exports = {
  Exercise: Exercise
}