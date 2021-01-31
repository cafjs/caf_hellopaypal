'use strict';
const assert = require('assert');
const caf = require('caf_core');
const app = require('../public/js/app.js');
const myUtils = caf.caf_components.myUtils;
const json_rpc = caf.caf_transport.json_rpc;
const app_util = require('./ca_methods_util.js');

const MAX_CRASH_TIME = 1; // seconds
const DOLLARS_PER_UNIT = 0.1;
const APP_SESSION = 'default';

exports.methods = {
    // Methods called by framework

    async __ca_init__() {
        this.state.counter = -1;
        this.$.session.limitQueue(1, APP_SESSION); // only the last notification
        this.state.fullName = this.__ca_getAppName__() + '#' +
            this.__ca_getName__();
        this.state.orders = {};
        this.state.pendingOrders = {};
        this.state.clientId = this.$.paypal.getClientId();
        this.state.username = json_rpc.splitName(this.__ca_getName__())[0];
        this.$.users.registerUser();
        this.state.crash = false;
        this.state.units = 0;
        this.state.userInfo = null;
        this.$.users.setHandleReplyMethod('__ca_handleUserInfo__');
        return [];
    },

    async __ca_pulse__() {
        this.$.log && this.$.log.debug('calling PULSE!!! ' +
                                       this.state.counter);
        this.state.counter = this.state.counter + 1;

        app_util.gcExpiredOrders(this);

        // Retry capture of pending orders
        if (this.state.tokenStr &&
            (this.state.counter % this.$.props.pulsesForCaptureRetry === 0)) {
            await app_util.retryCapture(this);
        }

        this.$.users.getUserInfo(this.state.username);

        this.$.react.render(app.main, [this.state]);

        return [];
    },

    async __ca_handleUserInfo__(reqId, response) {
        let [err, data] = response;
        if (err) {
            err = (err.err ? err.err : err); // LUA wrapped error
            this.state.error = {message: '' + (err.message || err) +
                                ' (Request ID:' + reqId.slice(-10) + ')'};
            this.$.log && this.$.log.debug('Handle id:' + reqId + ' err:' +
                                           this.state.error.message);
            app_util.notifyApp(this);
        } else {
            this.$.log && this.$.log.debug('Handle OK id:' + reqId +
                                           ' data:' + data);
            if (reqId.indexOf('getUserInfo_') === 0) {
                if (!myUtils.deepEqual(data, this.state.userInfo)) {
                    this.state.userInfo = data;
                    this.state.units = data.user;
                    app_util.notifyApp(this);
                }
            }
        }
        return [];
    },

    //External methods

    async hello(key, tokenStr) {
        key && this.$.react.setCacheKey(key);
        if (tokenStr) {
            this.state.tokenStr = tokenStr;
            await app_util.retryCapture(this);
        }
        return this.getState();
    },

    async cleanError() {
        delete this.state.error;
        return this.getState();
    },

    async crash() {
        if (this.state.crash) {
            const nextCrashTime = Math.random() * MAX_CRASH_TIME * 1000;
            setTimeout(() => {
                this.$.log && this.$.log.warn('Forced crash');
                process.exit(1);
            }, nextCrashTime);
            this.state.crash = false;
        }
        return this.getState();
    },

    async setCrash(crash) {
        this.state.crash = crash;
        return this.getState();
    },

    async getPrice(units) {
        return [null, {price: this.$.paypal.getPrice(units)}];
    },

    async createOrder(units) {
        try {
            const [, res] = await this.getPrice(units);
            const value = res.price;
            const response = await this.$.paypal.dirtyCreateOrder(units);
            this.$.log && this.$.log.debug('Order response:' +
                                           JSON.stringify(response));
            const {id} = response;
            const created = (new Date()).getTime();
            const user = this.state.username;
            const order = {created, id, user, units, value};
            this.state.pendingOrders[id] = order;
            app_util.notifyApp(this); // reload state
            this.crash();
            return [null, order];
        } catch (err) {
            return [err];
        }
    },

    async captureOrder(id) {
        try {
            if (this.state.orders[id]) {
                // Make idempotent
                app_util.notifyApp(this);
                return [null, this.state.orders[id]];
            } else if (this.state.pendingOrders[id]) {
                assert(this.state.tokenStr, 'Missing token');

                // Step 1. Capture funds
                const order = await this.$.paypal.dirtyCaptureOrder(id);

                const pendingOrder = this.state.pendingOrders[id];
                assert(order.units === pendingOrder.units);
                assert(order.user === pendingOrder.user);
                assert(this.state.username === pendingOrder.user);
                // Payment ID only available after capture
                pendingOrder.tid = order.tid;

                // Step 2. Process order
                this.$.users.changeUnits(this.state.username, order.units);

                // Step 3. E-mail confirmation
                this.$.users.confirmOrder(this.state.tokenStr, pendingOrder);

                // Step 4. Internal bookkeeping
                this.state.orders[id] = pendingOrder;
                delete this.state.pendingOrders[id];

                app_util.notifyApp(this);
                return [null, pendingOrder];
            } else {
                return [new Error(`Unknown order ${id}`)];
            }
        } catch (err) {
            this.$.log && this.$.log.debug('CaptureOrder: Got error ' +
                                           myUtils.errToPrettyStr(err));
            return [err];
        }
    },

    async getState() {
        this.$.react.coin();
        return [null, app_util.filterToken(this.state)];
    }
};

caf.init(module);
