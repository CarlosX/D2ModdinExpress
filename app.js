var express = require('express'),
bodyParser = require('body-parser'),
methodOverride = require('method-override'),
morgan = require('morgan'),
routes = require('./routes'),
http = require('http'),
stylus = require('stylus'),
mongoose = require('mongoose'),
passport = require('passport'),
flash = require('connect-flash'),
favicon = require('serve-favicon'),
nib = require('nib'),
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
session = require('express-session'),
path = require('path'),
cluster = require('cluster');
require('coffee-script/register');
var _ = require('underscore');

var cacheOpts = {
    max:25,
    maxAge:1000*60*2//cache for 2min
};
require('mongoose-cache').install(mongoose, cacheOpts);

var useCluster = process.env.USE_CLUSTER != null;

//process.on('uncaughtException', function(err) {
//    console.log('Caught exception: ' + err);
//});

http.globalAgent.maxSockets = 50;
if(cluster.isMaster&&useCluster){
  var cpuCount = 3;
  for (var i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }
  cluster.on('exit', function (worker) {
    console.log('Worker ' + worker.id + ' died :(');
    cluster.fork();
  });
}else{
  mongoose.connect(process.env.MONGO_URL, function(err){
    if(err)
      console.log(err);

    var MongoStore = require('connect-mongo')(session);

    var app = module.exports = express();

    function compile(str, path){
      return stylus(str)
      .set('filename', path)
      .use(nib());
    }

    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    if(process.env.NODE_ENV !== "production")
      app.use(morgan('dev'));
    app.use(favicon(__dirname + '/public/images/favicon.png'));
    app.use(cookieParser(process.env.SESSION_SECRET||"justanrpg"));
    app.use(bodyParser());
    app.use(session({
      secret: process.env.SESSION_SECRET||"justanrpg",
      cookie: {
        maxAge: 86400000
      },
      store: new MongoStore({
        url: process.env.MONGO_URL||"mongodb://localhost/d2moddin"
      })
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    if(process.env.NODE_ENV !== "production"){
      app.use(stylus.middleware(
        {
        src: __dirname+'/public'
        , compile: compile
      }
      ));
    }
    app.use(methodOverride());
    app.use(express.static(path.join(__dirname, 'public')));

    require('./config/passport')(passport);

    var env = process.env.NODE_ENV || 'development';

    app.get('/', routes.index);
    app.get('/partials/:name', routes.partials);
    app.get('/data/mods', routes.modList);
    app.get('/data/nots', routes.notList);

    //Auth
    app.get('/auth/steam', passport.authenticate('steam', {failureRedirect: '/'}), function(req, res){ res.redirect('/'); });

    app.get('/auth/steam/return', passport.authenticate('steam', {failureRedirect: '/'}), function(req, res){ res.redirect('/'); });

    app.get('/logout', function(req, res){
      req.logout();
      res.redirect('/');
    });

    app.get('/data/authStatus', function(req, res){
      var resp = {};
      resp.isAuthed = req.user != null;
      if(req.user){
        resp.token = req.sessionID;
        resp.user = {
          _id: req.user._id,
          steam: req.user.steam,
          profile: req.user.profile,
          authItems: req.user.authItems
        };
      }
      res.json(resp);
    });

    app.get('*', routes.index);

    http.createServer(app).listen(app.get('port'), function () {
      if(useCluster)
        console.log('Worker '+cluster.worker.id+' running on port ' + app.get('port'));
      else
        console.log('Server running on port '+app.get('port'));
    });

  });
}
