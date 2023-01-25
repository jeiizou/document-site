class EventBus {
  eventMap = new Map();

  emit(eventName, ...args) {
    if (this.eventMap.has(eventName)) {
      let events = this.eventMap.get(eventName);
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        event.call(this, ...args);
      }
    }
  }

  on(eventName, eventHandle, eventArgs) {
    let events = [];
    if (this.eventMap.has(eventName)) {
      events = this.eventMap.get(eventName);
    }

    events.push(eventHandle);
    this.eventMap.set(eventName, events);
  }

  off(eventHandle) {
    if (this.eventMap.has(eventName)) {
      let events = this.eventMap.get(eventName);
      events.splice(events.indexof(eventHandle), 1);
      if (events.length > 1) {
        this.eventMap.set(eventName, events);
      } else {
        this.eventMap.delete(eventName);
      }
    }
  }
}

let eventsBus = new EventBus();
eventsBus.on('test', function (value) {
  console.log(value);
});

eventsBus.emit('test', 'value123123');
