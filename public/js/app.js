"use strict";

const React = require('react');
const ReactDOM = require('react-dom');
const ReactServer = require('react-dom/server');
const AppSession = require('./session/AppSession');
const MyApp = require('./components/MyApp');
const redux = require('redux');
const AppReducer = require('./reducers/AppReducer');
const AppActions = require('./actions/AppActions');

const cE = React.createElement;

const main = exports.main = function(data) {
    const ctx =  {
        store: redux.createStore(AppReducer)
    };

    if (typeof window !== 'undefined') {
        return (async function() {
            try {
                await AppSession.connect(ctx);
                ReactDOM.hydrate(cE(MyApp, {ctx: ctx}),
                                 document.getElementById('content'));
            } catch (err) {
                document.getElementById('content').innerHTML =
                    '<H1>Cannot connect: ' + err + '<H1/>';
                console.log('Cannot connect:' + err);
            }
        })();
    } else {
        // server side rendering
        AppActions.initServer(ctx, data);
        return ReactServer.renderToString(cE(MyApp, {ctx: ctx}));
    }
};
