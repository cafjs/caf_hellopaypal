'use strict';


const APP_SESSION = 'default';

const filterToken = exports.filterToken = function(state) {
    const newState = {...state};
    delete newState.tokenStr;
    return newState;
};

const notifyApp = exports.notifyApp = function(self) {
    self.$.session.notify([filterToken(self.state)], APP_SESSION);
};

exports.retryCapture = async function(self) {
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


exports.gcExpiredOrders = function(self) {
    const toDelete = [];
    const expiredTime = (new Date()).getTime() -
          1000 * self.$.props.orderExpireTimeInSec;

    Object.keys(self.state.pendingOrders).forEach((x) => {
        if (self.state.pendingOrders[x].created < expiredTime) {
            toDelete.push(x);
        }
    });

    if (toDelete.length > 0) {
        self.$.log && self.$.log.debug('Deleting orders: ' +
                                       JSON.stringify(toDelete));
        toDelete.forEach(x => delete self.state.pendingOrders[x]);
        notifyApp(self); // reload state
    }
};
