/*--------------

PACKAGE CONFIG

----------------*/
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const expressSession = require('express-session');

/*-----

MODELS

-------*/
const User = require('./models/User');
const Dish = require('./models/Dish');
const Comment = require('./models/Comments');

/*----------

APP CONFIG

------------*/
const app = express();
mongoose.connect('mongodb://localhost/foodie', {useMongoClient: true});
mongoose.Promise = global.Promise;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));

app.use(expressSession({
	secret: 'sai',
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(request, response, next) {
	response.locals.currentUser = request.user;
	next();
});

/*------------

ROUTES CONFIG

--------------*/
app.get('/', function(request, response) {
	response.render('landing');
});

app.get('/register', function(request, response) {
	response.render('register');
});

app.post('/register', function(request, response) {
	const newUser = new User({firstName: request.body.firstName, lastName: request.body.lastName, birthday: {date: request.body.date, month: request.body.month, year: request.body.year}, username: request.body.username});
	User.register(newUser, request.body.password, function(err, registeredUser) {
		if(err) {
			return response.redirect('/register');
		}

		passport.authenticate('local')(request, response, function() {
			response.redirect('/dishes');
		});
	})
});

app.get('/login', function(request, response) {
	response.render('login');
});

app.post('/login', passport.authenticate('local', {successRedirect: '/dishes', failureRedirect: '/login'}), function(request, response) { });

app.get('/dishes', function(request, response) {
	Dish.find({}, function(err, allDishes) {
		if(err) {
			console.log(err);
		} else {
			response.render('index', {allDishes});
		}
	})
});

app.get('/dishes/new', isLoggedIn, function(request, response) {
	response.render('newDish');
});

app.post('/dishes', isLoggedIn, function(request, response) {
	const dish = request.body.dish;
	dish.author = {
		id: request.user._id,
		username: `${request.user.firstName } ${request.user.lastName}`
	}

	Dish.create(dish, function(err, newDish) {
		if(err) {
			response.redirect('/dishes/new');
		} else {
			console.log(newDish);
			response.redirect('/dishes')
		}
	})
});

app.get('/dishes/:id', function(request, response) {
	Dish.findById(request.params.id).populate('comments').exec(function(err, foundDish) {
		if(err) {
			console.log(err);
		} else {
			response.render('showDish', {foundDish});
		}
	})
});

app.get('/dishes/:id/edit', isAuthorized, function(request, response) {
	Dish.findById(request.params.id, function(err, toEditDish) {
		if(err) {
			console.log(err);
		} else {
			response.render('editDish', {toEditDish});
		}
	})
});

app.put('/dishes/:id', isAuthorized, function(request, response) {
	Dish.findByIdAndUpdate(request.params.id, request.body.dish, function(err, toEditDish) {
		if(err) {
			response.redirect('/dishes/' + request.params.id + "/edit");
		} else {
			response.redirect('/dishes/' + request.params.id);
		}
	})
});

app.delete('/dishes/:id', isAuthorized, function(request, response) {
	Dish.findByIdAndRemove(request.params.id, function(err) {
		if(err) {
			response.redirect('/dishes/' + request.params.id);
		} else {
			response.redirect('/dishes');
		}
	});
});

app.get('/dishes/:id/comments/new', isLoggedIn, function(request, response) {
	Dish.findById(request.params.id, function(err, foundDish) {
		if(err) {
			console.log(err);
		} else {
			response.render('newComment', {foundDish});
		}
	});
});

app.post('/dishes/:id/comments', isLoggedIn,  function(request, response) {
	var newComment = request.body.comment;

	newComment.author = {
		id: request.user._id,
		username: `${request.user.firstName } ${request.user.lastName}`
	}

	Comment.create(newComment, function(err, newComment) {
		if(err) {
			console.log(err);
		} else {
			Dish.findById(request.params.id, function(err, foundDish) {
				if(err) {
					console.log(err);
				} else {
					foundDish.comments.push(newComment);
					foundDish.save();

					response.redirect('/dishes/' + request.params.id);
				}
			});
		}
	});
});

app.delete("/dishes/:dishId/comments/:commentId", commentAuthorized, function(request, response) {
	Comment.findByIdAndRemove(request.params.commentId, function(err) {
		if(err) {
			console.log(err);
		} else {
			response.redirect('/dishes/' + request.params.dishId);
		}
	});
});

app.get('/logout', function(request, response) {
	request.logout();
	response.redirect('/');
});

/*---------

MIDDLEWARE

-----------*/
function isLoggedIn(request, response, next) {
	if(request.isAuthenticated()) {
		return next()
	}

	response.redirect('/login');
}

function isAuthorized(request, response, next) {
	if(request.isAuthenticated()) {
		Dish.findById(request.params.id, function(err, dish) {
			if(dish.author.id.equals(request.user._id)) {
				return next();
			} else {
				response.redirect('/dishes/' + request.params.id);
			}
		});
	} else {
		response.redirect('/login');
	}
}

function commentAuthorized(request, response, next) {
	if(request.isAuthenticated()) {
		Comment.findById(request.params.commentId, function(err, foundComment) {
			if(foundComment.author.id.equals(request.user._id)) {
				return next();
			} else {
				response.redirect('/dishes/' + request.params.id);
			}
		});
	} else {
		response.redirect('/login');
	}
}

/*------------

SERVER CONFIG

--------------*/
app.listen(3000, function() {
	console.log('SERVER RUNNING');
});