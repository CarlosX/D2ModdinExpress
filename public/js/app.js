// Generated by CoffeeScript 1.7.1
(function() {
  "use strict";
  var app;

  window.readysound = new buzz.sound("http://static.d2modd.in/d2moddin/match_ready.ogg");

  app = angular.module("d2mp", ["ngRoute", "d2mp.controllers", "d2mp.filters", "d2mp.services", "d2mp.directives", 'angulartics', 'angulartics.google.analytics']).config([
    "$routeProvider", "$locationProvider", "$sceDelegateProvider", function($routeProvider, $locationProvider, $sceDelegateProvider) {
      $sceDelegateProvider.resourceUrlWhitelist(["**"]);
      $routeProvider.when("/", {
        templateUrl: "partials/home",
        controller: "HomeCtrl"
      });
      $routeProvider.when("/about", {
        templateUrl: "partials/about",
        controller: "AboutCtrl"
      });
      $routeProvider.when("/lobbies/:modname?", {
        templateUrl: "partials/lobbylist",
        controller: "LobbyListCtrl"
      });
      $routeProvider.when("/mods", {
        templateUrl: "partials/mods",
        controller: "ModsCtrl"
      });
      $routeProvider.when("/mods/:modname", {
        templateUrl: "partials/moddetail",
        controller: "ModDetailCtrl"
      });
      $routeProvider.when("/install/:modname", {
        templateUrl: "partials/installmod",
        controller: "InstallModCtrl"
      });
      $routeProvider.when("/newlobby", {
        templateUrl: "/partials/newlobby",
        controller: "CreateLobbyCtrl"
      });
      $routeProvider.when("/lobby/:lobbyid", {
        templateUrl: "/partials/lobby",
        controller: "LobbyCtrl"
      });
      $routeProvider.when('/setup', {
        templateUrl: '/partials/setup',
        controller: 'LoadTestCtrl'
      });
      $routeProvider.when('/dotest', {
        templateUrl: '/partials/dotest',
        controller: 'DoTestCtrl'
      });
      $routeProvider.when('/results/:page', {
        templateUrl: '/partials/resultlist',
        controller: 'ResultListCtrl'
      });
      $routeProvider.when('/results', {
        redirectTo: '/results/1'
      });
      $routeProvider.otherwise({
        redirectTo: "/"
      });
      return $locationProvider.html5Mode(true);
    }
  ]).run([
    "$rootScope", "$lobbyService", "$forceLobbyPage", (function(_this) {
      return function($rootScope, $lobbyService, $forceLobbyPage) {
        $rootScope.mods = [];
        $rootScope.totalPlayerCount = function(lobby) {
          var count, plyr, _i, _j, _len, _len1, _ref, _ref1;
          count = 0;
          _ref = lobby.dire;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            plyr = _ref[_i];
            if (plyr != null) {
              count += 1;
            }
          }
          _ref1 = lobby.radiant;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            plyr = _ref1[_j];
            if (plyr != null) {
              count += 1;
            }
          }
          return count;
        };
        $rootScope.launchManager = function() {
          window.open("https://s3-us-west-2.amazonaws.com/d2mpclient/StartD2MP.exe");
          return $.pnotify({
            title: "Download Started",
            text: "Run the launcher (downloading now) to start joining lobbies.",
            type: "info",
            delay: 3000,
            closer: false,
            sticker: true
          });
        };
        $rootScope.GAMESTATE = {
          Init: 0,
          WaitLoad: 1,
          HeroSelect: 2,
          StratTime: 3,
          PreGame: 4,
          Playing: 5,
          PostGame: 6,
          Disconnect: 7
        };
        $rootScope.GAMESTATEK = _.invert($rootScope.GAMESTATE);
        $rootScope.REGIONS = {
          UNKNOWN: 0,
          NA: 1,
          EU: 2,
          CN: 4
        };
        $rootScope.REGIONSK = _.invert($rootScope.REGIONS);
        $rootScope.REGIONSH = {
          0: "All Regions",
          1: "North America",
          2: "Europe",
          4: "Southeast Asia"
        };
        $rootScope.playReadySound = _.debounce(function() {
          return window.readysound.play();
        }, 3000, true);
        $rootScope.LOBBYTYPES = {
          NORMAL: 0,
          PLAYERTEST: 1,
          MATCHMAKING: 2
        };
        return $.getJSON("/data/mods", function(data) {
          return $rootScope.$apply(function() {
            window.rootScope = $rootScope;
            return window.mods = $rootScope.mods = data;
          });
        });
      };
    })(this)
  ]);

  return;

}).call(this);
