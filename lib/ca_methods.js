'use strict';
const assert = require('assert');
const caf = require('caf_core');
const app = require('../public/js/app.js');
const myUtils = caf.caf_components.myUtils;
const json_rpc = caf.caf_transport.json_rpc;

const MAX_CRASH_TIME = 1; // seconds
const DOLLARS_PER_UNIT = 0.1;
const APP_SESSION = 'default';

const notifyApp = function(self) {
    self.$.session.notify([self.state], APP_SESSION);
};

const retryCapture = async function(self) {
    const pendingIds = Object.keys(self.state.pendingOrders);
    for (let i = 0; i < pendingIds.length; i++) {
        const x = pendingIds[i];
        const [err] = await self.captureOrder(x);
        const msg = err ?
              'Capture retry failed for order ' :
              'Capture retry OK for order ';
        self.$.log && self.$.log.debug(msg + x);
    }
};


exports.methods = {
    // Methods called by framework
    async __ca_init__() {
        this.state.counter = -1;
        this.$.session.limitQueue(1, 'default'); // only the last notification
        this.state.fullName = this.__ca_getAppName__() + '#' +
            this.__ca_getName__();
        this.state.orders = {};
        this.state.pendingOrders = {};
        this.state.clientId = this.$.paypal.getClientId();
        this.state.username = json_rpc.splitName(this.__ca_getName__())[0];
        this.$.users.registerUser();
        return [];
    },
    async __ca_pulse__() {
        this.$.log && this.$.log.debug('calling PULSE!!! ' +
                                       this.state.counter);
        this.state.counter = this.state.counter + 1;

        //GC expired orders
        const toDelete = [];
        const expiredTime = (new Date()).getTime() -
              1000 * this.$.props.orderExpireTimeInSec;

        Object.keys(this.state.pendingOrders).forEach((x) => {
            if (this.state.pendingOrders[x].created < expiredTime) {
                toDelete.push(x);
            }
        });

        if (toDelete.length > 0) {
            this.$.log && this.$.log.debug('Deleting orders: ' +
                                           JSON.stringify(toDelete));
            toDelete.forEach(x => delete this.state.pendingOrders[x]);
            notifyApp(this); // reload state
            }

            // Retry capture of pending orders
        if (this.scratch.tokenStr &&
            (this.state.counter % this.$.props.pulsesForCaptureRetry === 0)
           ) {
            await retryCapture(this);
        }
        this.$.react.render(app.main, [this.state]);

        return [];
    },

    //External methods

    async hello(key, tokenStr) {
        key && this.$.react.setCacheKey(key);
        if (tokenStr) {
            this.scratch.tokenStr = tokenStr;
            await retryCapture(this);
        }
        return this.getState();
    },

    async crash() {
        const nextCrashTime = Math.random() * MAX_CRASH_TIME * 1000;
        setTimeout(() => {
            this.$.log && this.$.log.debug('Forced crash');
            process.exit(1);
        }, nextCrashTime);
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
            notifyApp(this); // reload state
            return [null, order];
        } catch (err) {
            return [err];
        }
    },

    async captureOrder(id) {
        try {
            if (this.state.orders[id]) {
                // idempotent
                notifyApp(this); // reload state
                return [null, this.state.orders[id]];
            } else if (this.state.pendingOrders[id]) {
                assert(this.scratch.tokenStr, 'Missing token');
                const order = await this.$.paypal.dirtyCaptureOrder(id);
                const pendingOrder = this.state.pendingOrders[id];
                assert(order.units === pendingOrder.units);
                assert(order.user === pendingOrder.user);
                assert(this.state.username === pendingOrder.user);

                // Payment ID only available after capture
                pendingOrder.tid = order.tid;

                this.$.users.changeUnits(this.state.username, order.units);
                this.$.users.confirmOrder(this.scratch.tokenStr, pendingOrder);

                this.state.orders[id] = pendingOrder;
                delete this.state.pendingOrders[id];
                notifyApp(this); // reload state
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
        return [null, this.state];
    }
};

caf.init(module);
