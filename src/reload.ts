export function reloadScript() {
  return `(function () {
  'use strict';
  var es = new EventSource('/__work__/events');
  es.addEventListener('client', function (evt) {
    var msg = JSON.parse(evt.data);
    console.log('client:', msg.code);
    if (msg.code === 'BUNDLE_END') window.location.reload();
  });
  es.addEventListener('server', function (evt) {
    var msg = JSON.parse(evt.data);
    console.log('client:', msg.code);
    if (msg.code === 'BUNDLE_END') window.location.reload();
  });
}());`;
}
