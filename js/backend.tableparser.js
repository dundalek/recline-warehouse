this.recline = this.recline || {};
this.recline.Backend = this.recline.Backend || {};

(function(_, Backend) {

function getTables(selector) {
    selector = selector || 'table';
    return $(selector)
        .map(function(i) {
            var el = $(this),
                label = el.find('caption:first').text();
            label = 'Table '+ (i+1) + (label ? (': ' + label) : '');
            return {
                count: el.find('th,td').length,
                data: {
                    el: el,
                    label: label
                }
            };
        })
        .sort(function(a, b) {return b.count - a.count})
        .map(function() {return this.data});
}

function parseTable(options) {
    var table;
    if (options.tables && typeof options.table === 'number') {
        table = options.tables[options.table];
    } else {
        table = options.table || getTables()[options.table||0];
    }
    table = (typeof table === 'string') ? $(table) : table;

    var autoOptions = {},
        ret = {},
        records = [],
        trs = table.find('tr');

    // autodetect options
    switch (trs.eq(0).find('th').length) {
        case 0:
            // zero th elements
            // autodetection: orientation is vertical when there are more rows than columns, otherwise horizontal
            autoOptions = {
                vertical: (trs.length >= trs.eq(0).find('th,td').length)
            };
            break;
        case 1:
            // one th, headers are probably horizontal
            autoOptions = {
                vertical: false,
                header: true
            };
            break;
        default:
            // many ths, orientaion is probably vertical
            autoOptions = {
                vertical: true,
                header: true
            };
    }

    // options from caller override autodetection
    options = _.extend(autoOptions, options || {});

    // extract fields for each row
    trs.each(function() {
        var row = [];

        $(this).find('th,td').each(function() {
            var value = $.trim($(this).text());
            var intValue = parseFloat(value);
            if (!isNaN(intValue) && ''+intValue === value) {
                value = intValue;
            }
            row.push(value);
        });

        records.push(row);
    });

    if (!options.vertical) {
        // transpose matrix if horizontal
        records = _.zip.apply(_, records);
    }

    if (options.header) {
        // extract first row as headers
        // FIXME: may produce duplicates
        ret.fields = records[0].map(function(x, i) {
            x = ''+x;
            var id = x.toLowerCase().replace(/[^_a-z0-9]+/g, '_') || ((i+1)+'');

            // if column name begins with digit, prepend 'c' to make it valid identifier
            if (id[0].match(/\d/)) {
                id = 'c' + id;
            }

            return {
                id: id,
                label: x
            };
        });
        records = records.slice(1);
    } else {
        ret.fields = _.map(records[0], function(x, i) {
            i += 1;
            return {id: 'c'+i, label: ''+i};
        });
    }

    records = records.map(function(row) {
        var obj = {};
        for (var i = 0; i < row.length; i++) {
            if (!ret.fields[i]) {
                ret.fields[i] = {id: 'c'+(i+1), label: ''+(i+1)};
            }
            obj[ret.fields[i].id] = row[i];	
            
        }
        return obj;
    });

    ret.records = records;
    return ret;
}

var TableParser = function() {};

if (Backend.WarehouseMemory) {
    TableParser = Backend.WarehouseMemory.constructor.extend({
        __type__: 'tableparser',
        _getWarehouseStore: function(dataset) {
            if (dataset._warehouse === undefined) {
                var w = dataset._warehouse = {};
                w.backend = new window.warehouse.MemoryBackend();

                //set json option from parse table
                var data = parseTable(dataset.tableParser);

                if (data.fields) {
                    w.fields = data.fields;
                }

                w.store = w.backend.objectStore('test', {json: data.records});
            }
            return w.store;
        },
        fetch: function(dataset) {
            var store = this._getWarehouseStore(dataset);

            var d = new jQuery.Deferred();
            store.query('')
                .then(function(result) {
                    var ret = {
                        records: result
                    };
                    if (dataset._warehouse.fields) {
                        ret.fields = dataset._warehouse.fields;
                    }
                    d.resolve(ret);
                })
                .fail(function() {
                    d.reject.apply(d, arguments);
                })

            return d.promise();
        }
    });
}

Backend.TableParser = new TableParser();
Backend.TableParser.parseTable = parseTable;
Backend.TableParser.getTables = getTables;

})(_, this.recline.Backend);