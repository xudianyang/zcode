/**
 * JSON简单查询功能
 * jsonq.js: a simple javascript library for querying JSON
 * @author wukezhan
 */

(function(exports){
    'use strict';

    function type_of(obj){
        return Object.prototype.toString.call(obj);
    }
    function each(obj, callback){
        if(type_of(obj) == '[object Object]'){
            for(var i in obj){
                if(callback.call(null, obj[i], i)===false){
                    return false;
                }
            }
            return true;
        }else if(type_of(obj) == '[object Array]'){
            for(var i= 0, l=obj.length; i<l; i++){
                if(callback.call(null, obj[i], i)===false){
                    return false;
                }
            }
            return true;
        }
    }

    function JSONQ(){
        var _data = {};


        /**
         * 载入数据
         * @param {Object} data
         * @return {JSONQ}
         */
        this.load = function(data){
            var zs = this;
            var $id = 1;
            _data = data;
            return this;
        };

        this.prepare = function(){
            var _results = [];
            each(_data, function(cursor, i){
                cursor['$id'] = i;
                _results.push(cursor);
            });
            return new JSONQ.Results(_results);
        };
    }
    JSONQ.fn = JSONQ.prototype;

    /**
     * 根据指定条件查询数据
     * @param {Object} query
     * @return {JSONQ}
     */
    JSONQ.fn.find = function(query){
        var zs = this;
        var results = this.filter(query.filter);
        if(query.filter){
            results.filter(query.filter);
        }
        if(query.orderBy){
            results.orderBy(query.orderBy);
        }
        if(query.limit){
            results.limit(query.limit);
        }
        if(query.walker){
            results.each(query.walker);
        }
        if(query.success){
            query.success.call(this, results.get());
        }
        return this;
    };


    /**
     *
     * @param results
     * @constructor
     */
    JSONQ.Results = function(results){
        var _results = results;

        /*this.__defineGetter__('data', function(){
         return _data;
         });
         this.__defineSetter__('data', function(data){
         this.load(data);
         });*/
        this.__defineGetter__('results', function(){
            return _results;
        });

        /**
         * 按指定条件查询得到结果集
         * @param {Array|Object|Function|JSONQ.Filter} filter
         * [k, h, v]
         * function(){}
         * {k1:v1, k2:v2, ...}
         * [filter1, '$or', filter2, ...]
         * JSONQ.Filter
         * @return {JSONQ.Results}
         */
        this.filter = function(filter){
            var tmp = [];
            var type = type_of(filter);
            if(type == '[object Undefined]'){
                return this;
            }else if(type == '[object Function]'){
                var zs = this;
                each(_results, function(cursor){
                    if(filter.call(zs, cursor)){
                        tmp.push(cursor);
                    }
                });
            }else if(type == '[object Array]'||type == '[object Object]'){
                if(!(type == '[object Object]' && filter.$constructor=='JSONQ.Filter')){
                    filter = new JSONQ.Filter(filter)
                }
                var prepared = filter.prepared();
                each(_results, function(cursor){
                    if(JSONQ.Filter.execute(cursor, prepared)){
                        tmp.push(cursor);
                    }
                });
            }
            _results = tmp;
            return this;
        };

        /**
         * 对结果集进行排序
         * @param {Array} orderBy
         * @return {JSONQ.Results}
         */
        this.orderBy = function(orderBy){
            var zs = this;
            if(type_of(orderBy[0]) == '[object String]'){
                orderBy = [orderBy];
            }
            for(var i= 0, l=orderBy.length; i<l; i++){
                var ob = orderBy[i];
                if(i>0){
                    var ob_ = orderBy[i-1];
                    _results.sort(function(a, b){
                        var flag = ob_[1] && ob_[1] == '$desc'?(b[ob_[0]]-a[ob_[0]]):(a[ob_[0]]-b[ob_[0]]);
                        if(flag==0){//如果上一个排序条件相等,才执行下一排序策略
                            return (ob[1] && ob[1] == '$desc'?(b[ob[0]]-a[ob[0]]):(a[ob[0]]-b[ob[0]]));
                        }
                        return 0;
                    });
                }else{
                    _results.sort(function(a, b){
                        return (ob[1] && ob[1] == '$desc'?(b[ob[0]]-a[ob[0]]):(a[ob[0]]-b[ob[0]]));
                    });
                }
            }
            return this;
        };
        /**
         * 将结果集精简为指定位置开始的指定数目条记录
         * @param {Number|Array} limit
         * @param {Null|Number} _
         * @return {JSONQ.Results}
         */
        this.limit = function(limit, _){
            var start= 0, end=0;
            if(type_of(limit) == '[object Number]'){
                if(_){
                    start = limit;
                    end = parseInt(_);
                }else{
                    end = parseInt(limit);
                }
            }else if(type_of(limit) == '[object Array]'){
                start = parseInt(limit[0]);
                end = limit[0]+parseInt(limit[1]);
            }
            _results = _results.slice(start, end);
            return this;
        };
    };
    JSONQ.Results.fn = JSONQ.Results.prototype;
    /**
     * 从结果集中获取部分结果
     * @param {Number|Undefined} n1
     * @param {Undefined|Number} n2
     * @return {Array}
     */
    JSONQ.Results.fn.get = function(n1, n2){
        if(!n1 && !n2){
            return this.results;
        }
        var start = n1, end = n1;
        if(n2){
            end = n1 + n2;
        }else{
            start = 0;
        }
        return this.results.slice(start, end);
    };
    /**
     * 当前结果集遍历接口
     * @param {Function} walker
     */
    JSONQ.Results.fn.each = function(walker){
        each(this.results, walker);
        return this;
    };

    /**
     *
     * @param callback
     * @return {Array}
     */
    JSONQ.Results.fn.map = function(callback){
        var zs = this;
        var result = [];
        each(this.results, function(cursor){
            result.push(callback.call(this, cursor));
        });
        return result;
    };
    /**
     *
     * @param callback
     * @param initial
     * @return {*}
     */
    JSONQ.Results.fn.reduce = function(callback, initial){
        var zs = this;
        var result = initial||null;
        each(this.results, function(cursor){
            result = callback.call(zs, result, cursor);
        });
        return result;
    };
    JSONQ.Results.fn.size = function(){
        return this.results.length;
    };
    JSONQ.Results.fn.count = function(callback){
        if(!callback){
            return this.size();
        }else{
            if(type_of(callback)!='[object Function]'){
                throw {msg:'Error: invalid callback type!', obj:callback};
            }
            var count = 0;
            each(this.results, function(cursor){
                if(callback.call(null, cursor)){
                    count ++;
                }
            });
            return count;
        }
    };
    JSONQ.Results.fn.groupBy = function(callback){
        var results = {};
        each(this.results, function(cursor){
            var key = callback.call(null, cursor);
            if(!results[key]){
                results[key] = [];
            }
            results[key].push(cursor);
        });
        return results;
    };

    /**
     * 
     * @param filter
     * [$k, $h, $v]
     * [$h, $v]
     * function(){}
     * {k1:v1, k2:v2, ...}
     * [filter1, '$or', filter2, ...]
     */
    JSONQ.Filter = function(filter){
        var _filter = JSONQ.Filter.format(filter);
        this.prepared = function(){
            return _filter;
        };
        this.__defineGetter__('$constructor', function(){
            return 'JSONQ.Filter';
        });
    };
    JSONQ.Filter.fn = JSONQ.Filter.prototype;
    JSONQ.Filter.execute = function(cursor, filter){
        var flag = false;
        var type = type_of(filter);
        if(type == '[object Array]'){
            each(filter, function(grp){
                var _flag = true;
                flag = flag || each(grp, function(f){
                    _flag = _flag && JSONQ.Filter.execute(cursor, f);
                    return _flag;
                });
            });
        }else{
            if(type=='[object Function]'){
                flag = filter.call(null, cursor, filter);
            }else{
                flag = JSONQ.Filter.$[filter.$h](cursor, filter);
            }
        }
        return flag;
    };
    /**
     *
     * @param filter
     * [k, h, v]
     * function(){}
     * {k1:v1, k2:v2, ...}
     * [filter1, '$or', filter2, ...]
     * @return {*}
     */
    JSONQ.Filter.format = function(filter){
        if(!filter){
            return ;
        }
        var type = type_of(filter);
        if(type == '[object Array]'){
            var type0 = type_of(filter[0]);
            if(type0 == '[object Array]' || type0 == '[object Object]' || type0 == '[object Function]'){
                return this.formatArrays(filter);
            }else{
                return this.formatArray(filter);
            }
        }else if(type == '[object Object]'){
            if(filter.$constructor=='JSONQ.Filter'){
                return filter.prepared();
            }
            return [this.formatObject(filter)];
        }else if(type == '[object Function]'){
            return filter;
        }else{
            throw {msg:'Error filter type!', obj:filter};
        }
    };
    JSONQ.Filter.formatArray = function(filter){
        var _filter;
        if(filter.length == 3){
            _filter = {
                $k: filter[0],
                $h: filter[1],
                $v: filter[2]
            };
        }else if(filter.length == 2){
            _filter = {
                $h: filter[0],
                $v: filter[1]
            };
        }else{
            throw {msg:'Error filter type: array length less than 2!', obj:filter};
        }
        if(_filter.$h == '$filter'){
            if(_filter.$v.$constructor == 'JSONQ.Filter'){
                _filter.$v = _filter.$v.prepared();
            }else{
                _filter.$v = (new JSONQ.Filter(_filter.$v)).prepared();
            }
        }
        if(_filter.$h[0] != '$'){
            _filter.$t = _filter.$h;
            _filter.$h = JSONQ.Filter.token2handler[_filter.$t];
            if(!_filter.$h){
                throw {msg: 'Error filter type!', obj:filter};
            }
        }
        return _filter;
    };
    JSONQ.Filter.formatObject = function(filter){
        var _filter = [];
        each(filter, function(v, k){
            _filter.push({
                $k: k,
                $h: '$compare',
                $v: v,
                $t: '='
            });
        });
        return _filter;
    };
    JSONQ.Filter.formatArrays = function(filter){
        var grps = [];
        var grp = [];
        for(var i in filter){
            if(type_of(filter[i]) == '[object String]'){
                if(filter[i] == '$or'){
                    grps.push(grp);
                    grp = [];
                }else{
                    if(filter[i] != '$and'){
                        throw {msg: 'error link type : '+filter[i]};
                    }
                }
            }else{
                grp.push(JSONQ.Filter.format(filter[i]));
            }
        }
        grps.push(grp);
        return grps;
    };




    /**
     * 工具方法
     * @type {Object}
     */
    JSONQ.util = {
        /**
         *
         * @param {Array} arr
         * @return {Array}
         */
        unique: function(arr){
            var tmp = [];
            var key = {};
            each(arr, function(cursor, index){
                var _id = cursor['$id'];
                if(!key[_id]){
                    tmp.push(cursor);
                    key[_id] = 1;
                }else{
                    key[_id]++;
                }
            });
            return tmp;
        },
        /**
         *
         * @param {Array} arr1
         * @param {Array} arr2
         * @return {Array}
         */
        u: function(arr1, arr2){
            each(arr2, function(cursor){
                arr1.push(cursor);
            });
            return JSONQ.util.unique(arr1);
        },
        /**
         *
         * @param {Array} arr1
         * @param {Array} arr2
         * @return {Array}
         */
        n: function(arr1, arr2){
            var o1 = {};
            var arr = [];
            each(arr1, function(cursor){
                o1[cursor['$id']] = cursor;
            });
            each(arr2, function(cursor){
                if(o1[cursor['$id']]){
                    arr.push(o1[cursor['$id']]);
                }
            });
            return arr;
        }
    };
    JSONQ.Filter.token2handler = {
        '=':'$compare',
        '>':'$compare',
        '<':'$compare',
        '==':'$compare',
        '!=':'$compare',
        '>=':'$compare',
        '<=':'$compare',
        '===':'$compare'
    };
    JSONQ.Filter.$ = {
        /**
         *
         * @param {Mixed} cursor
         * @param {Array} filter
         * @return {Boolean}
         */
        $compare: function(cursor, filter){
            var v1 = cursor[filter.$k],
                v2 = filter.$v;
            switch (filter.$t){
                case '=':
                case '==':
                    return v1 == v2;
                case '>':
                    return v1 > v2;
                case '<':
                    return v1 < v2;
                case '>=':
                    return v1 >= v2;
                case '<=':
                    return v1 <= v2;
                case '!=':
                    return v1 != v2;
            }
        },
        /**
         *
         * @param {Object} cursor
         * @param {Array} filter
         * @return {Boolean}
         */
        $in: function(cursor, filter){
            if(!filter.$v){
                return false;
            }
            for(var i in filter.$v){
                if(cursor[filter.$k] == filter.$v[i]){
                    return true;
                }
            }
            return false;
        },
        /**
         *
         * @param {Object} cursor
         * @param {Array} filter
         * @return {Boolean}
         */
        $notin: function(cursor, filter){
            if(!filter.$v){
                return true;
            }
            for(var i in filter.$v){
                if(cursor[filter.$k] == filter.$v[i]){
                    return false;
                }
            }
            return true;
        },
        /**
         *
         * @param {Object} cursor
         * @param {Array} filter
         * @return {Boolean}
         */
        $not: function(cursor, filter){
            return cursor[filter.$k] != filter.$v;
        },
        /**
         *
         * @param {Object} cursor
         * @param {Array} filter
         * @return {Boolean}
         */
        $match: function(cursor, filter){
            return filter.$v.test(cursor[filter.$k]);
        },
        /**
         *
         * @param {Object} cursor
         * @param {Array} filter
         * @return {Boolean}
         */
        $filter: function(cursor, filter){
            if(filter.$v && type_of(cursor[filter.$k])!='[object Undefined]'){
                return JSONQ.Filter.execute(cursor[filter.$k], filter.$v);
            }
            return false;
        },
        /**
         *
         * @param {Object} cursor
         * @param {Array} filter
         * @return {Boolean}
         */
        $callback: function(cursor, filter){
            return filter.$v.call(null, cursor, filter.$k);
        }
    };

    exports.JSONQ = exports.jsonq = JSONQ;

})(this.exports?this.exports:this);
