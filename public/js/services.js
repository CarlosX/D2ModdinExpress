// Generated by CoffeeScript 1.7.1
(function() {
  "use strict";
  var LobbyService, NotService, global;

  global = this;

  NotService = (function() {
    function NotService(http) {
      this.http = http;
      this.notifications = [];
      this.pnots = [];
    }

    NotService.prototype.clear = function() {
      var noti, _i, _len, _ref;
      _ref = this.pnots;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        noti = _ref[_i];
        if ((noti != null) && (noti.remove != null)) {
          noti.remove();
        }
      }
      return this.pnots.length = 0;
    };

    NotService.prototype.render = function() {
      var noti, opts, _i, _len, _ref, _results;
      _ref = this.notifications;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        noti = _ref[_i];
        opts = {
          hide: false,
          buttons: {
            closer: true,
            sticker: false
          },
          nonblock: {
            nonblock: false
          },
          stack: {
            "dir1": "right",
            "dir2": "up",
            "push": "top"
          },
          addclass: "stack-bottomleft"
        };
        _.extend(opts, noti);
        _results.push(this.pnots.push($.pnotify(opts)));
      }
      return _results;
    };

    NotService.prototype.fetch = function() {
      return this.http.get('/data/nots').success((function(_this) {
        return function(data, status) {
          _this.notifications = data;
          _this.clear();
          return _this.render();
        };
      })(this));
    };

    return NotService;

  })();

  LobbyService = (function() {
    function LobbyService($rootScope, $authService, safeApply) {
      this.safeApply = safeApply;
      this.lobbies = [];
      this.publicLobbies = [];
      this.matchmake = [];
      this.friends = [];
      this.socket = null;
      this.isDuplicate = false;
      this.scope = $rootScope;
      this.auth = $authService;
      this.hasAuthed = false;
      this.hasAttemptedConnection = false;
      this.status = {
        managerConnected: false,
        managerStatus: "Connecting to the lobby server...",
        managerDownloading: false
      };
      this.FRIENDSTATUS = {
        NotRegistered: 0,
        Offline: 1,
        Online: 2,
        Idle: 3,
        InLobby: 4,
        Spectating: 5,
        InGame: 6
      };
      this.friendstatus = "Loading...";
      this.colls = {
        lobbies: this.lobbies,
        publicLobbies: this.publicLobbies,
        matchmake: this.matchmake,
        friends: this.friends
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
      this.friends.length = 0;
      this.matchmake.length = 0;
      return console.log("Disconnected.");
    };

    LobbyService.prototype.send = function(data) {
      if (this.socket == null) {
        return;
      }
      return this.socket.publish('data', data);
    };

    LobbyService.prototype.startLoadTest = function() {
      return this.call("startLoadTest", {});
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

    LobbyService.prototype.joinLobby = _.debounce(function(id) {
      return this.call("joinlobby", {
        LobbyID: id
      });
    }, 1000, true);

    LobbyService.prototype.changeRegion = function(region) {
      return this.call("setregion", {
        region: region
      });
    };

    LobbyService.prototype.sendConnect = function() {
      return this.call("connectgame", null);
    };

    LobbyService.prototype.exitMatchmake = function() {
      return this.call("stopmatchmake", null);
    };

    LobbyService.prototype.startMatchmake = function(mods) {
      return this.call("matchmake", {
        mods: mods
      });
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

    LobbyService.prototype.inviteFriend = function(steamid) {
      return this.call('invitefriend', {
        steamid: steamid
      });
    };

    LobbyService.prototype.joinFriendLobby = function(steamid) {
      return this.call('joinfriendlobby', {
        steamid: steamid
      });
    };

    LobbyService.prototype.sendAuth = function() {
      if (!this.auth.isAuthed) {
        console.log("Not authed, not sending auth.");
        return this.disconnect();
      } else {
        if (!this.hasAuthed) {
          if (this.socket == null) {
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
      console.log(_.clone(data));
      switch (data.msg) {
        case "error":
          $.pnotify({
            title: "Lobby Error",
            text: data.reason,
            type: "error"
          });
          return this.scope.$broadcast('lobby:error', data.reason);
        case "chat":
          return this.scope.$broadcast('lobby:chatMsg', data.message);
        case "modneeded":
          return this.scope.$broadcast('lobby:modNeeded', data.name);
        case "invite":
          console.log("Invite received, " + data.source + ", " + data.mod);
          this.scope.$broadcast('friend:invite', {
            steam: data.source,
            modname: data.mod
          });
          return window.invitesound.play();
        case "testneeded":
          return this.scope.$broadcast('lobby:testNeeded', data.name);
        case "updatemods":
          return this.scope.$broadcast('mods:updated');
        case "installres":
          this.status.managerDownloading = false;
          return this.scope.$broadcast('lobby:installres', data.success, data.message);
        case "colupd":
          return this.safeApply(this.scope, (function(_this) {
            return function() {
              var coll, eve, id, idx, lobby, obj, op, upd, _c, _i, _j, _len, _len1, _ref, _ref1, _results;
              _ref = data.ops;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                upd = _ref[_i];
                if (upd == null) {
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
                    if (id == null) {
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
            };
          })(this));
      }
    };

    LobbyService.prototype.reconnect = function() {
      if (!this.auth.isAuthed || this.isDuplicate) {
        console.log("Not re-connecting as we aren't logged in/are a duplicate.");
        return;
      }
      return setTimeout((function(_this) {
        return function() {
          return _this.connect();
        };
      })(this), 3000);
    };

    LobbyService.prototype.connect = function() {
      var so;
      this.disconnect();
      if (!this.auth.isAuthed || this.isDuplicate) {
        console.log("Not connecting as we aren't logged in/are a duplicate.");
        return;
      }
      console.log("Attempting connection...");
      this.socket = so = new XSockets.WebSocket('ws://net1.d2modd.in:4502/BrowserController');
      so.on('duplicate', (function(_this) {
        return function(data) {
          return _this.safeApply(_this.scope, function() {
            _this.lobbies.length = 0;
            _this.publicLobbies.length = 0;
            _this.isDuplicate = true;
            $.pnotify({
              title: "Duplicate",
              text: "You have opened a new D2Moddin browser window/tab, and disconnected this session. Refresh to re-connect this browser tab.",
              type: "error",
              hide: false
            });
            return _this.status.managerStatus = "Already open in another tab. Refresh to re-try connection.";
          });
        };
      })(this));
      so.on('auth', (function(_this) {
        return function(data) {
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
            _this.friends.length = 0;
            _this.scope.$digest();
            $.pnotify({
              title: "Deauthed",
              text: "You are no longer authed with the lobby server.",
              type: "error"
            });
            return _this.hasAuthed = false;
          }
        };
      })(this));
      so.on('updatemods', (function(_this) {
        return function(msg) {
          return _this.handleMsg(msg);
        };
      })(this));
      so.on('publicLobbies', (function(_this) {
        return function(msg) {
          return _this.handleMsg(msg);
        };
      })(this));
      so.on('invite', (function(_this) {
        return function(msg) {
          return _this.handleMsg(msg);
        };
      })(this));
      so.on('lobby', (function(_this) {
        return function(msg) {
          return _this.handleMsg(msg);
        };
      })(this));
      so.on('friend', (function(_this) {
        return function(msg) {
          return _this.handleMsg(msg);
        };
      })(this));
      so.on('manager', (function(_this) {
        return function(msg) {
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
        };
      })(this));
      so.on("close", (function(_this) {
        return function() {
          _this.disconnect();
          _this.safeApply(_this.scope, function() {
            _this.lobbies.length = 0;
            _this.publicLobbies.length = 0;
            _this.status.managerConnected = false;
            if (!_this.isDuplicate) {
              return _this.status.managerStatus = "You have lost connection with the lobby server...";
            }
          });
          if (!_this.hasAttemptedConnection) {
            _this.hasAttemptedConnection = true;
            $.pnotify({
              title: "Disconnected",
              text: "Disconnected from the lobby server.",
              type: "error"
            });
          }
          return _this.reconnect();
        };
      })(this));
      return so.on("open", (function(_this) {
        return function(clientinfo) {
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
        };
      })(this));
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
          if (data.version !== window.d2version) {
            $.pnotify({
              title: "Out of Date",
              text: "Your browser will refresh in a few seconds to download the new web app.",
              type: "info",
              close: false
            });
            window.setTimeout((function(_this) {
              return function() {
                return window.location.reload(true);
              };
            })(this), 5000);
          }
        }).error(function(data, status, headers, config) {
          $log.log("Error fetching auth status: " + data);
        });
      };
      authService = {};
      authService.update = updateAuth;
      updateAuth();
      $interval(updateAuth, 60000);
      return authService;
    }
  ]).factory("$notService", [
    "$http", function($http) {
      return new NotService($http);
    }
  ]).factory("$lobbyService", [
    "$interval", "$log", "$authService", "$rootScope", "safeApply", function($interval, $log, $authService, $rootScope, safeApply) {
      var service;
      service = new LobbyService($rootScope, $authService, safeApply);
      $(window).unload(service.disconnect);
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
  ]).factory('$handleInvites', [
    "$rootScope", "$lobbyService", function($rootScope, $lobbyService) {
      return $rootScope.$on("friend:invite", function(event, data) {
        var friend;
        friend = _.findWhere($lobbyService.friends, {
          _id: data.steam
        });
        if (friend == null) {
          return $.pnotify({
            title: "Invite Failed",
            text: "An unknown friend (" + data.steam + ") has sent you an invite to a lobby.",
            type: "error",
            delay: 5000
          });
        } else {
          return bootbox.dialog({
            message: "" + friend.name + " has invited you to join their " + data.modname + " lobby.",
            title: "Invite",
            buttons: {
              decline: {
                label: "Ignore",
                className: "btn-danger",
                callback: function() {
                  return $.pnotify({
                    title: "Invite Declined",
                    text: "Invite from " + friend.name + " has been declined.",
                    type: "info"
                  });
                }
              },
              accept: {
                label: "Accept & Join",
                className: "btn-success",
                callback: function() {
                  return service.joinFriendLobby(data.steam);
                }
              }
            }
          });
        }
      });
    }
  ]).factory("leaderboard", [
    '$resource', function($resource) {
      return $resource('/data/leaders/:name', {
        name: "reflex"
      }, {
        get: {
          method: "GET",
          isArray: true
        }
      });
    }
  ]).factory("matchResult", [
    '$resource', function($resource) {
      return $resource('/data/match/:match_id', {}, {
        get: {
          method: "GET",
          isArray: false
        }
      });
    }
  ]).factory("matchResults", [
    '$resource', function($resource) {
      return $resource('/data/matches/:page', {
        page: 1
      }, {
        get: {
          method: "GET",
          isArray: false
        }
      });
    }
  ]).factory('$forceLobbyPage', [
    '$rootScope', '$location', '$lobbyService', '$authService', '$timeout', "safeApply", function($rootScope, $location, $lobbyService, $authService, $timeout, safeApply) {
      $rootScope.$on('lobbyUpdate:matchmake', function(event, op) {
        var path;
        path = $location.path();
        if (op === 'update' || op === 'insert') {
          if ($lobbyService.matchmake.length > 0) {
            if ($location.url().indexOf('matchmake') === -1) {
              $timeout((function(_this) {
                return function() {
                  return $location.url('/matchmake');
                };
              })(this));
            }
          }
        } else {
          if (path.indexOf('matchmake') !== -1) {
            return safeApply($rootScope, function() {
              return $location.path('/ranked');
            });
          }
        }
      });
      $rootScope.$on('lobbyUpdate:lobbies', function(event, op) {
        var lobby, path;
        path = $location.path();
        if (op === 'update' || op === 'insert') {
          if ($lobbyService.lobbies.length > 0 && $lobbyService.lobbies[0].LobbyType === 1) {
            if ($location.url().indexOf('dotest') === -1) {
              $timeout((function(_this) {
                return function() {
                  return $location.url('/dotest');
                };
              })(this));
              return;
            }
          }
          lobby = $lobbyService.lobbies[0];
          if (lobby.radiant.length + lobby.dire.length === 10 && lobby.creatorid === $authService.user._id && lobby.status === 0) {
            $rootScope.playReadySound();
          }
          if (path.indexOf('lobby/') === -1 && $lobbyService.lobbies.length > 0) {
            return safeApply($rootScope, function() {
              return $location.url("/lobby/" + $lobbyService.lobbies[0]._id);
            });
          }
        } else {
          if (path.indexOf('lobby/') !== -1 || path.indexOf('dotest') !== -1) {
            return safeApply($rootScope, function() {
              return $location.path('/lobbies');
            });
          }
        }
      });
      $rootScope.$on('lobby:installres', function(event, success, message) {
        $.pnotify({
          title: "Install Result",
          text: message,
          type: success ? "success" : "error",
          delay: 5000
        });
        if (success && $location.url().indexOf('setup') === -1) {
          return $location.url('/lobbies/');
        }
      });
      $rootScope.$on('lobby:modNeeded', function(event, mod) {
        if ($location.url().indexOf('setup') !== -1) {
          $pnotify({
            title: "Install Needed",
            text: "You still need to install the " + mod + " mod before you can start.",
            type: "error",
            delay: 4000
          });
          return;
        }
        return safeApply($rootScope, function() {
          return $location.url('/install/' + mod);
        });
      });
      $rootScope.$on('lobby:testNeeded', function(event, mod) {
        return safeApply($rootScope, function() {
          return $location.url('/setup');
        });
      });
      return $rootScope.$on('$locationChangeStart', function(event, newurl, oldurl) {
        window.FundRazr = void 0;
        $("#fr_hovercard-outer").remove();
        if ($lobbyService.matchmake.length > 0) {
          if (newurl.indexOf('matchmake') !== -1) {
            return;
          }
          event.preventDefault();
          if (oldurl.indexOf('matchmake') === -1) {
            return safeApply($rootScope, function() {
              return $location.url('/matchmake');
            });
          }
        } else if ($lobbyService.lobbies.length > 0) {
          if ($lobbyService.lobbies[0].LobbyType === 1) {
            if (newurl.indexOf('dotest') !== -1) {
              return;
            }
            event.preventDefault();
            if (oldurl.indexOf('dotest') === -1) {
              return $location.url('/dotest');
            }
          } else if ($lobbyService.lobbies[0].LobbyType === 0) {
            if (newurl.indexOf('/lobby/') !== -1) {
              return;
            }
            event.preventDefault();
            if (oldurl.indexOf('lobby/') === -1) {
              return safeApply($rootScope, function() {
                return $location.url("/lobby/" + $lobbyService.lobbies[0]._id);
              });
            }
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
