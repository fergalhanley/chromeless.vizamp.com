
const context = new AudioContext();
const audio = new Audio();
const musicSource = context.createMediaElementSource(audio);
const analyser = context.createAnalyser();

let micSource;

class AudioController {

    playing = false;
    micOpen = false;

    constructor(){
        super();
        audio.crossOrigin = "Anonymous";
    }

    eventHandler(event, handler) {
        if (audio) {
            audio.addEventListener(event, handler);
        }
    }

    stop() {
        if (audio && !audio.paused) {
            audio.pause();
            musicSource.disconnect(0);
            this.playing = false;
        }
    }

    play(url, success, fail) {
        try {
            // no url provided it's assumed user is continuing play. rejected if incorrect anyway.
            if (url) {
                try {
                    audio.src = url;
                }
                catch (e) {
                    // no biggie
                }
                musicSource.connect(context.destination);
                musicSource.connect(analyser);
            }
            audio.play();
            this.playing = true;
            if (success) {
                success();
            }
        }
        catch (e) {
            if (fail) {
                fail(e);
            }
        }
    }

    pause() {
        if (audio) {
            audio.pause();
            this.playing = false;
        }
    }

    resume() {
        if (audio) {
            audio.play();
            this.playing = true;
        }
    }

    setTimePosition(position) {
        const newTime = Math.floor(musicSource.mediaElement.duration * position);
        if (newTime < musicSource.mediaElement.currentTime) {
            this.play(audio.src);
            this.setTime(newTime);
        }
        else if (!isNaN(newTime) && newTime !== Infinity) {
            musicSource.mediaElement.currentTime = newTime;
            this.setTime(newTime);
        }
    }

    setTime(time) {
        if (audio) {
            audio.currentTime = time;
        }
    }

    getTime() {
        if (audio) {
            return audio.currentTime;
        }
    }

    isPlaying() {
        return this.playing;
    }

    getTimeDomainData() {
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        return dataArray;
    }

    getByteFrequencyData() {
        analyser.fftSize = 1024;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    isPaused() {
        return (audio && audio.paused);
    }

    listenOnMic(success, fail) {

        if (navigator.getUserMedia) {

            const constraints = { audio: true, video: false };

            const successCallback = function (stream) {
                play();
                if (!audio.paused) {
                    audio.pause();
                    musicSource.disconnect(0);
                }
                micSource = context.createMediaStreamSource(stream);
                micSource.connect(analyser);
                this.micOpen = true;
                if (success) {
                    success();
                }
            };

            const errorCallback = fail || function (err) {
                    console.error("The following error occurred: " + err.name);
                };

            navigator.getUserMedia(constraints, successCallback, errorCallback);

        }
        else if (fail) {
            fail('Audio capture is not supported on this device.');
        }
    }

    closeMic() {
        micSource.disconnect(0);
        this.micOpen = false;
    }

    setMuted(muted) {
        if (audio) {
            audio.muted = muted;
        }
    }

    getMuted() {
        if (audio) {
            return audio.muted;
        }
    }

    setVolume(volume) {
        if (audio) {
            audio.volume = volume;
        }
    }

    getVolume() {
        if (audio) {
            return audio.volume;
        }
    }

    getDuration() {
        return musicSource.mediaElement.duration;
    }

}

const audioController = new AudioController();

export default audioController;