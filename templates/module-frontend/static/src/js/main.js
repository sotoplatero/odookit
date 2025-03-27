odoo.define('{{name}}.main', function (require) {
    "use strict";

    const AbstractAction = require('web.AbstractAction');
    const core = require('web.core');

    const MyCustomAction = AbstractAction.extend({
        template: '{{name}}.Template',
        
        start: function () {
            return this._super.apply(this, arguments);
        },
    });

    core.action_registry.add('{{name}}.action', MyCustomAction);

    return MyCustomAction;
});
