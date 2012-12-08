
this.recline = this.recline || {};
this.recline.Backend = this.recline.Backend || {};

(function(_, $, Backbone, warehouse, Backend) {

/** transform Q promise to jQuery promise */
function jqpromise(promise) {
    var d = new $.Deferred();
    promise
        .then(function() {
            d.resolve.apply(d, arguments);
        })
        .fail(function() {
            d.reject.apply(d, arguments);
        })

    return d.promise();
}

/**
 * transform subset of ES query (sorting and limiting) to RQL
 * this is needed for compatibility with existing components
 */
function es2rql(q) {
    var ret = _.rql(q.rql ? q.rql.toString() : '');
    var sorts = [];
    if (q.sort) {
        for (var i = 0; i < q.sort.length; i++) {
            if (q.sort[i].field && q.sort[i].order) {
                sorts.push((q.sort[i].order === 'asc' ? '+' : '-') + q.sort[i].field)
            } else {
                for (var sort in q.sort[i]) {
                    var order = q.sort[i][sort].order || q.sort[i][sort];
                    sorts.push((order === 'asc' ? '+' : '-') + sort);
                }
            }
        };
    }
    if (sorts.length === 0) {
        ret.args = _.filter(ret.args, function(x) {return x.name !== 'sort'});
    } else {
        ret.sort(sorts);
    }
    if (q.size) {
        if (q.from) {
            ret.limit(q.size, q.from);
        } else {
            ret.limit(q.size);
        }
    }

    return ret;

}

var Base = function() {
    this.initialize && this.initialize.apply(this, arguments);
};

Base.extend = Backbone.Model.extend;

_.extend(Base.prototype, {
    fetch: function(dataset) {
        var store = this._getWarehouseStore(dataset);

        return jqpromise(store.query('')
            .then(function(result) {
                return {
                    records: result
                };
            }));
    },
    query: function(queryObj, dataset) {
        var store = this._getWarehouseStore(dataset),
            q = es2rql(queryObj).toString();

        return jqpromise(store.query(q)
            .then(function(result) {
                if (queryObj.q) {
                    // hack for recline fulltext
                    var r = new RegExp(queryObj.q, 'i');
                    result = result.filter(function(x) {
                        for (var p in x) {
                            if (x.hasOwnProperty(p) && r.exec(x[p])) {
                                return true;
                            }
                        }
                        return false;
                    });
                }
                return {
                    total: result.length,
                    hits: result
                };
            }));
    },
    save: function(changes, dataset) {
        var store = this._getWarehouseStore(dataset);
        var dfd       = $.Deferred();
        var total     = changes.creates.length + changes.updates.length + changes.deletes.length;

        var results   = {'done': [], 'fail': [] };

        function resolve_cb() {
            if (--total == 0) {
                dfd.resolve(results);
            }
        }

        function succ_fn(op, doc) {
            return function() {
                results.done.push({'op': op, 'record': doc, 'reason': ''});
                resolve_cb();
            };
        }

        function fail_fn(op, doc) {
            return function(msg) {
                results.done.push({'op': op, 'record': doc, 'reason': msg});
                resolve_cb();
            };
        }

        var i, doc;

        for (i in changes.creates) {
            doc = changes.creates[i];
            store.add(doc).then(succ_fn('create', doc), fail_fn('create', doc));
        }

        for (i in changes.updates) {
            doc = changes.updates[i];
            store.put(doc).then(succ_fn('update', doc), fail_fn('update', doc));
        }

        for (i in changes.deletes) {
            doc = changes.deletes[i];
            store['delete'](doc).then(succ_fn('delete', doc), fail_fn('delete', doc));
        }

        return dfd.promise();
    }
});

// register backends to recline as singletons, each ihnerits form base
_.each(warehouse, function(Cls, b) {
    if (!b.match(/Backend$/)) {
        return;
    }
    var name = b.replace(/Backend$/, '');
    b = 'Warehouse' + name;
    Backend[b] = new (Base.extend({
        __type__: b.toLowerCase(),
        _getWarehouseStore: function(dataset) {
            if (dataset) {
                this.dataset = dataset;
            } else {
                dataset = this.dataset || {};
            }
            if (dataset._warehouse === undefined) {
                var w = dataset._warehouse = {};
                w.backend = new Cls();
                w.store = w.backend.objectStore(dataset.warehouse.name || 'default', dataset.warehouse.options || {});
            }
            return dataset._warehouse.store;
        }
    }));
    if (name === 'Memory') {
        Backend[b].transform = function(func, dataset) {
            var store = this._getWarehouseStore(dataset);
            var d = $.Deferred();
            store.fromJSON(_.values(store._store).map(func));
            d.resolve(true);
            return d.promise();
        }
    }
});


Backend.Warehouse = Backend.Warehouse || {};
Backend.Warehouse.es2rql = es2rql;

})(_, jQuery, Backbone, warehouse, this.recline.Backend);
