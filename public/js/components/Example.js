'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');

class Example extends React.Component {

    constructor(props) {
        super(props);
        this.doIncrement = this.doIncrement.bind(this);
        this.handleIncrement = this.handleIncrement.bind(this);
    }

    handleIncrement(e) {
        AppActions.setLocalState(this.props.ctx,
                                 {increment: e.target.value});
    }

    doIncrement() {
        const inc = parseInt(this.props.increment);
        if (isNaN(inc)) {
            const err = new Error('Increment is not a number');
            AppActions.setError(this.props.ctx, err);
        } else {
            AppActions.increment(this.props.ctx, inc);
        }
    }

    render() {
        return cE(rB.Form, {horizontal: true},
                  cE(rB.FormGroup, {controlId: 'counterId'},
                     cE(rB.Col, {sm:2, xs: 4},
                        cE(rB.ControlLabel, null, 'Counter')
                       ),
                      cE(rB.Col, {sm:6, xs: 8},
                         cE(rB.FormControl, {
                             type: 'text',
                             readOnly: true,
                             value: this.props.counter
                         })
                        )
                    ),

                  cE(rB.FormGroup, {controlId: 'incId'},
                     cE(rB.Col, {sm:2, xs: 4},
                        cE(rB.ControlLabel, null, 'Increment')
                       ),
                     cE(rB.Col, {sm:6, xs: 8},
                        cE(rB.FormControl, {
                            type: 'text',
                            value: this.props.increment,
                            placeholder: '1',
                            onChange: this.handleIncrement
                        })
                       ),
                     cE(rB.Col, {sm:4, xs: 8},
                        cE(rB.Button, {
                            bsStyle: 'primary',
                            onClick: this.doIncrement
                        }, "Change")
                       )
                    )
                 );
    }
}

module.exports = Example;
