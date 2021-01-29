'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const AppActions = require('../actions/AppActions');
const AppStatus = require('./AppStatus');
const DisplayError = require('./DisplayError');

const Buy = require('./Buy');
const Confirmation = require('./Confirmation');
const ManagementPanel = require('./ManagementPanel');
const TableOrders = require('./TableOrders');


const cE = React.createElement;

class MyApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.props.ctx.store.getState();
    }

    componentDidMount() {
        if (!this.unsubscribe) {
            this.unsubscribe = this.props.ctx.store
                .subscribe(this._onChange.bind(this));
            this._onChange();
        }
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    _onChange() {
        if (this.unsubscribe) {
            this.setState(this.props.ctx.store.getState());
        }
    }

    render() {
        return cE('div', {className: 'container-fluid'},
                  cE(DisplayError, {
                      ctx: this.props.ctx,
                      error: this.state.error
                  }),
                  cE(Buy, {
                      ctx: this.props.ctx,
                      buyMode: this.state.buyMode,
                      buyUnits: this.state.buyUnits,
                      price: this.state.price,
                      clientId: this.state.clientId
                  }),
                  cE(Confirmation, {
                      ctx: this.props.ctx,
                      capturedOrder: this.state.capturedOrder,
                      confirmation: this.state.confirmation
                  }),
                  cE(rB.Panel, null,
                     cE(rB.Panel.Heading, null,
                        cE(rB.Panel.Title, null,
                           cE(rB.Grid, {fluid: true},
                              cE(rB.Row, null,
                                 cE(rB.Col, {sm:1, xs:1},
                                    cE(AppStatus, {
                                        isClosed: this.state.isClosed
                                    })
                                   ),
                                 cE(rB.Col, {
                                     sm: 5,
                                     xs:10,
                                     className: 'text-right'
                                 }, 'hellopaypal'),
                                 cE(rB.Col, {
                                     sm: 5,
                                     xs:11,
                                     className: 'text-right'
                                 }, this.state.fullName)
                                )
                             )
                          )
                       ),
                     cE(rB.Panel.Body, null,
                        cE(rB.Panel, null,
                           cE(rB.Panel.Heading, null,
                              cE(rB.Panel.Title, null, 'Manage')
                             ),
                           cE(rB.Panel.Body, null,
                              cE(ManagementPanel, {
                                  ctx: this.props.ctx,
                                  units: this.state.units,
                                  username: this.state.username,
                                  crash: this.state.crash
                              })
                             )
                          ),
                        cE(rB.Panel, null,
                           cE(rB.Panel.Heading, null,
                              cE(rB.Panel.Title, null, 'Transactions')
                             ),
                           cE(rB.Panel.Body, null,
                              cE(TableOrders, {
                                  pendingOrders: this.state.pendingOrders,
                                  orders: this.state.orders
                              })
                             )
                          ),
                       )
                    )
                 );
    }
};

module.exports = MyApp;
