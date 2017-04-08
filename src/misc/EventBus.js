
class EventBus {

    events = {};

    static on(eventName, callback) {
        if(this.events[eventName] === undefined) {
            this.events[eventName] = []
        }
        this.events[eventName].push(callback);
    }

    static call(eventName, ...params) {
        if(this.events[eventName]) {
            for(let callback in this.events[eventName]) {
                callback(params);
            }
        }
    }
}

export default EventBus;
