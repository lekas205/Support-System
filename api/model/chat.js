const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ChatSchema = new Schema({
  username:{
    type: String,
    required:true
  },
  senderString:{
    type: String,
    required:true
  },
  adminString: {
      type: String,
      default: 'unattended'
  },
  chatMessages:{
      type:Array,
  }
});
module.exports = User = mongoose.model('chats', ChatSchema);