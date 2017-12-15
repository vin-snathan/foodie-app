const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
	firstName: String,
	lastName: String,
	birthday: {
		date: String,
		month: String,
		year: String
	},
	username: String,
	password: String,
	created: {type: Date, default: Date.now}
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);