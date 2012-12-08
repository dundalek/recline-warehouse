/*jshint multistr:true */

this.recline = this.recline || {};
this.recline.View = this.recline.View || {};

(function($, _, warehouse, my) {

my.RqlQueryEditor = Backbone.View.extend({
  className: 'recline-rql-query-editor well',
  template: _.template(
    '<h3>Query</h3> \
    <table> \
      <tr> \
        <th>RQL</th> \
        <td> \
          <input type="text" value="<%- rql %>" class="rql-input"> \
          <input type="button" value="Update" class="btn js-update"> \
        </td> \
      </tr> \
      <% _.each(queries, function(i) { %> \
      <tr><th><%- i.label %></th><td><%- i.query %></td></tr> \
      <% }); %> \
    </table>'
  ),
  events: {
    'keydown .rql-input': 'onKey',
    'click .js-update': 'onUpdate',
  },
  converters: {
    'SQL': function(rql) { return warehouse.rql2sql(rql, {table: 'tablename'}); },
    'Mongo': function(rql) { return JSON.stringify(rql.toMongo()); },
    'ES': function(rql) { return JSON.stringify(warehouse.rql2es(rql)); }
  },
  engines: ['SQL', 'Mongo', 'ES'],

  initialize: function() {
    this.el = $(this.el);

    this.engines = this.options.engines || this.engines;

    _.bindAll(this, 'render');
    this.model.fields.bind('all', this.render);
    this.model.queryState.bind('change:rql', this.render);
    
    this.render();
  },

  render: function() {
    var self = this,
        queries = [],
        rql = this.model.queryState.get('rql');

    _.each(this.engines, function(engine) {
      if (engine in self.converters) {
        queries.push({
          label: engine,
          query: self.converters[engine](rql)
        });
      }
    });

    var tmplData = {
      rql: rql.toString(),
      queries: queries
    };

    var out = this.template(tmplData);
    this.el.html(out);
  },

  onUpdate: function() {
    var rql = _.rql(this.el.find('.rql-input').val());
    _.extend(this.model.queryState.attributes, warehouse.rql2es(rql));
    this.model.queryState.attributes.rql = rql;
    this.model.queryState.trigger('change');
    this.model.queryState.trigger('change:rql');
  },

  onKey: function(e) {
    if (e.which === 13) {
      // return key
      e.preventDefault();
      this.onUpdate();
    }
  }
});

})(jQuery, _, warehouse, recline.View);