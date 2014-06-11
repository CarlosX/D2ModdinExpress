"use strict"

global = @

class LobbyService
  constructor:($rootScope, $authService)->
    @lobbies = []
    @publicLobbies = [
      _id: "someid"
      banned: []
      creator: "Quantum"
      creatorid: "someid"
      deleted: false
      devMode: false
      dire: [null,null,null,null,null]
      radiant: [null,null,null,null,null]
      enableGG: true
      hasPassword: false
      isPublic: true
      mod: "ura55vChSgFo6LHgz"
      name: "Test Lobby"
      password: ""
      region: 1
      requiresFullLobby: true
      serverIP: ""
      state: 0
      status: 0
    ]
    @socket = null
    @scope = $rootScope
    @auth = $authService
    @hasAuthed = false
    @status =
      managerConnected: false
      managerStatus: "Manager status unknown, checking..."
      managerDownloading: false
    @colls =
      lobbies: @lobbies
      publicLobbies: @publicLobbies
  
  disconnect: ->
    if @socket != null
      @socket = null
    @hasAuthed = false
    console.log "Disconnected."

  send: (data)->
    return if !@socket?
    @socket.publish 'data', data

  call: (method, params)->
    data =
      id: method
      req: params
    console.log data
    @send data

  installMod: (modname)->
    @call "installmod",
      mod: modname
    @status.managerDownloading = true
    @scope.$digest()

  createLobby: (name, modid)->
    @call "createlobby",
      name: name
      mod: modid

  sendAuth: ()->
    if !@auth.isAuthed
      @disconnect()
    else
      if !@hasAuthed
        if !@socket?
          @connect()
        else
          @send
            id: 'auth'
            uid: @auth.user._id
            key: @auth.token

  handleMsg: (data)->
    switch data.msg
      when "error"
        $.pnotify
          title: "Lobby Error"
          text: data.reason
          type: "error"
      when "chat"
        @scope.$broadcast 'lobby:chatMsg', data.message
      when "modneeded"
        @scope.$broadcast 'lobby:modNeeded', data.name
      when "installres"
        @status.managerDownloading = false
        @scope.$broadcast 'lobby:installres', data.success
      when "colupd"
        for upd in data.ops
          coll = @colls[upd._c]
          eve = "lobbyUpdate:"+upd._c
          op = upd._o
          delete upd["_o"]
          delete upd["_c"]
          switch op
            when "insert"
              coll.push upd
            when "update"
              id = upd._id
              delete upd["_id"]
              obj = _.findWhere coll, {_id: id}
              if obj?
                _.extend obj, upd
            when "remove"
              id = upd._id
              obj = _.findWhere coll, {_id: id}
              if obj?
                idx = coll.indexOf obj
                if idx isnt -1
                  coll.splice idx, 1
          @scope.$emit eve, op
  connect: ->
    @disconnect()
    console.log "Attempting connection..."
    @socket = so = new XSockets.WebSocket 'ws://127.0.0.1:4502/BrowserController'
    so.on 'auth', (data)=>
      if data.status
        $.pnotify
          title: "Authenticated"
          text: "You are now authenticated with the lobby server."
          type: "success"
        @hasAuthed = true
      else
        @lobbies.length = 0
        @publicLobbies.length = 0
        @scope.$digest()
        $.pnotify
          title: "Deauthed"
          text: "You are no longer authed with the lobby server."
          type: "error"
        @hasAuthed = false
    so.on 'lobby', (msg)=>
      @handleMsg msg
    so.on 'manager', (msg)=>
      if msg.msg is 'status'
        if msg.status
          @status.managerConnected = true
          @status.managerStatus = "Manager running and ready."
        else
          @status.managerConnected = false
          @status.managerStatus = "Manager is not connected."
        @scope.$digest()
    so.on "close", =>
      @lobbies.length = 0
      @publicLobbies.length = 0
      @status.managerConnected = false
      @status.managerStatus = "You have lost connection with the lobby server..."
      @scope.$digest()
      @socket = null
      $.pnotify
        title: "Disconnected"
        text: "Disconnected from the lobby server."
        type: "error"
    so.on "open", (clientinfo)=>
      console.log "OnOpen"
      $.pnotify
        title: "Connected"
        text: "Connected to the lobby server"
        type: "success"
      @lobbies.length = 0
      @publicLobbies.length = 0
      @scope.$digest()
      @sendAuth()
    
angular.module("d2mp.services", []).factory("$authService", [
  "$interval"
  "$http"
  "$log"
  "$rootScope"
  ($interval, $http, $log, $rootScope) ->
    updateAuth = ->
      $http(
        method: "GET"
        url: "/data/authStatus"
      ).success((data, status, headers, config) ->
        if data.isAuthed != authService.isAuthed
          $log.log "Authed: "+data.isAuthed
          authService.isAuthed = data.isAuthed
          $rootScope.$broadcast "auth:isAuthed", data.isAuthed
        authService.user = data.user
        authService.token = data.token
        return
      ).error (data, status, headers, config) ->
        $log.log "Error fetching auth status: " + data
        return

      return
    authService = {}
    authService.update = updateAuth
    updateAuth()
    $interval updateAuth, 60000
    return authService
]).factory("$lobbyService", [
  "$interval"
  "$log"
  "$authService"
  "$rootScope"
  ($interval, $log, $authService, $rootScope)->
    service = new LobbyService $rootScope, $authService
    $rootScope.$on "auth:isAuthed", ->
      service.sendAuth()
    service.sendAuth()
    global.service = service
    service
]).factory('$forceLobbyPage', [
  '$rootScope'
  '$location'
  '$lobbyService'
  ($rootScope, $location, $lobbyService)->
    $rootScope.$on 'lobbyUpdate:lobbies', (op)->
      if op in ['update', 'insert'] 
        if $location.path() isnt "lobby"
          $location.url "/lobby/"+$lobbyService.lobbies[0]._id
          $rootScope.$apply()
      else
        if $location.path() is "lobby"
          $location.path('/lobbies')
          $rootScope.$apply()
    $rootScope.$on 'lobby:modNeeded', (event, mod)->
      $location.url '/install/'+mod
      $rootScope.$apply()
    $rootScope.$on '$locationChangeStart', (event, newurl, oldurl)->
      if $lobbyService.lobbies.length > 0
        event.preventDefault()
        if $location.path() isnt "lobby"
          $location.url "/lobby/"+$lobbyService.lobbies[0]._id
          $rootScope.$apply()
      else
        if newurl.indexOf('/lobby/') != -1
          $location.url('/lobbies')
          $rootScope.$apply()
])
