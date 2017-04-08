/* global _ef, document, window */
(function () {
  'use strict';

  angular
    .module('vizamp')
    .service('WebAppService', WebAppService);

  /** @ngInject */
  function WebAppService($http, $config, $user, localStorageService, $rootScope) {

    var
      vizList = [],
      userData = {},
      comments = [],
      page = 0,
      PAGE_SIZE = 20
      ;

    function httpGet() {
      var path = [$config.servicesEndpoint];
      for (var i = 0; i < arguments.length; i++) {
        path.push(arguments[i]);
      }
      return $http.get(path.join('/'));
    }

    function httpPost(method, data) {
      var path = [
        $config.servicesEndpoint,
        method
      ];
      return $http.post(path.join('/'), data);
    }

    function httpDelete(pathParam) {
      var path = [$config.servicesEndpoint].concat(pathParam);
      return $http.delete(path.join('/'));
    }

    function reloadVizList(callback) {
      vizList.length = 0;
      page = 0;
      getVizList(callback);
    }

    function getVizList(callback) {
      if (page === 0) {
        loadMoreVizList(callback);
      }
      else {
        callback(vizList);
      }
    }

    function loadMoreVizList(callback, fail) {
      httpGet('getVizList', page, PAGE_SIZE)
        .success(function (data) {
          data.forEach(function (viz) {
            // don't allow duplicates. Can happen sometimes when a viz is added from another playlist
            var i, exists = false;
            for (i = 0; i < vizList.length; i++) {
              if (viz.id === vizList[i].id) {
                exists = true;
              }
            }
            if (!exists) {
              vizList.push(viz);
            }
          });
          page++;
          if (callback) {
            callback(vizList);
          }
          applyFav(true);
          applyMyViz(true);
        })
        .error(fail || _ef);
    }

    function getViz(id, success, fail) {
      var viz = _.find(vizList, {id:id});
      if(viz) {
        if (success) {
          success(viz);
        }
      }
      else {
        httpGet('getViz', id)
          .success(function (data) {
            vizList.push(data);
            if (success) {
              success(data);
            }
          })
          .error(fail || _ef);
      }
    }

    function getVizById(id) {
      for (var i = 0; i < vizList.length; i++) {
        if (vizList[i].id === id) {
          return vizList[i];
        }
      }
    }

    function login(usernameOrEmail, password, success, fail) {
      httpPost('login', {
        usernameOrEmail: usernameOrEmail,
        password: password // plaintext is ok over https
      })
        .success(function (data) {
          loggedIn(data);
          if (success) {
            success();
          }
        })
        .error(fail || _ef);
    }

    function logout() {
      $user.authenticated = false;
      $user.userId = '';
      $user.username = '';
      $user.userType = -1;
      localStorageService.remove('accessToken');
      angular.copy({}, userData);
      delete $http.defaults.headers.common.Authorization;
      applyFav(false);
      applyMyViz(false);
      $rootScope.$emit('loggedOut');
    }

    function register(username, email, password, success, fail) {
      httpPost('register', {
        username: username,
        email: email,
        password: password // plaintext is ok over https
      })
        .success(function (data) {
          loggedIn(data);
          if (success) {
            success();
          }
        })
        .error(fail || _ef);
    }

    function signInWithFacebook(accessToken, userId, firstName, lastName, email, success, fail) {
      httpPost('signInWithFacebook', {
        accessToken: accessToken,
        userId: userId,
        firstName: firstName,
        lastName: lastName,
        email: email
      })
        .success(function (data) {
          loggedIn(data);
          if (success) {
            success();
          }
        })
        .error(fail || _ef);
    }

    function signInWithGoogle(idToken, googleUserId, givenName, familyName, email, success, fail) {
      httpPost('signInWithGoogle', {
        idToken: idToken,
        googleUserId: googleUserId,
        givenName: givenName,
        familyName: familyName,
        email: email
      })
        .success(function (data) {
          loggedIn(data);
          if (success) {
            success();
          }
        })
        .error(fail || _ef);
    }

    function session(callbackHasSession, callbackNoSession) {
      var accessToken = localStorageService.get('accessToken');

      if (accessToken) {
        $http.defaults.headers.common.Authorization = accessToken;
        httpGet('session')
          .success(function (data) {
            loggedIn(data);
            callbackHasSession();
          })
          .error(function () {
            callbackNoSession();
          });
      }
      else {
        callbackNoSession();
      }
    }

    function loggedIn(data) {
      angular.copy(data, userData);
      $http.defaults.headers.common.Authorization = data.accessToken;
      localStorageService.set('accessToken', data.accessToken);
      $user.authenticated = true;
      $user.userId = data.userId;
      $user.username = data.username;
      $user.userType = data.userType;
      // add user viz to the vizList
      if (data.vizList) {
        for (var i = 0; i < data.vizList.length; i++) {
          var viz = data.vizList[i];
          if (_.findIndex(vizList, {id: viz.id}) === -1) {
            vizList.push(viz);
          }
        }
      }
      applyFav(true);
      applyMyViz(true);
      $rootScope.$emit('loggedIn');
    }

    function isUsernameUnique(username, success, fail) {
      httpGet('isUsernameUnique', username)
        .success(success || _ef)
        .error(fail || _ef);
    }

    function forgot(email, success, fail) {
      httpGet('forgot', email)
        .success(success || _ef)
        .error(fail || _ef);
    }

    function resetPassword(resetToken, newPassword, success, fail) {
      httpPost('resetPassword', {
        resetToken: resetToken,
        newPassword: newPassword
      })
        .success(success || _ef)
        .error(fail || _ef);
    }

    function getUserProfile(userId, success, fail) {
      httpPost('getUserProfile', {
        userId: userId,
        page: 0
      })
        .success(success || _ef)
        .error(fail || _ef);
    }

    function getUserViz(userId, page, success, fail) {
      httpPost('getUserViz', {
        userId: userId,
        page: page
      })
        .success(success || _ef)
        .error(fail || _ef);
    }

    function fav(vizId, isFav, success, fail) {
      httpPost('fav', {
        vizId: vizId,
        isFav: isFav
      })
        .success(success || _ef)
        .error(fail || _ef);
    }

    function applyFav(isFav) {
      vizList.forEach(function (viz) {
        if (isFav && userData.favs) {
          viz.isFav = userData.favs.indexOf(viz.id) > -1;
        }
        else {
          viz.isFav = false;
        }
      });
    }

    function applyMyViz(isMyViz) {
      vizList.forEach(function (viz) {
        if (isMyViz && userData.vizList) {
          viz.isMyViz = userData.userId === viz.userId;
        }
        else {
          viz.isMyViz = false;
        }
      });
    }

    function updatePreviewImage(viz, success, fail) {
      var thumbnail = getThumbnail();
      httpPost('updateVizPreviewImage', {
        vizId: viz.id || null,
        thumbnail: thumbnail
      })
      .success(function (data) {
        if(!data.path) {
          (fail || _ef)();
        }
        else {
          var i = _.findIndex(vizList, {id: viz.id});
          vizList[i].previewImage = data.path;
          success(data.path);
        }
      })
      .error(fail || _ef);
    }

    function updateVizName(viz, name, success, fail) {
      httpPost('updateVizName', {
        vizId: viz.id,
        name: name
      })
      .success(function () {
        var i = _.findIndex(vizList, {id: viz.id});
        vizList[i].name = name;
        success();
      })
      .error(fail || _ef);
    }

    function forkViz(name, vizId, success, fail) {
      httpPost('forkViz', {
        vizId: vizId,
        name: name
      })
      .success(function (data) {
        vizList.push(data);
        if(success) {
          success(data.id);
        }
      })
      .error(fail || _ef);
    }

    function createNewViz(name, type, success, fail){

      httpPost('createViz', {
        name: name,
        type: type,
      })
      .success(function(data) {
        vizList.push(data);
        if(success) {
          success(data.id);
        }
      })
      .error(fail || _ef);
    }

    function deleteViz(vizId, success, fail){
      httpDelete(['deleteViz', vizId])
      .success(function () {
        vizList.splice(_.findIndex(vizList, { id: vizId }), 1);
        if(success) {
          success();
        }
      })
      .error(fail || _ef);
    }

    function saveVizProperties(_viz, callback){
      httpPost('saveVizProperties', {
        vizId: _viz.id,
        properties: _viz.properties
      })
      .success(function(properties){
        var viz = _.find(vizList, { id: _viz.id });
        _.extend(viz.properties, properties);
        if(callback) {
          callback();
        }
      });
    }

    function updatePropertyScripts(viz){

      var propertyScripts = viz.propertyScripts.map(function(propertyScript){
        return {
          property: propertyScript.property,
          script: propertyScript.script
        }
      });

      httpPost('updatePropertyScripts', {
        vizId: viz.id,
        propertyScripts: propertyScripts
      })
      .success(function(){
        _.find(vizList, { id: viz.id }).propertyScripts = propertyScripts;
      });
    }

    function getImageDataUrl(){
      var canvasFrom = document.getElementById('player-canvas');

      var canvasTo = document.createElement("canvas");
      canvasTo.height = 512;
      canvasTo.width = Math.floor(canvasTo.height / canvasFrom.height * canvasFrom.width);
      var ctxTo = canvasTo.getContext('2d');
      ctxTo.drawImage(canvasFrom, 0, 0, canvasFrom.width, canvasFrom.height, 0, 0, canvasTo.width, canvasTo.height);
      return canvasTo.toDataURL('image/png');
    }

    function getThumbnail() {
      var dataURL = getImageDataUrl();
      return dataURL.replace(/^data:image\/png;base64,/, '');
    }

    function getPromos() {
      return [];
    }

    function viewViz(vizId) {
      httpGet('viewViz', vizId);
    }

    function vizNameUnique(name) {
      return httpGet('vizNameUnique', window.btoa(name));
    }

    function saveTrackList(rawTrackList) {
      var trackList = [];
      // only want some of the properties
      rawTrackList.forEach(function(track){
        if (!track.isLocal) {
          trackList.push({
            id: track.id,
            duration: track.duration || 0,
            genre: track.genre || '',
            title: track.title || '',
            description: track.description || '',
            uri: track.uri || '',
            user: {
              id: track.user.id || 0,
              username: track.user.username || ''
            },
            permalink_url: track.permalink_url || '',
            artwork_url: track.artwork_url || '',
            stream_url: track.stream_url || ''
          });
        }
      });
      return httpPost('saveTrackList', trackList);
    }

    function saveVizTracks(vizId, tracks){
      var viz = _.find(vizList, {id: vizId});
      viz.tracks = tracks;
      return httpPost('updateTracks', {
        vizId: vizId,
        tracks: tracks
      });
    }

    function removeVizTrack(vizId, index) {
      var viz = _.find(vizList, {id: vizId});
      viz.tracks.splice(index, 1);
      return httpPost('updateTracks', {
        vizId: vizId,
        tracks: viz.tracks
      });
    }

    function addVizTrack(vizId, track, success, fail) {
      var newTrack = {
        id: track.id,
        listName: 'viz',
        duration: track.duration,
        genre: track.genre,
        title: track.title,
        description: track.description,
        uri: track.uri,
        user: {
          id: track.user.id,
          username: track.user.username
        },
        permalink_url: track.permalink_url,
        artwork_url: track.artwork_url,
        stream_url: track.stream_url
      };
      var viz = _.find(vizList, {id: vizId});
      if(!viz.tracks) {
        viz.tracks = [];
      }
      viz.tracks.push(newTrack);

      httpPost('updateTracks', {
        vizId: vizId,
        tracks: viz.tracks
      })
        .success(function(){
          if(success) {
            success(newTrack);
          }
        })
        .error(fail || _ef);
    }


    function uploadImage(imageData){
      return httpPost('uploadImage', {
        imageData: imageData
      });
    }

    function tipUri(userId, dollars){
      return httpPost('tipUri', {
        userId: userId,
        dollars: dollars
      });
    }

    function uploadVizTexture(vizId, imageFile, success, fail){

      var image = new Image();
      console.dir(imageFile);
      var canvas = document.createElement('canvas');
      image.src = URL.createObjectURL(imageFile);

      image.onload = function(){
        canvas.width = image.width;
        canvas.height = image.height;

        canvas.getContext('2d').drawImage(image, 0, 0);
        var imageData = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, '');

        return httpPost('uploadVizTexture', {
          vizId: vizId,
          imageData: imageData
        })
        .success(function(data){
          var viz = _.find(vizList, {id: vizId});
          viz.properties.textures = data;
          success(data);
        })
        .error(fail);
      };
    }

    function updateVizTexture(vizId, vizTextures, success, fail){
      return httpPost('updateVizTexture', {
        vizId: vizId,
        vizTextures: vizTextures
      })
      .success(function(data){
        var viz = _.find(vizList, {id: vizId});
        viz.properties.textures = data;
        if(success) {
          success(data);
        }
      })
      .error(fail || _ef);
    }

    return {

      vizList: vizList,
      userData: userData,
      comments: comments,

      login: login,
      logout: logout,
      register: register,
      signInWithFacebook: signInWithFacebook,
      signInWithGoogle: signInWithGoogle,
      session: session,
      isUsernameUnique: isUsernameUnique,
      loadMoreVizList: loadMoreVizList,
      getVizList: getVizList,
      getViz: getViz,
      getVizById: getVizById,
      reloadVizList: reloadVizList,
      forgot: forgot,
      resetPassword: resetPassword,
      getUserProfile: getUserProfile,
      getUserViz: getUserViz,
      getPromos: getPromos,
      fav: fav,
      viewViz: viewViz,
      forkViz: forkViz,
      createNewViz: createNewViz,
      deleteViz: deleteViz,
      saveVizProperties: saveVizProperties,
      updatePreviewImage: updatePreviewImage,
      vizNameUnique: vizNameUnique,
      saveTrackList: saveTrackList,
      uploadImage: uploadImage,
      updateVizName: updateVizName,
      updatePropertyScripts: updatePropertyScripts,
      addVizTrack: addVizTrack,
      removeVizTrack: removeVizTrack,
      saveVizTracks: saveVizTracks,
      tipUri: tipUri,
      uploadVizTexture: uploadVizTexture,
      getImageDataUrl: getImageDataUrl,
      updateVizTexture: updateVizTexture
    };
  }
})();
