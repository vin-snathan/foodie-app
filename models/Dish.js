const mongoose = require("mongoose");
const User = require('./User');
const Comment = require('./Comments');

const dishSchema = new mongoose.Schema({
	title: String,
	image: String,
	description: String,
	restaurant: String,
	price: String,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment" 
	}],
	created: {type: Date, default: Date.now}
});

module.exports = mongoose.model("Dish", dishSchema);