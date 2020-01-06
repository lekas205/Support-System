const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  username:{
      type: String,
      required:true
  },
  uniqueString:{
    type: String,
    required:true
  },
  status:{
    type: String,
    default: '0'
  }

});

module.exports = User = mongoose.model('users', UserSchema);