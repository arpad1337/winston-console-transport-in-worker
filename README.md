[![npm version](https://badge.fury.io/js/@rpi1337%2Fwinston-console-transport-in-worker.svg)](https://badge.fury.io/js/@rpi1337%2Fwinston-console-transport-in-worker) 
[![Build Status](https://app.travis-ci.com/arpad1337/winston-console-transport-in-worker.svg?branch=master)](https://app.travis-ci.com/arpad1337/winston-console-transport-in-worker)

# The Problem

In NodeJS's V8 and similarly in other JS engines `console.log` is just a wrapper around `process.stdout.write` with formatting options and it is a Blocking IO operation. In case of large payloads (API responses, formatted buffers etc) writing to console can be a very resource and time consuming operation, which can cause performance degradation in APIs. Many corporations demand for capturing every event in and out in their web-based software systems, mainly for Audit and Compliance reasons.

In modern NodeJS backend applications the Winston logging library is the most commonly used approach to tackle logging tasks due to its flexibility on Log Entry formatting, and the numerous Transport options available, such as HTTP, Stream, File and Console, next to many community built extensions.

Most of PaaS Cloud Platforms and Dockerized - process oriented - hosting solutions, whether Managed or built on top of one of the available Open Source Could Orchestration tools however demanding for Console based logging strategy, due to the simplicity of capturing the outputs of process models realtime, which have some challenges on its own, especially at scale.

# The Solution

This extension is aimed to overcome two limitations of the NodeJS platform:
- throttling the event loop when logging operation is dispatched - eg blocking applications to process new incoming requests, or delaying the execution of business-critical logic
- delaying response delivery to clients if the payload of a log entry is large and the logging operation takes place before serving the requestor networked-component

To overcome these I have created an extension on top of `winston.transports.Console` called `ConsoleTransportInWorker` which works the following way:
- when the transport is configured for a `winston.Logger` instance, on initialization the Strategy is creating a separate Worker Thread using `worker_threads` internal module (node >=v16)
- when a logging operation is dispatched, the log event object is forwarded to this Worker Thread
- the Worker Thread  - using its own separate Event Loop - performs the Blocking `console.log` IO operation - note, that the dispatcher's thread is not affected at this point
- when the write was successful, the Worker Thread dispatches an event back to the main thread, which then triggers the logging queue to continue processing the next entries

# Usage

```typescript
import * as winston from 'winston';
import { ConsoleTransportInWorker } from '@rpi1337/winston-console-transport-in-worker';

...

export const logger: winston.Logger = winston.createLogger({
    format: combine(timestamp(), myFormat),
    level: Level.INFO,
    transports: [new ConsoleTransportInWorker()],
});
```

# Performance test (a preview)

```
git clone https://github.com/arpad1337/winston-console-transport-in-worker.git
cd winston-console-transport-in-worker
npm install
npm run build
npm test
```


# Benchmark results

Logging pre-generated large strings, ellapsed time between logging call (`transport.log(...)`) start and completion

![Benchmark results](https://www.arpi.im/public/benchmark_3.png)

# Author

[@rpi1337](https://twitter.com/rpi1337)
