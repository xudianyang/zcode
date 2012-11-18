/**
 * @author wukezhan
 * In Node.js
 */

var jsonq = require('./jsonq').JSONQ;

var timer = {};
function time(id){
    if(!timer[id]){
        timer[id] = (new Date()).getTime();
    }else{
        console.log(id+': '+((new Date()).getTime() - timer[id])+'\n');
        timer[id] = (new Date()).getTime();
    }
}

(function(){
    var data = [
        {id:0, data:'a', time:1000},
        {id:1, data:'a', time:1001},
        {id:2, data:'b', time:1100},
        {id:3, data:'c', time:1010},
        {id:4, data:'4', time:1001},
        {id:5, data:'e', time:1000},
        {id:6, data:'f', time:1110},
        {id:7, data:'g', time:1011},
        {id:8, data:'8', time:1010},
        {id:9, data:'9', time:1112, i:{love:'you'}},
        {id:10, data:'9', time:1116}
    ];
    var jq = new jsonq();
    jq.load(data);

    var filter = new jsonq.Filter([
        [
            ['data', '$match', /\d+/],
            {
                data: 9,
                time:1112
            }
        ],
        ['time', '>', '1000']
    ]);

    time('#0');
    console.log('#0:\n', jq.prepare().filter(filter).get());
    time('#0');
    filter = new jsonq.Filter({data: 9});
    time('#1');
    console.log('#1:\n', jq.prepare().filter(filter).get());
    time('#1');

    time('#2');
    console.log('#2:\n', jq.prepare().filter([
         ['time', '>', '1000'],
         [
            ['data', '$match', /\d+/],
            //{data:9}
         ]
    ]).get());
    console.log('#2:\n', jq.prepare().filter({data:9}).get());
    time('#2');

    time('#3');
    filter = new jsonq.Filter([['i', '$filter', ['love', '==', 'you']]]);
    //p = filter.prepared();
    filter = new jsonq.Filter([['i', '$filter', new jsonq.Filter(['love', '==', 'you'])]]);
    //p = filter.prepared();
    //console.log(p[0][0]);
    console.log('#3:\n', jq.prepare().filter(filter).get());
    time('#3');

    time('#4');
    console.log('#4:\n', jq.prepare().filter([['id', '>', '5'],/*['$callback', function(cursor){
        console.log(cursor);
        return cursor.time==1112;
    }],*/['id', '$in', [7, 8]]]).get());
    time('#4');


    time('#5');
    console.log('#5:\n', jq.prepare().filter().map(function(cursor){
        return cursor.id+', '+cursor.data+', '+cursor.time;
    }));
    time('#5');


    time('#6');
    console.log('#6\n', jq.prepare().filter(function(cursor){
        var ret = cursor.time<1110;
        return ret;
    }).orderBy([['time', '$desc'],['id','$desc']]).get());
    time('#6');

    time('#7');
    console.log('#7:\n', jq.prepare().filter().reduce(function(initial, cursor){
        return initial + cursor.time;
    }, 0));
    time('#7');

    time('#8');
    console.log('#8:\n', jq.prepare().filter([
        new jsonq.Filter(['id','>',5]),
        new jsonq.Filter(['id','<',9])
    ]).get());
    time('#8');

    time('#9');
    console.log('#9:\n', jq.prepare().groupBy(function(cursor){
        return /\d+/.test(cursor.data)?'d':'w';
    }));
    time('#9');
})();

/*
*/