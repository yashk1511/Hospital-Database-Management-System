const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
require('dotenv').config();

const authRoutes = require('./routes/auth-routes');
const schRoutes = require('./routes/schedule-routes');
const OrgAccount = require('./models/org');
const isAuth = require('./middleware/is-auth')
const MONGODB_URL = process.env.MONGODB_URL || process.env.DB_CONNECTION;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const store = new MongoDBStore({
  uri: MONGODB_URL,
  collection: 'sessions',
});

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));
console.log(__dirname);

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use((req, res, next) => {
  res.locals.isAuth = req.session.isLoggedIn;
  res.locals.csrfToken ="ASDF"
  next();
});

app.use((req, res, next) => {
  if (!req.session.org) {
    return next();
  }
  OrgAccount.findById(req.session.org._id)
    .then((org) => {
      if (!org) {
        return next();
      }
      req.org = org;
      next();
    })
    .catch((err) => {
      console.log(err);
    });
});

app.use('/schedule', isAuth, schRoutes);
app.use(authRoutes);

app.get('/', (req, res, next) => {
  res.render('home', {
    pageTitle: 'Home',
    msg: 'Clinic Management System',
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose.connect("mongodb://localhost:27017/DBMS",function(err,db) {
  if(err) throw err;
})
app.listen(5050, function() {
  console.log('Server is connected');
})