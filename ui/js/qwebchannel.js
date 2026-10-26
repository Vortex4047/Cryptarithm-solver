/****************************************************************************
** QWebChannel JavaScript client library
** Copyright (C) 2016 The Qt Company Ltd.
**
** Redistribution and use in source and binary forms, with or without
** modification, are permitted provided that the following conditions are met:
** * Redistributions of source code must retain the above copyright notice,
**   this list of conditions and the following disclaimer.
** * Redistributions in binary form must reproduce the above copyright notice,
**   this list of conditions and the following disclaimer in the documentation
**   and/or other materials provided with the distribution.
****************************************************************************/

"use strict";

var QWebChannelMessageTypes = {
    signal: 1,
    propertyUpdate: 2,
    init: 3,
    idle: 4,
    debug: 5,
    invokeMethod: 6,
    connectToSignal: 7,
    disconnectFromSignal: 8,
    setProperty: 9,
    response: 10
};

var QWebChannel = function(transport, initCallback) {
    if (typeof transport !== "object" || typeof transport.send !== "function") {
        console.error("The QWebChannel expects a transport object with a send function and onmessage callback property." +
                      " Given is: " + typeof transport);
        return;
    }

    var channel = this;
    this.transport = transport;

    this.send = function(data) {
        if (typeof(data) !== "string") {
            data = JSON.stringify(data);
        }
        channel.transport.send(data);
    };

    this.transport.onmessage = function(message) {
        var data = message.data;
        if (typeof data === "string") {
            data = JSON.parse(data);
        }
        switch (data.type) {
            case QWebChannelMessageTypes.signal:
                channel.handleSignal(data);
                break;
            case QWebChannelMessageTypes.response:
                channel.handleResponse(data);
                break;
            case QWebChannelMessageTypes.propertyUpdate:
                channel.handlePropertyUpdate(data);
                break;
            default:
                console.error("invalid message received:", message.data);
                break;
        }
    };

    this.execCallbacks = {};
    this.execId = 0;
    this.exec = function(data, callback) {
        if (!callback) {
            channel.send(data);
            return;
        }
        if (channel.execId === Number.MAX_VALUE) {
            channel.execId = 0;
        }
        if (data.hasOwnProperty("id")) {
            console.error("Cannot exec message with previous id: " + JSON.stringify(data));
            return;
        }
        data.id = channel.execId++;
        channel.execCallbacks[data.id] = callback;
        channel.send(data);
    };

    this.objects = {};

    this.handleSignal = function(message) {
        var object = channel.objects[message.object];
        if (object) {
            object.signalEmitted(message.signal, message.args);
        } else {
            console.warn("Unhandled signal: " + message.object + "::" + message.signal);
        }
    };

    this.handleResponse = function(message) {
        if (!message.hasOwnProperty("id")) {
            console.error("Invalid response message: " + JSON.stringify(message));
            return;
        }
        if (channel.execCallbacks[message.id]) {
            channel.execCallbacks[message.id](message.data);
            delete channel.execCallbacks[message.id];
        }
    };

    this.handlePropertyUpdate = function(message) {
        for (var i in message.data) {
            var data = message.data[i];
            var object = channel.objects[data.object];
            if (object) {
                object.propertyUpdate(data.signals, data.properties);
            } else {
                console.warn("Unhandled property update: " + data.object);
            }
        }
        channel.exec({type: QWebChannelMessageTypes.idle});
    };

    this.debug = function(message) {
        channel.send({type: QWebChannelMessageTypes.debug, data: message});
    };

    channel.exec({type: QWebChannelMessageTypes.init}, function(data) {
        for (var objectName in data) {
            var object = new QObject(objectName, data[objectName], channel);
        }
        if (initCallback) {
            initCallback(channel);
        }
    });
};

function QObject(name, data, webChannel) {
    this.__id__ = name;
    webChannel.objects[name] = this;

    // Register methods
    for (var i = 0; i < data.methods.length; ++i) {
        var methodName = data.methods[i][0];
        var methodIdx = data.methods[i][1];

        this[methodName] = (function(name, idx) {
            return function() {
                var args = [];
                var callback;
                for (var j = 0; j < arguments.length; ++j) {
                    if (typeof arguments[j] === "function") {
                        callback = arguments[j];
                    } else {
                        args.push(arguments[j]);
                    }
                }

                return new Promise(function(resolve, reject) {
                    webChannel.exec({
                        type: QWebChannelMessageTypes.invokeMethod,
                        object: name,
                        method: idx,
                        args: args
                    }, function(response) {
                        if (response !== undefined) {
                            var result = response;
                            if (callback) {
                                callback(result);
                            }
                            resolve(result);
                        } else {
                            if (callback) {
                                callback();
                            }
                            resolve();
                        }
                    });
                });
            };
        })(name, methodIdx);
    }
}
