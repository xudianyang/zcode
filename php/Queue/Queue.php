<?php
namespace Air\Redis;

/**
 * Air Redis Queue
 * @author wukezhan<wukezhan@gmail.com>
 * 2014-05-15 23:27
 *
 */
class Queue
{
    /**
     * @var \Redis the redis instance
     */
    protected $_redis;
    /**
     * @var array redis server config
     */
    protected $_server = array(
        'host' => '127.0.0.1',
        'port' => 6379,
        'timeout' => 0.0
    );

    public function __construct($server = array())
    {
        foreach ($server as $k => $v) {
            if (isset($this->_server[$k]) && $v) {
                $this->_server[$k] = $v;
            }
        }
        $this->_redis = new \Redis();
        $this->connect($this->_server['host'], $this->_server['port'], $this->_server['timeout']);
    }

    /**
     * connect to redis server
     * @param $host
     * @param int $port
     * @param float $timeout
     * @return $this
     */
    public function connect($host, $port = 6379, $timeout = 0.0)
    {
        $this->_redis->connect($host, $port, $timeout);
        return $this;
    }

    /**
     * @param $queue queue name
     * @param $data
     * @return $this
     */
    public function enqueue($queue, $data)
    {
        $this->_redis->rPush($queue, json_encode($data));
        return $this;
    }

    /**
     * @param $queue
     * @param int $timeout
     * @return bool|mixed
     */
    public function dequeue($queue, $timeout = 20)
    {
        try {
            $item = $this->_redis->blPop($queue, $timeout);
            if (!$item) {
                $this->_redis->ping();
            }
        } catch (\Exception $e) {
            echo 'Error ' . $e->getCode() . ': ' . $e->getMessage() . "\n";
            $this->connect($this->_server['host'], $this->_server['port'], $this->_server['timeout']);
        }
        return isset($item[1]) ? json_decode($item[1], 1) : false;
    }
}