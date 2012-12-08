this.recline = this.recline || {};
this.recline.View = this.recline.View || {};

(function($, _, my) {

my.RqlSortEditor = Backbone.View.extend({
  className: 'recline-rql-sort-editor well',
  template: _.template(
    '<h3>Sort</h3> \
    <form> \
      <% _.each(sorts, function(sort, idx) { %> \
        <div class="sort" data-sort-id="<%- idx %>"> \
          <fieldset> \
            <select class="field"> \
              <% _.each(fields, function(field) { %> \
              <option <% print(sort.field === field.id ? \'selected="selected"\' : \'\'); %> value="<%- field.id %>"><%- field.label %></option> \
              <% }); %> \
            </select> \
            <select class="order"> \
              <% _.each(orders, function(order) { %> \
              <option <% print(sort.order === order.id ? \'selected="selected"\' : \'\'); %> value="<%- order.id %>"><%- order.label %></option> \
              <% }); %> \
            </select> \
            <a class="js-remove" href="#" title="Remove this sort field">×</a> \
          </fieldset> \
        </div> \
      <% }); %> \
      <a href="#" class="js-add">Add sort field</a> \
      <% if (sorts.length) { %> \
      <button type="button" class="btn js-update">Update</button> \
      <% } %> \
    </form>'
  ),
  events: {
    'click .js-add': 'onAdd',
    'click .js-remove': 'onRemove',
    'click .js-update': 'onUpdate',
  },

  orders: [
    {id: 'asc', label: 'asc'},
    {id: 'desc', label: 'desc'}
  ],

  initialize: function() {
    this.el = $(this.el);

    _.bindAll(this, 'render');
    this.model.fields.bind('all', this.render);
    this.model.queryState.bind('change:rql', this.render);
    
    this.render();
  },

  render: function() {
    // remap sorts for template
    var sorts = _.map(this._getSorts(), function(item) {
      return {field: item.slice(1), order: item[0] === '-' ? 'desc' : 'asc'};
    });

    var tmplData = {
      sorts: sorts,
      fields: this.model.fields.toJSON(),
      orders: this.orders
    };

    // render and display
    var out = this.template(tmplData);
    this.el.html(out);
  },

  onAdd: function(e) {
    e.preventDefault();

    var sort = this._getSorts();
    sort.push('');

    this.model.queryState.get('rql').sort(sort);
    this.render();
  },

  onRemove: function(e) {
    e.preventDefault();

    this.update();

    var $target = $(e.target);
    var id = $target.closest('.sort').attr('data-sort-id');
    var sort = this.model.queryState.get('sort');
    sort.splice(id, 1);
    if (sort.length === 0) {
      this.model.queryState.unset('sort', {silent:true});
    }
    this.model.queryState.trigger('change');
  },

  onUpdate: function(e) {
    this.update();
    this.model.queryState.trigger('change');
  },

  update: function() {
    // get sort parameters from DOM
    var sorts = this.el.find('.sort').map(function() {
      var item = $(this),
          id = item.attr('data-filter-id'),
          field = item.find('.field option:selected').val(),
          order = item.find('.order option:selected').val();

      //var sort = {};
      //sort[field] = order;
      //return sort;
      return {
          field: field,
          order: order
      }
    });

    this.model.queryState.set('sort', sorts, {silent: true});
  },

  /** gets sort clause from RQL */
  _getSorts: function() {
    var sort = [],
      args = this.model.queryState.get('rql').args;

    for (var i = 0; i < args.length; i++) {
      if (args[i].name === 'sort') {
        sort = args[i].args;
        break;
      }
    };

    return sort;
  }
});


})(jQuery, _, recline.View);

