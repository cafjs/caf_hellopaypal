const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');

class ManagementPanel extends React.Component {
    constructor(props) {
        super(props);
        this.doBuy = this.doBuy.bind(this);
        this.handleCrash = this.handleCrash.bind(this);
    }

    doBuy(ev) {
        AppActions.setLocalState(this.props.ctx, {
            buyMode: true
        });
    }

    handleCrash(e) {
        AppActions.setCrash(this.props.ctx, e);
    }

    render() {
        const unitFix = typeof this.props.units === 'number' ?
            this.props.units.toFixed(2) :
            this.props.units;

        return cE(rB.Form, {horizontal: true},

                  cE(rB.FormGroup, {controlId: 'selectId'},
                     cE(rB.Col, {xs:6, sm:6},
                        cE(rB.ControlLabel, null, 'Username')
                       ),
                     cE(rB.Col, {xs:6, sm:6},
                        cE(rB.FormControl, {
                            readOnly: true,
                            type: 'text',
                            value: this.props.username
                        })
                       )
                    ),

                  cE(rB.FormGroup, {controlId: 'unitsId'},
                     cE(rB.Col, {xs:6 , sm:6},
                        cE(rB.ControlLabel, null, 'Units')
                       ),
                      cE(rB.Col, {xs:6 , sm:6},
                         cE(rB.FormControl, {
                             readOnly: true,
                             type: 'text',
                             value: unitFix
                         })
                        )
                    ),

                  cE(rB.FormGroup, {controlId: 'crashId'},
                     cE(rB.Col, {sm: 6, xs: 12},
                        cE(rB.ControlLabel, null, 'Crash')
                       ),
                     cE(rB.Col, {sm: 6, xs: 12},
                        cE(rB.ToggleButtonGroup, {
                            type: 'radio',
                            name : 'crash',
                            value: this.props.crash,
                            onChange: this.handleCrash
                        },
                           cE(rB.ToggleButton, {value: false}, 'Off'),
                           cE(rB.ToggleButton, {value: true}, 'On')
                          )
                       )
                    ),

                  cE(rB.FormGroup, {controlId: 'payId'},
                     cE(rB.Col, {xs:6 , sm:6},
                        cE(rB.ButtonGroup, null,
                           cE(rB.Button,  {
                               onClick: this.doBuy,
                               bsStyle: 'danger'
                           }, 'Buy')
                          )
                       )
                    ),
                 );
    }
};

module.exports = ManagementPanel;
