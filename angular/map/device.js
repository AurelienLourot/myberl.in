'use strict';

define({
  setSlow: setSlow,
  isSlow: isSlow,
  addListener: addListener,
});

var deviceIsSlow = false;
var listeners = [];

function setSlow() {
  deviceIsSlow = true;
  for (var i in listeners) {
    listeners[i]();
  }
}

function isSlow() {
  return deviceIsSlow;
}

function addListener(listener) {
  listeners.push(listener);
  if (deviceIsSlow) {
    listener();
  }
}
