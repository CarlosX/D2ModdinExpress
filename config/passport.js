var SteamStrategy = require('passport-steam').Strategy;
var User = require('../schema/user');
var Steam = require('steam-webapi');
Steam.key = process.env.STEAM_KEY||"CBD4B6FF1511AD17841196BCE6B1E3E4";
Steam.ready(function(err){
  console.log("Steam web api ready.");
});

var ROOT_URL = process.env.ROOT_URL || "http://alpha.d2modd.in/";

module.exports = function(passport){
  passport.serializeUser(function(user, done){
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
      done(err, user);
    });
  });

  passport.use('steam', new SteamStrategy({
    returnURL: ROOT_URL+"auth/steam/return",
    realm: ROOT_URL,
    apiKey: Steam.key
  },
  function(identifier, profile, done){
    var steamid = identifier.split('/');
    steamid = steamid[steamid.length-1];
    new Steam().getPlayerSummaries({steamids: steamid}, function(err, data){
      if(err)
        return done(err);
      profile = data.players[0];
      User.findOne({'steam.steamid': identifier.steamid}, function(err, user){
        if(err)
          return done(err);
        if(user){
          user.steam = identifier;
          user.profile.name = profile.personaname;
          return done(null, user);
        }else{
          require('crypto').randomBytes(48, function(ex, buf){
            var newUser = new User();
            newUser._id = buf.toString('hex');
            newUser.steam = profile;
            newUser.profile.name = profile.personaname;
            newUser.authItems = [];
            newUser.save(function(err){
              if(err)
                throw err;
              return done(null, newUser);
            });
          });
        }
      })
    });
  }));
};