import EventEmitter from 'events';
import { green, log } from '.';
import { Request } from '@hapi/hapi';

class Stepper extends EventEmitter<{
    'ready': [],
    'starting-scenarios': [],
    step: [],
    responded: [Request],
    'next-scenario': [],
}> {

    private resolve: (() => void)[] = [];
    private pendingRequest:  Promise<void>[] = [];

    shouldStep = false;

    constructor() {

        super();

        this.on('step', () => {

            const resolve = this.resolve.shift();

            if (resolve) {

                resolve();
            }

            // Empty the resolve array
            if (this.resolve.length) {

                this.emit('step');
            }
        });
    }

    requesting(req: Request) {

        log.comments([
            `Requesting ${req.info.id}`,
            `RouteMethod ${req.route.method}`,
            `ReqMethod ${req.method}`,
            `ReqPath ${req.path}`,
        ]);

        const promise = new Promise<void>((resolve) => {

            this.once('responded', (_req) => {

                log.comments([
                    `Responded to ${_req.info.id}`,
                    `RouteMethod ${req.route.method}`,
                    `ReqMethod ${req.method}`,
                    `ReqPath ${req.path}`,
                ]);

                req.info.id === _req.info.id && resolve();
            });
        });

        this.pendingRequest.push(promise);
    };

    async finishRequests() {

        await Promise.all(this.pendingRequest);
    }

    async next(msg?: string) {


        if (!this.shouldStep) {

            return;
        }


        if (msg) {

            log.pause(msg);
        }

        return new Promise<void>((resolve) => {

            this.resolve.push(resolve);
        });
    }

    async stop() {

        this.shouldStep = false;
        this.emit('step');
    }

    async done() {

        if (this.shouldStep) {

            log.instruct('All tests completed');
        }

        process.exit(0);
    }

    async skip() {

        const was = this.shouldStep;

        this.once('next-scenario', () => {

            this.shouldStep = was;
        });

        await this.stop();
    }
};

export const stepper = new Stepper();


stepper.once('ready', () => {

    if (!stepper.shouldStep) {
        return;
    }

    const stepThrough = ['enter', 'return'];
    const finish = ['complete', 'finish', 'done', 'f'];
    const exit = ['exit', 'quit', 'q'];
    const skip = ['skip', 's'];

    process.stdin.on('data', async (ev) => {

        const line = ev.toString().trim();

        if (finish.includes(line)) {

            await stepper.stop();
        }

        if (skip.includes(line)) {

            await stepper.skip();
        }

        if (exit.includes(line)) {

            process.exit(1);
        }

        stepper.emit('step');
    });

    const _stepThrough = stepThrough.map(k => green(k)).join(' or ');
    const _finish = finish.map(k => green(k)).join(' or ');
    const _exit = exit.map(k => green(k)).join(' or ');
    const _skip = skip.map(k => green(k)).join(' or ');

    stepper.on('starting-scenarios', () => {

        log.instruct('Running in step mode');
        log.instruct('Every step will pause the program and wait for your input so that you can inspect the logs');
        log.instruct(`Press ${_stepThrough} to step through the tests`);
        log.instruct(`Write ${_finish} to exit step mode`);
        log.instruct(`Write ${_exit} to exit the program`);
        log.instruct(`Write ${_skip} to skip the given scenario`);
    });
});
