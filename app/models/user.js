var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  }
});

var User = mongoose.model('User', UserSchema, 'exercise_users');

module.exports = {
  User: User
}