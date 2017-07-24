'use strict';

// Pull in the SockJS JavaScript library for talking over WebSockets.
var SockJS = require('sockjs-client');
// Pull in the stomp-websocket JavaScript library to use the STOMP sub-protocol.
require('stompjs');

function register(registrations) {
    // The WebSocket pointed at the application's endpoint.
	var socket = SockJS('/springdemo');
	var stompClient = Stomp.over(socket);
	stompClient.connect({}, function(frame) {
	// Iterate over the array of registrations supplied so each can subscribe for callback as messages arrive.
		registrations.forEach(function (registration) {
			stompClient.subscribe(registration.route, registration.callback);
		});
	});
}

module.exports.register = register;