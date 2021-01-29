const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;

class TableOrders extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const renderOneRow = function(i, order) {
            const date = (new Date(order.created)).toLocaleString(
                'en-US', {dateStyle: 'short', timeStyle: 'short', hour12: false}
            );
            return cE('tr', {key:10*i},
                      cE('td', {key:10*i+1}, date),
                      cE('td', {key:10*i+6}, order.status),
                      cE('td', {key:10*i+4}, order.units),
                      cE('td', {key:10*i+5}, order.value),
                      cE('td', {key:10*i+3}, order.id.slice(0,5))
                     );
        };

        const renderRows = function(rowsData) {
            const sorted = Object.keys(rowsData || {}).sort().reverse();
            return sorted.map(function(x, i) {
                return renderOneRow(i+1, rowsData[x]);
            });
        };

        const mergeOrders = function(pendingOrders, orders) {
            pendingOrders = pendingOrders || {};
            orders = orders || {};
            const result = {};
            Object.keys(pendingOrders).forEach(x => {
                const value = pendingOrders[x];
                result[value.created] = {...value, status: '?'};
            });
            Object.keys(orders).forEach(x => {
                const value = orders[x];
                result[value.created] = {...value, status: 'OK'};
            });
            return result;
        };

        const rowsData = mergeOrders(this.props.pendingOrders,
                                     this.props.orders);

        return cE(rB.Table, {striped: true, responsive: true, bordered: true,
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
                  cE('tbody', {key:8}, renderRows(rowsData))
                 );
    }
};

module.exports = TableOrders;
