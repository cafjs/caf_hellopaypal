var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');

class Confirmation extends React.Component {
    constructor(props) {
        super(props);
        this.doDismiss = this.doDismiss.bind(this);
    }

    doDismiss(ev) {
        AppActions.setLocalState(this.props.ctx, {confirmation: false});
    }

    render() {
        const order = this.props.capturedOrder || {};
        const units  = order.units || 0;
        const date = order && (new Date(order.created)).toLocaleString(
            'en-US', {dateStyle: 'short', timeStyle: 'short', hour12: false}
        );
        return cE(rB.Modal,{show: !!this.props.confirmation,
                            onHide: this.doDismiss,
                            animation: false},
                  cE(rB.Modal.Header, {
                      className : "bg-warning text-warning",
                      closeButton: true
                  }, cE(rB.Modal.Title, null, "Order confirmation")),
                  cE(rB.Modal.Body, null,
                     cE('h4', null, 'Thanks for your purchase.'),
                     cE('h4', null,
                        `${units} units have been added to your account.`),
                     cE(rB.Table, {striped: true, responsive: true,
                                   bordered: true,
                                   condensed: true, hover: true},
                        cE('thead', {key:0},
                           cE('tr', {key:1},
                              cE('th', {key:2}, 'Date'),
                              cE('th', {key:7}, 'Stat'),
                              cE('th', {key:5}, '#'),
                              cE('th', {key:6}, '$'),
                              cE('th', {key:4}, 'ID')
                             )
                          ),
                        cE('tbody', {key:8},
                           cE('tr', {key:100},
                              cE('td', {key:100+1}, date),
                              cE('td', {key:100+6}, 'OK'),
                              cE('td', {key:100+4}, order.units),
                              cE('td', {key:100+5}, order.value),
                              cE('td', {key:100+3}, order.id &&
                                 order.id.slice(0,5))
                             )
                          )
                       )
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.Button, {onClick: this.doDismiss}, "Continue")
                    )
                 );
    }
};

module.exports = Confirmation;
