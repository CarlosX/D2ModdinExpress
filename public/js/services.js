// Generated by CoffeeScript 1.4.0
(function() {
  "use strict";

  var LobbyService, QueueService, global;

  global = this;

  QueueService = (function() {

    function QueueService($rootScope, authService, safeApply, http) {
      var _this = this;
      this.authService = authService;
      this.safeApply = safeApply;
      this.http = http;
      this.totalCount = 201150;
      this.inQueue = true;
      this.myPos = 500;
      this.invited = false;
      $rootScope.$on("auth:data", function(event, data) {
        return _this.safeApply($rootScope, function() {
          if (data.queue != null) {
            _this.totalCount = data.queue.totalCount;
            _this.inQueue = data.queue.inQueue;
            _this.invited = data.queue.invited;
            _this.myPos = (data.queue.queueID + 1) - data.queue.totalInvited;
            return _this.originalPos = data.queue.queueID + 1;
          }
        });
      });
    }

    QueueService.prototype.joinQueue = function() {
      var _this = this;
      return this.http({
        method: 'POST',
        url: '/queue/joinQueue'
      }).success(function(data, status, headers, config) {
        if (data.error) {
          $.pnotify({
            title: "Queue Error",
            text: data.error,
            type: "error"
          });
        }
        return _this.authService.update();
      });
    };

    QueueService.prototype.tryUseKey = function(key) {
      var _this = this;
      return this.http({
        method: 'POST',
        url: '/queue/tryUseKey',
        data: {
          key: key
        }
      }).success(function(data, status, headers, config) {
        if (data.error) {
          $.pnotify({
            title: "Key Error",
            text: data.error,
            type: "error"
          });
        } else {
          $.pnotify({
            title: "Key Claimed",
            text: "That key has been claimed!",
            type: "success"
          });
        }
        return _this.authService.update();
      });
    };

    return QueueService;

  })();

  LobbyService = (function() {

    function LobbyService($rootScope, $authService, queue, safeApply) {
      this.queue = queue;
      this.safeApply = safeApply;
      this.lobbies = [];
      this.publicLobbies = [];
      this.socket = null;
      this.scope = $rootScope;
      this.auth = $authService;
      this.hasAuthed = false;
      this.hasAttemptedConnection = false;
      this.status = {
        managerConnected: false,
        managerStatus: "Manager status unknown, checking...",
        managerDownloading: false
      };
      this.colls = {
        lobbies: this.lobbies,
        publicLobbies: this.publicLobbies
      };
    }

    LobbyService.prototype.disconnect = function() {
      if (this.socket !== null) {
        this.socket.close();
        this.socket = null;
      }
      this.hasAuthed = false;
      this.lobbies.length = 0;
      this.publicLobbies.length = 0;
      return console.log("Disconnected.");
    };

    LobbyService.prototype.send = function(data) {
      if (!(this.socket != null)) {
        return;
      }
      return this.socket.publish('data', data);
    };

    LobbyService.prototype.call = function(method, params) {
      var data;
      data = {
        id: method,
        req: params
      };
      return this.send(data);
    };

    LobbyService.prototype.leaveLobby = function() {
      return this.call("leavelobby");
    };

    LobbyService.prototype.installMod = function(modname) {
      this.call("installmod", {
        mod: modname
      });
      return this.status.managerDownloading = true;
    };

    LobbyService.prototype.switchTeam = function(goodguys) {
      return this.call("switchteam", {
        team: goodguys ? "radiant" : "dire"
      });
    };

    LobbyService.prototype.startQueue = function() {
      return this.call("startqueue", null);
    };

    LobbyService.prototype.joinLobby = function(id) {
      return this.call("joinlobby", {
        LobbyID: id
      });
    };

    LobbyService.prototype.changeRegion = function(region) {
      return this.call("setregion", {
        region: region
      });
    };

    LobbyService.prototype.sendConnect = function() {
      return this.call("connectgame", null);
    };

    LobbyService.prototype.stopFinding = function() {
      return this.call("stopqueue", null);
    };

    LobbyService.prototype.usePassword = function(pass) {
      return this.call("joinpasswordlobby", {
        password: pass
      });
    };

    LobbyService.prototype.changePassword = function(pass) {
      return this.call("setpassword", {
        password: pass
      });
    };

    LobbyService.prototype.changeTitle = function(title) {
      return this.call("setname", {
        name: title
      });
    };

    LobbyService.prototype.sendChat = function(msg) {
      return this.call("chatmsg", {
        message: msg
      });
    };

    LobbyService.prototype.kickPlayer = function(player) {
      return this.call('kickplayer', {
        steam: player.steam
      });
    };

    LobbyService.prototype.createLobby = function(name, modid) {
      return this.call("createlobby", {
        name: name,
        mod: modid
      });
    };

    LobbyService.prototype.sendAuth = function() {
      if (!this.auth.isAuthed || !this.queue.invited) {
        console.log("Not authed or not invited, not sending auth.");
        return this.disconnect();
      } else {
        if (!this.hasAuthed) {
          if (!(this.socket != null)) {
            return this.connect();
          } else {
            return this.send({
              id: 'auth',
              uid: this.auth.user._id,
              key: this.auth.token
            });
          }
        }
      }
    };

    LobbyService.prototype.handleMsg = function(data) {
      var _this = this;
      switch (data.msg) {
        case "error":
          return $.pnotify({
            title: "Lobby Error",
            text: data.reason,
            type: "error"
          });
        case "chat":
          return this.scope.$broadcast('lobby:chatMsg', data.message);
        case "modneeded":
          return this.scope.$broadcast('lobby:modNeeded', data.name);
        case "installres":
          this.status.managerDownloading = false;
          return this.scope.$broadcast('lobby:installres', data.success);
        case "colupd":
          return this.safeApply(this.scope, function() {
            var coll, eve, id, idx, lobby, obj, op, upd, _c, _i, _j, _len, _len1, _ref, _ref1, _results;
            _ref = data.ops;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              upd = _ref[_i];
              if (!(upd != null)) {
                continue;
              }
              coll = _this.colls[upd._c];
              _c = upd._c;
              eve = "lobbyUpdate:" + _c;
              op = upd._o;
              delete upd["_o"];
              delete upd["_c"];
              switch (op) {
                case "insert":
                  coll.push(upd);
                  break;
                case "update":
                  id = upd._id;
                  delete upd["_id"];
                  obj = _.findWhere(coll, {
                    _id: id
                  });
                  if (obj != null) {
                    _.extend(obj, upd);
                  }
                  break;
                case "remove":
                  id = upd._id;
                  if (!(id != null)) {
                    coll.length = 0;
                  } else {
                    obj = _.findWhere(coll, {
                      _id: id
                    });
                    if (obj != null) {
                      idx = coll.indexOf(obj);
                      if (idx !== -1) {
                        coll.splice(idx, 1);
                      }
                    }
                  }
              }
              if (_c === "lobbies") {
                _ref1 = _this.lobbies;
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                  lobby = _ref1[_j];
                  lobby.dire = _.without(lobby.dire, null);
                  lobby.radiant = _.without(lobby.radiant, null);
                }
              }
              _results.push(_this.scope.$broadcast(eve, op));
            }
            return _results;
          });
      }
    };

    LobbyService.prototype.reconnect = function() {
      var _this = this;
      if (!this.auth.isAuthed || !this.queue.invited) {
        console.log("Not re-connecting as we aren't logged in/not invited.");
        return;
      }
      return setTimeout(function() {
        return _this.connect();
      }, 3000);
    };

    LobbyService.prototype.connect = function() {
      var so,
        _this = this;
      this.disconnect();
      console.log("Attempting connection...");
      this.socket = so = new XSockets.WebSocket('ws://ddp2.d2modd.in:4502/BrowserController');
      so.on('auth', function(data) {
        if (data.status) {
          $.pnotify({
            title: "Authenticated",
            text: "You are now authenticated with the lobby server.",
            type: "success"
          });
          return _this.hasAuthed = true;
        } else {
          _this.lobbies.length = 0;
          _this.publicLobbies.length = 0;
          _this.scope.$digest();
          $.pnotify({
            title: "Deauthed",
            text: "You are no longer authed with the lobby server.",
            type: "error"
          });
          return _this.hasAuthed = false;
        }
      });
      so.on('lobby', function(msg) {
        return _this.handleMsg(msg);
      });
      so.on('manager', function(msg) {
        if (msg.msg === 'status') {
          if (msg.status) {
            _this.status.managerConnected = true;
            _this.status.managerStatus = "Manager running and ready.";
          } else {
            _this.status.managerConnected = false;
            _this.status.managerStatus = "Manager is not connected.";
          }
          return _this.scope.$digest();
        }
      });
      so.on("close", function() {
        _this.status.managerConnected = false;
        _this.status.managerStatus = "You have lost connection with the lobby server...";
        _this.disconnect();
        _this.scope.$digest();
        if (!_this.hasAttemptedConnection) {
          _this.hasAttemptedConnection = true;
          $.pnotify({
            title: "Disconnected",
            text: "Disconnected from the lobby server.",
            type: "error"
          });
        }
        return _this.reconnect();
      });
      return so.on("open", function(clientinfo) {
        console.log("OnOpen");
        _this.hasAttemptedConnection = false;
        $.pnotify({
          title: "Connected",
          text: "Connected to the lobby server",
          type: "success"
        });
        _this.lobbies.length = 0;
        _this.publicLobbies.length = 0;
        _this.scope.$digest();
        return _this.sendAuth();
      });
    };

    return LobbyService;

  })();

  angular.module("d2mp.services", []).factory("safeApply", [
    "$rootScope", function($rootScope) {
      return function($scope, fn) {
        var phase;
        phase = $rootScope.$$phase;
        if (phase === "$apply" || phase === "$digest") {
          if (fn) {
            $scope.$eval(fn);
          }
        } else {
          if (fn) {
            $scope.$apply(fn);
          } else {
            $scope.$apply();
          }
        }
      };
    }
  ]).factory("$authService", [
    "$interval", "$http", "$log", "$rootScope", "safeApply", function($interval, $http, $log, $rootScope, safeApply) {
      var authService, updateAuth;
      updateAuth = function() {
        $http({
          method: "GET",
          url: "/data/authStatus"
        }).success(function(data, status, headers, config) {
          if (data.isAuthed !== authService.isAuthed) {
            $log.log("Authed: " + data.isAuthed);
          }
          authService.isAuthed = data.isAuthed;
          authService.user = data.user;
          $rootScope.$broadcast("auth:isAuthed", data.isAuthed);
          $rootScope.$broadcast("auth:data", data);
          authService.user = data.user;
          authService.token = data.token;
        }).error(function(data, status, headers, config) {
          $log.log("Error fetching auth status: " + data);
        });
      };
      authService = {};
      authService.update = updateAuth;
      updateAuth();
      $interval(updateAuth, 15000);
      return authService;
    }
  ]).factory("$lobbyService", [
    "$interval", "$log", "$authService", "$queueService", "$rootScope", "safeApply", function($interval, $log, $authService, $queueService, $rootScope, safeApply) {
      var service;
      service = new LobbyService($rootScope, $authService, $queueService, safeApply);
      $rootScope.$on("auth:data", function(event, data) {
        if ($authService.isAuthed) {
          return service.sendAuth();
        } else {
          return service.disconnect();
        }
      });
      global.service = service;
      return service;
    }
  ]).factory("$queueService", [
    "$authService", "$rootScope", "safeApply", "$http", function($authService, $rootScope, safeApply, $http) {
      var service;
      service = new QueueService($rootScope, $authService, safeApply, $http);
      global.queue = service;
      return service;
    }
  ]).factory('$forceLobbyPage', [
    '$rootScope', '$location', '$lobbyService', '$authService', '$queueService', '$timeout', "safeApply", function($rootScope, $location, $lobbyService, $authService, $queueService, $timeout, safeApply) {
      $rootScope.$on('lobbyUpdate:lobbies', function(event, op) {
        var path;
        path = $location.path();
        if (op === 'update' || op === 'insert') {
          if (path.indexOf('lobby/') === -1 && $lobbyService.lobbies.length > 0) {
            return safeApply($rootScope, function() {
              return $location.url("/lobby/" + $lobbyService.lobbies[0]._id);
            });
          }
        } else {
          if (path.indexOf('lobby/') !== -1) {
            return safeApply($rootScope, function() {
              return $location.path('/lobbies');
            });
          }
        }
      });
      $rootScope.$on('lobby:installres', function(event, success) {
        if (success) {
          return $location.url('/lobbies/');
        }
      });
      $rootScope.$on('lobby:modNeeded', function(event, mod) {
        return safeApply($rootScope, function() {
          return $location.url('/install/' + mod);
        });
      });
      return $rootScope.$on('$locationChangeStart', function(event, newurl, oldurl) {
        window.FundRazr = void 0;
        $("#fr_hovercard-outer").remove();
        if (!$queueService.invited && newurl.indexOf('lobb') !== -1) {
          event.preventDefault();
          return $timeout(function() {
            return $location.url("/invitequeue");
          });
        }
        if ($lobbyService.lobbies.length > 0) {
          if (newurl.indexOf('/lobby/') !== -1) {
            return;
          }
          event.preventDefault();
          if (oldurl.indexOf('lobby/') === -1) {
            return safeApply($rootScope, function() {
              return $location.url("/lobby/" + $lobbyService.lobbies[0]._id);
            });
          }
        } else {
          if (newurl.indexOf('/lobby/') !== -1) {
            return $location.url('/lobbies');
          }
        }
      });
    }
  ]);

}).call(this);
