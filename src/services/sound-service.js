
class SoundService {

    var
      trackList = [],
      CLIENT_ID = '4ad7101759206aa4c9210e31e3ca6cc1', // todo put these in config file
      DEFAULT_PLAYLIST = 'https://soundcloud.com/vizamp/sets/vizamp',
      playMode = 'linear', // linear | repeat | shuffle
      currentTrackIndex = 0,
      LOAD_TRACK_RETRIES = 5,
      timeupdateCallbacks = [],
      endedCallbacks = [],
      loadingCallback,
      errorCount = 0,
      trackChangedCallback,
      setTrackIdCallback,
      trackMode = true, // from local
      soundStatus = {
        soundCloudAvailable: true,
        audioAvailable: true
      },
      trackListModified = false,
      getCurrentViz
      ;


    // todo this came from player controller
      EventBus.on('trackChange', () => {
          if(trackMode) {
              next();
          }
      });

      $rootScope.$on('loggedIn', function(){
      loadUserPlaylist();
      saveTrackList();
    });

    $rootScope.$on('loggedOut', function(){
      loadDefaultPlaylist();
    });

    function saveTrackList() {
      if($user.authenticated) {
        $timeout(saveTrackList, 10000);
        if(trackListModified) {
          WebAppService.saveTrackList(trackList);
          trackListModified = false;
        }
      }
    }

    //var
    //  request = indexedDB.open("VizampMusic", 3),
    //  db = null
    //  ;
    //request.onerror = function(event) {
    //  vodAlert('Error', 'Failed to open indexed db: ' + event.target.error);
    //};
    //request.onupgradeneeded = function(event) {
    //  db = event.target.result;
    //  db.createObjectStore('tracks', { autoIncrement : true });
    //};
    //request.onsuccess = function(event) {
    //  db = event.target.result;
    //};

    WebAudioPlayer.eventHandler('waiting', function () {
      if (loadingCallback) {
        loadingCallback(true);
      }
    });

    WebAudioPlayer.eventHandler('playing', function () {
      if (loadingCallback) {
        loadingCallback(false);
      }
      errorCount = 0;
      if (trackList[currentTrackIndex]) {
        trackList[currentTrackIndex].broken = false;
      }
    });

    WebAudioPlayer.eventHandler('timeupdate', function () {
      timeupdateCallbacks.forEach(function (callback) {
        callback(WebAudioPlayer.getTime(), WebAudioPlayer.getDuration());
      });
    });

    WebAudioPlayer.eventHandler('ended', function () {

      // embedded player doesn't hit next track or fire trackchanged
      if ($config.distro !== 'embedded' && playMode !== 'repeat') {
        next();
        $rootScope.$broadcast('trackChange'); // todo get rid of this and use the ended callback thing
      }
      endedCallbacks.forEach(function (callback) {
        callback();
      });
    });

    WebAudioPlayer.eventHandler('error', function () {
      if (errorCount < LOAD_TRACK_RETRIES) {
        playTrack(trackList[currentTrackIndex]);
        errorCount++;
      }
      else {
        trackList[currentTrackIndex].broken = true;
        if (loadingCallback) {
          loadingCallback(false);
        }
        $timeout(function () {
          next();
        }, 1000);
      }
    });

    function loadDefaultPlaylist() {
      resolve(DEFAULT_PLAYLIST,
        function (result) {
          if (result.tracks) {
            $timeout(function () {
              angular.copy(result.tracks, trackList);
            });
          }
        },
        function () {
          // fallback to music stored on S3 and flag soundcloud as not available
          soundStatus.soundCloudAvailable = false;
          $http.get($config.soundServerEndpoint + '/default.json')
            .success(function (data) {
              $timeout(function () {
                addTracks(data);
              });
            })
            .error(function () {
              vodAlert('Error', 'There was a problem loading the playlist from SoundCloud.');
            });
        }
      );
    }

    function getTrackList(callback) {
      callback(trackList);
    }

    function clearProgress() {
      if (trackList[currentTrackIndex]) {
        trackList[currentTrackIndex].progressPercent = '0%';
      }
    }

    function playTrackSample(track, success, fail) {
      if (!track.broken) {
        WebAudioPlayer.stop();

        var stream_url = track.stream_url;
        if (track.stream_url.startsWith($config.soundCloudEndpoint)) {
          stream_url += '?client_id=' + CLIENT_ID;
        }

        WebAudioPlayer.play(
          stream_url,
          success || _ef,
          fail || _ef
        );
      }
    }

    function playPause(_track) {
      //
      var track = trackList[currentTrackIndex];
      if (!_track) {
        _track = trackList[0];
      }
      if (track === _track && track.isPlaying) {
        WebAudioPlayer.pause();
        track.isPlaying = false;
      }
      else if (track && track === _track && !track.isPlaying) {
        WebAudioPlayer.play();
        track.isPlaying = true;
      }
      else if (track !== _track && !track.isPlaying) {
        playTrack(_track, 0);
      }
    }

    function playTrack(track, time) {
      time = time || 0;
      if (trackList[currentTrackIndex]) {
        trackList[currentTrackIndex].isPlaying = false;
      }
      if (currentTrackIndex !== trackList.indexOf(track)) {
        clearProgress();
        currentTrackIndex = trackList.indexOf(track);
      }
      if (trackChangedCallback) {
        trackChangedCallback(currentTrackIndex);
      }
      if (track && !track.broken) {

        setTrackIdCallback(track.id);
        WebAudioPlayer.stop();
        track.isPlaying = true;
        var stream_url = track.stream_url;
        if (stream_url.startsWith($config.soundCloudEndpoint)) {
          stream_url += '?client_id=' + CLIENT_ID;
        }
        WebAudioPlayer.play(stream_url);
        if (time) {
          WebAudioPlayer.setTime(time);
        }
      }
    }

    function getTimeDomainData() {
      if (WebAudioPlayer.isPlaying()) {
        return WebAudioPlayer.getTimeDomainData();
      }
    }

    function getByteFrequencyData() {
      if (WebAudioPlayer.isPlaying()) {
        return WebAudioPlayer.getByteFrequencyData();
      }
    }

    function playTrackById(trackId, time) {
      var index = trackList.indexOf(trackId);
      if (index > -1) {
        playTrack(trackList[index], time);
      }
      else {
        loadTrack(trackId, function () {
          playTrack(trackList[trackList.length - 1], time);
        });
      }
    }

    function addTimeupdateCallbacks(cb) {
      timeupdateCallbacks.push(cb);
    }

    function addEndedCallbacks(callback) {
      endedCallbacks.push(callback);
    }

    function setTrackPosition(position) {
      WebAudioPlayer.setTimePosition(position);
      timeupdateCallbacks.forEach(function (callback) {
        callback(WebAudioPlayer.getTime(), WebAudioPlayer.getDuration());
      });
    }

    function setPlayMode(pm) {
      playMode = pm;
    }

    function getPlayMode() {
      return playMode;
    }

    function play() {
      WebAudioPlayer.play();
    }

    function pause() {
      WebAudioPlayer.pause();
    }

    function resume() {
      WebAudioPlayer.resume();
    }


    function next() {
      clearProgress();
      if(trackMode) {
        var tracks = getCurrentViz().tracks;
        if(tracks && tracks.length) {
          var index = _.findIndex(tracks, { id: getCurrentId() });
          index = (index === -1 ? 0 : index + 1) % tracks.length;
          loadTrack(tracks[index].id,
            function(track){
              playTrack(track);
            }
          );
        }
        else {
          continueNextTracks();
        }
      }
      else {
        continueNextTracks();
      }
      playTrack(trackList[currentTrackIndex]);
    }

    function continueNextTracks(){
      switch (playMode) {
        case 'linear' :
          currentTrackIndex++;
          if (currentTrackIndex >= trackList.length) {
            currentTrackIndex = 0;
          }
          break;
        case 'repeat' :
          // do nothing let the track play again
          break;
        case 'shuffle' :
          currentTrackIndex = Math.floor(Math.random() * trackList.length);
          break;
      }
    }

    function previous() {

      clearProgress();
      if (playMode === 'linear') {
        currentTrackIndex--;
        if (currentTrackIndex < 0) {
          currentTrackIndex = trackList.length - 1;
        }
      }
      else {
        currentTrackIndex = Math.floor(Math.random() * trackList.length);
      }
      playTrack(trackList[currentTrackIndex]);
    }

    function loading(callback) {
      loadingCallback = callback;
    }

    function trackChanged(callback) {
      trackChangedCallback = callback;
    }

    function loadRelatedTracks(trackId, success, fail) {
      $http.get($config.soundCloudEndpoint + '/tracks/' + trackId + '/related?client_id=' + CLIENT_ID)
        .success(function (data) {
          if (success) {
            success(data);
          }
          addTracks(data.slice(0, 10));
        })
        .error(fail || _ef);
    }

    function loadTrack(trackId, success, fail) {
      var track = _.find(trackList, { id: trackId });
      if(track) {
        if (success) {
          success(track);
        }
      }
      else {
        $http.get($config.soundCloudEndpoint + '/tracks/' + trackId + '?client_id=' + CLIENT_ID)
          .success(function (data) {
            addTracks([data]);
            if (success) {
              success(data);
            }
          })
          .error(fail || _ef);
      }
    }

    function resolve(url, callback, fail) {
      $http.get($config.soundCloudEndpoint + '/resolve?client_id=' + CLIENT_ID + '&url=' + url)
        .success(function (data) {
          callback(data);
        })
        .error(fail || _ef);
    }

    function addTracks(tracks) {
      tracks.forEach(function (track) {
        if (!track.id || _.findIndex(trackList, {id: track.id})) {
          trackList.unshift(track);
          trackListModified = true;
        }
      });
    }

    function removeTrack(track) {
      if (!track.isLocal) { // local tracks not saved for now
        trackListModified = true;
      }
      trackList.splice(trackList.indexOf(track), 1);
    }

    hotkeys.add({
      combo: '.',
      description: 'Next track',
      callback: function (event) {
        next();
        analytics(GA_CAT.HOTKEY, GA_ACT.NEXT_TRACK_KEY);
        event.preventDefault();
      }
    });

    hotkeys.add({
      combo: ',',
      description: 'Previous track',
      callback: function (event) {
        previous();
        analytics(GA_CAT.HOTKEY, GA_ACT.PREVIOUS_TRACK_KEY);
        event.preventDefault();
      }
    });

    hotkeys.add({
      combo: '?',
      description: 'Play/pause track',
      callback: function (event) {
        playPause(currentTrackIndex > -1 ? trackList[currentTrackIndex] : trackList[0]);
        analytics(GA_CAT.HOTKEY, GA_ACT.PLAY_PAUSE_TRACK_KEY);
        event.preventDefault();
      }
    });


    function isAvailable() {
      return true;
    }

    function getCurrentTrack() {
      return trackList[currentTrackIndex];
    }

    function isPaused() {
      return WebAudioPlayer.isPaused();
    }

    function getCurrentId() {
      return trackList[currentTrackIndex] ? trackList[currentTrackIndex].id : '';
    }

    function startAudioCapture(success, fail) {
      WebAudioPlayer.listenOnMic(success, fail);
    }

    function closeMic() {
      WebAudioPlayer.closeMic();
    }

    function addLocalFiles(files) {
      files.forEach(function (file) {
        if (_.findIndex(trackList, {id: file.name}) === -1) {
          musicmetadata(file, function (err, metadata) {

            var newTrack = {
              id: file.name,
              isLocal: true,
              stream_url: URL.createObjectURL(file),
              artwork_url: '/assets/images/placeholder_artwork.png',
              title: file.name
            };

            if (!err) {
              newTrack.title = metadata.title;
              newTrack.duration = Math.floor(metadata.duration * 1000) || 0;
              if (metadata.picture.length > 0) {
                var picture = metadata.picture[0];
                newTrack.artwork_url = URL.createObjectURL(new Blob([picture.data], {'type': 'image/' + picture.format}));
              }
            }
            $timeout(function () {
              addTracks([newTrack]);
            });
          });
        }
      });
    }

    function search(query, callback, fail) {
      $http.get($config.soundCloudEndpoint + '/tracks' +
          '?client_id=' + CLIENT_ID +
          '&q=' + encodeURIComponent(query) +
          '&page_size=100' +
          '&linked_partitioning=1'
        )
        .success(callback || _ef)
        .error(fail || _ef);
    }

    function searchMore(next_href, callback, fail) {
      $http.get(next_href)
        .success(callback || _ef)
        .error(fail || _ef);
    }

    function getDuration() {
      if (trackList[currentTrackIndex]) {
        return trackList[currentTrackIndex].duration;
      }
      return 0;
    }

    function loadUserPlaylist() {
      if (WebAppService.userData &&
        WebAppService.userData.trackList &&
        WebAppService.userData.trackList.length) {
        angular.copy(WebAppService.userData.trackList, trackList);
      }
      else {
        loadDefaultPlaylist();
      }
    }

    function setTrackMode(_trackMode) {
      trackMode = _trackMode;
    }

    return {
      addEndedCallbacks: addEndedCallbacks,
      addLocalFiles: addLocalFiles,
      addTimeupdateCallbacks: addTimeupdateCallbacks,
      addTracks: addTracks,
      closeMic: closeMic,
      getCurrentId: getCurrentId,
      getCurrentTrack: getCurrentTrack,
      getDuration: getDuration,
      getPlayMode: getPlayMode,
      getByteFrequencyData: getByteFrequencyData,
      getTimeDomainData: getTimeDomainData,
      getTrackList: getTrackList,
      isAvailable: isAvailable,
      isPaused: isPaused,
      loadDefaultPlaylist: loadDefaultPlaylist,
      loading: loading,
      loadRelatedTracks: loadRelatedTracks,
      loadTrack: loadTrack,
      next: next,
      pause: pause,
      play: play,
      playPause: playPause,
      playTrack: playTrack,
      playTrackById: playTrackById,
      playTrackSample: playTrackSample,
      previous: previous,
      removeTrack: removeTrack,
      resolve: resolve,
      resume: resume,
      search: search,
      searchMore: searchMore,
      setPlayMode: setPlayMode,
      setTrackPosition: setTrackPosition,
      soundStatus: soundStatus,
      startAudioCapture: startAudioCapture,
      trackChanged: trackChanged,
      loadUserPlaylist: loadUserPlaylist,
      setTrackIdCallback: function(callback){
        setTrackIdCallback = callback;
      },
      setTrackMode: setTrackMode,
      getCurrentViz: function(_getCurrentViz){
        getCurrentViz = _getCurrentViz;
      }
    };
  }
})();
