/*jshint multistr:true */

this.recline = this.recline || {};
this.recline.View = this.recline.View || {};

(function($, _, my) {

function autoCast(value) {
  var intValue = parseFloat(value);
  if (!isNaN(intValue) && ''+intValue === value) {
    return intValue;
  }
  return value;
}

//var builder_clauses = ['select', 'values', 'distinct', 'limit', 'sort'];
var builder_filters = ["eq", "ne", "lt", "le", "gt", "ge", "in", "out"/*, "contains", "excludes", "and", "or"*/];
var builder_operators = ["=", "!=", "<", "<=", ">", ">=", "in", "out"/*, "contains", "excludes", "and", "or"*/];

// create operator mapping
var operators = _.map(_.zip(builder_filters, builder_operators),
                     function(x) { return {id:x[0], label:x[1]}; });

my.RqlFilterEditor = Backbone.View.extend({
  className: 'recline-rql-filter-editor well',
  template: _.template(
    '<h3>Filters</h3> \
    <form> \
      <% _.each(filters, function(filter) { %> \
        <div class="filter" data-filter-id="<%- filter.id %>"> \
          <fieldset> \
            <select class="field"> \
              <% _.each(fields, function(field) { %> \
              <option <% print(filter.args[0] === field.id ? \'selected="selected"\' : \'\'); %> value="<%- field.id %>"><%- field.label %></option> \
              <% }); %> \
            </select> \
            <select class="operator"> \
              <% _.each(operators, function(operator) { %> \
              <option <% print(filter.name === operator.id ? \'selected="selected"\' : \'\'); %> value="<%- operator.id %>"><%- operator.label %></option> \
              <% }); %> \
            </select> \
            <a class="js-remove" href="#" title="Remove this filter">×</a> \
            <input type="text" value="<%- filter.args[1] %>" class="filter-value"> \
          </fieldset> \
        </div> \
      <% }); %> \
      <a href="#" class="js-add">Add filter</a> \
      <% if (filters.length) { %> \
      <button type="button" class="btn js-update">Update</button> \
      <% } %> \
    </form>'
  ),
  events: {
    'click .js-remove': 'onRemoveFilter',
    'click .js-add': 'onAddFilter',
    'click .js-update': 'onFiltersUpdate',
    'keydown input[type=text]': 'onKey'
  },

  initialize: function() {
    this.el = $(this.el);

    _.bindAll(this, 'render');
    this.model.fields.bind('all', this.render);
    this.model.queryState.bind('change:rql', this.render);

    this.render();
  },

  render: function() {
    var self = this;
    var tmplData = $.extend(true, {}, this.model.queryState.toJSON());
    tmplData.fields = this.model.fields.toJSON();
    tmplData.operators = operators;

    // extract filters out ot RQL clauses
    var filters = [];
    _.each(this.model.queryState.get('rql').args, function(item, idx) {
      if (item.name === '' || _.indexOf(builder_filters, item.name) !== -1) {
        var filter = _.clone(item);
        filter.id = idx;
        filters.push(filter);
      }
    });
    tmplData.filters = filters;

    // render and display
    var out = this.template(tmplData);
    this.el.html(out);
  },

  onAddFilter: function(e) {
    e.preventDefault();
    this.updateFilters();
    this.model.queryState.get('rql').args.push({name:'', args: ['', '']});
    this.render();
  },

  onRemoveFilter: function(e) {
    e.preventDefault();
    this.updateFilters();
    var $target = $(e.target);
    var filterId = $target.closest('.filter').attr('data-filter-id');
    this.model.queryState.get('rql').args.splice(filterId, 1);
    this.model.queryState.trigger('change');
  },

  onKey: function(e) {
    if (e.which === 13) {
      // return key
      e.preventDefault();
      this.onFiltersUpdate();
    }
  },

  onFiltersUpdate: function(e) {
    this.updateFilters();
    this.model.queryState.trigger('change');
  },

  updateFilters: function() {
    var rql = this.model.queryState.get('rql');

    // get filter values from DOM
    this.el.find('.filter').each(function() {
      var item = $(this),
          id = item.attr('data-filter-id'),
          field = item.find('.field option:selected').val(),
          operator = item.find('.operator option:selected').val(),
          value = item.find('input.filter-value').val();

      // auto casting to number if possible
      value = autoCast(value);

      // convert in/out values to array by splitting
      if (operator === 'in' || operator === 'out') {
        value = value.split(/\s*,\s*/).map(autoCast);
      }

      rql.args[id].name = operator;
      rql.args[id].args = [field, value];
    });
  }
});

})(jQuery, _, recline.View);

