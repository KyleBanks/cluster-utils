# cluster-utils

[![npm version](https://badge.fury.io/js/cluster-utils.svg)](http://badge.fury.io/js/cluster-utils)
[![travis](https://travis-ci.org/KyleBanks/cluster-utils.svg?branch=master)](https://travis-ci.org/KyleBanks/cluster-utils.svg?branch=master)

The `cluster-utils` module aims to provide a variety of utilities for applications that run in clustered environments, either through the [cluster](https://nodejs.org/api/cluster.html) module, or distributed systems running in cloud based environments such as AWS.

### Installation

```
npm install --save cluster-utils
```

### Dependencies

`cluster-utils` requires an initialized [redis client](https://github.com/NodeRedis/node_redis) in order to synchronize tasks across the cluster. 

### Usage

```node
var redisClient = require('redis').createClient();

var clusterUtils = require('cluster-utils')(redisClient);
```

#### * clusterUtils.setTimeout(name, function, delay)

* `name`: A name used to identify this timeout function throughout the cluster. All application instances in the cluster should use the same function name for the same function.
* `function`: The function to be executed.
* `delay`: The delay, in milliseconds, after which the function should be executed.

The standard [setTimeout](http://www.w3schools.com/jsref/met_win_settimeout.asp) function provides a way to execute a function after a specified delay. 
 
`cluster-utils` provides a similar `setTimeout` function, which guarantees that only one instance of the application will run the specified function. 

```node
clusterUtils.setTimeout("Send Marketing Emails", function() {
    console.log("Sending marketing emails...");
}, 1000); 
```

In the example above, if you had a cluster of application instances all register the `Send Marketing Emails` function, only one in the cluster would execute.

#### * clusterUtils.config.setDefaultLockTimeout(timeout)

* `timeout` **(default: 10)**: The time, in seconds, that all subsequent locks will expire after.

Under the hood, much of the `cluster-utils` module's functionality relies on using a locking system via the redis client provided during initialization. 

For instance, when a `setTimeout` fires, a lock is set using the provided `name`. Only one application instance in the cluster can successfully perform a lock on the name at a time, and only the instance that performs the lock will execute the function. While a lock is in affect, no other instances of the application will execute a timeout function with the locked name.

When changing the default timeout, it is important to understand that a timeout that is too low may result in duplicate executions of the `setTimeout` function, for example. This is due to various external factors, including network latency, the internal JavaScript timers, and the event loop. 

```
clusterUtils.config.setDefaultLockTimeout(5);
```

### Tests

Test cases can be executed like so:

```
npm test
```

### Author

#### Kyle Banks
- http://kylewbanks.com
- https://github.com/KyleBanks
- https://twitter.com/kylewbanks

### License
```
The MIT License (MIT)

Copyright (c) 2016 Kyle Banks

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
