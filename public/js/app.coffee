"use strict"
app = angular.module("d2mp", [
  "ngRoute"
  "d2mp.controllers"
  "d2mp.filters"
  "d2mp.services"
  "d2mp.directives"
  'angulartics'
  'angulartics.google.analytics'
]).config([
  "$routeProvider"
  "$locationProvider"
  "$sceDelegateProvider"
  ($routeProvider, $locationProvider, $sceDelegateProvider) ->
    $sceDelegateProvider.resourceUrlWhitelist ["**"]
    $routeProvider.when "/",
      templateUrl: "partials/home"
      controller: "HomeCtrl"

    $routeProvider.when "/about",
      templateUrl: "partials/about"
      controller: "AboutCtrl"

    $routeProvider.when "/lobbies/:modname?",
      templateUrl: "partials/lobbylist"
      controller: "LobbyListCtrl"

    $routeProvider.when "/mods",
      templateUrl: "partials/mods"
      controller: "ModsCtrl"

    $routeProvider.when "/mods/:modname",
      templateUrl: "partials/moddetail"
      controller: "ModDetailCtrl"

    $routeProvider.when "/install/:modname",
      templateUrl: "partials/installmod"
      controller: "InstallModCtrl"

    $routeProvider.when "/newlobby",
      templateUrl: "/partials/newlobby"
      controller: "CreateLobbyCtrl"

    $routeProvider.when "/lobby/:lobbyid",
      templateUrl: "/partials/lobby"
      controller: "LobbyCtrl"

    $routeProvider.when '/invitequeue',
      templateUrl: '/partials/invitequeue'
      controller: 'InviteQueueCtrl'
    
    $routeProvider.when '/loadtest'
      templateUrl: '/partials/loadtest'
      controller: 'LoadTestCtrl'

    $routeProvider.otherwise redirectTo: "/"
    return $locationProvider.html5Mode(true)
]).run([
  "$rootScope"
  "$lobbyService"
  "$forceLobbyPage"
  ($rootScope, $lobbyService, $forceLobbyPage) =>
    $rootScope.mods = []

    $rootScope.totalPlayerCount = (lobby)->
      count = 0
      for plyr in lobby.dire
        count+=1 if plyr?
      for plyr in lobby.radiant
        count+=1 if plyr?
      count

    $rootScope.launchManager = ->
      window.open "https://s3-us-west-2.amazonaws.com/d2mpclient/D2MPUpdater.exe"
      $.pnotify
        title: "Download Started"
        text: "Run the launcher (downloading now) to start joining lobbies."
        type: "info"
        delay: 3000
        closer: false
        sticker: true

    $rootScope.GAMESTATE = {Init:0,WaitLoad:1,HeroSelect:2,StratTime:3,PreGame:4,Playing:5,PostGame:6,Disconnect:7}
    $rootScope.GAMESTATEK = _.invert $rootScope.GAMESTATE

    $rootScope.REGIONS =
      UNKNOWN: 0
      NA: 1
      EU: 2
      AUS: 3
      CN: 4

    $rootScope.REGIONSK = _.invert($rootScope.REGIONS)
    $rootScope.REGIONSH =
      0: "All Regions"
      1: "North America"
      2: "Europe"
      3: "Australia"
      4: "Southeast Asia"
    
    $rootScope.LOBBYTYPES =
      NORMAL: 0
      PLAYERTEST: 1
      MATCHMAKING: 2

    $.getJSON "/data/mods", (data) ->
      $rootScope.$apply ->
        window.rootScope = $rootScope
        window.mods = $rootScope.mods = data
])
return
