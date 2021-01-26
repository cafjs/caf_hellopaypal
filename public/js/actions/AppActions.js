const AppConstants = require('../constants/AppConstants');
const json_rpc = require('caf_transport').json_rpc;

const updateF = function(store, state) {
    const d = {
        type: AppConstants.APP_UPDATE,
        state: state
    };
    store.dispatch(d);
};

const errorF =  function(store, err) {
    const d = {
        type: AppConstants.APP_ERROR,
        error: err
    };
    store.dispatch(d);
};

const notifyF = function(store, message) {
    const getNotifData = function(msg) {
        return json_rpc.getMethodArgs(msg)[0];
    };
    const d = {
        type: AppConstants.APP_NOTIFICATION,
        state: getNotifData(message)
    };
    store.dispatch(d);
};

const wsStatusF =  function(store, isClosed) {
    const d = {
        type: AppConstants.WS_STATUS,
        isClosed: isClosed
    };
    store.dispatch(d);
};

const AppActions = {
    initServer(ctx, initialData) {
        updateF(ctx.store, initialData);
    },
    async init(ctx) {
        try {
            const data = await ctx.session.hello(ctx.session.getCacheKey())
                    .getPromise();
            updateF(ctx.store, data);
        } catch (err) {
            errorF(ctx.store, err);
        }
    },
    message(ctx, msg) {
        // console.log('message:' + JSON.stringify(msg));
        notifyF(ctx.store, msg);
    },
    closing(ctx, err) {
        console.log('Closing:' + JSON.stringify(err));
        wsStatusF(ctx.store, true);
    },
    setLocalState(ctx, data) {
        updateF(ctx.store, data);
    },
    resetError(ctx) {
        errorF(ctx.store, null);
    },
    setError(ctx, err) {
        errorF(ctx.store, err);
    }
};

const EXTERNAL_METHODS = ['increment', 'getState']; // Add your methods here
EXTERNAL_METHODS.forEach(function(x) {
    AppActions[x] = async function() {
        const args = Array.prototype.slice.call(arguments);
        const ctx = args.shift();
        try {
            const data =  await ctx.session[x].apply(ctx.session, args)
                      .getPromise();
            updateF(ctx.store, data);
        } catch (err) {
            errorF(ctx.store, err);
        }
    };
});



module.exports = AppActions;
