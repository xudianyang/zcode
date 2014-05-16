#Air Redis Queue

###简介

Air Redis Queue是一个基于redis和phpredis扩展实现的高效的、原子的、实时的消息队列操作库。

###使用

Air Redis Queue本身对外只提供4个接口，使用的方法非常简单直观。

入队列操作：

```php

$rq = new \Air\Redis\Queue();
$n = 10000;
while($n--){
	$rq->enqueue('test', array($n=>microtime(1)));
}

```

出队列操作：

```php

$rq = new \Air\Redis\Queue();
$start = 0;
while(1){
	$item = $rq->dequeue('test');
	if($item){
		if(isset($item[9999])){
			$start = $item[9999];
		}
		if(isset($item[0])){
			echo "total time:", microtime(1)- $start,"\n";
		}
	}else{
		echo "idling.\n";
	}
}

```