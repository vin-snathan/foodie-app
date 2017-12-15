const mongoose = require('mongoose');
const User = require('./User');

const commentSchema = new mongoose.Schema({
	content: String,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	created: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Comment', commentSchema);