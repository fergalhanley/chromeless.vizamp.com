const WHEN_INTERVAL = 20;

export function when(condition, callback, timeoutMs, timedOut){
    if(timeoutMs === undefined) {
        timeoutMs = 5000;
    }
    if(condition()) {
        callback();
    }
    else if(timeoutMs <= 0 && timedOut){
        timedOut();
    }
    else {
        setTimeout(() => when(condition, callback, timeoutMs - WHEN_INTERVAL, timedOut), WHEN_INTERVAL);
    }
}
