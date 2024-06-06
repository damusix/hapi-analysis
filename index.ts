import fs from 'fs';
import { log, yellow, preScenarios, postScenarios, stepper } from './helpers';

const args = process.argv.slice(2);

const scenarios = fs.readdirSync('./scenarios', 'utf8').map(
    file => file.replace('.ts', '')
);

stepper.shouldStep = args.includes('--step');
const runAll = args.includes('all') || args.includes('*');
const wantedScenarios = args._omit('--step', 'all');
const hasScenarios = wantedScenarios.length > 0;
const hasValidScenarios = runAll || wantedScenarios.every(
    arg => scenarios.includes(arg.replace('--', ''))
);

const invalidScenarios = wantedScenarios.filter(
    arg => (
        !scenarios.includes(arg.replace('--', '')) &&
        arg !== '--step'
    )
);

const help = (reason: string) => {

    log.badUsage(reason);
    log.instruct('Usage: pnpm start [options]');
    log.instruct('Options:');

    log.instruct(`${yellow('  --step')}`);
    log.instruct('      Interactively step through the scenarios');
    log.instruct(`${yellow('  --all')}`);
    log.instruct('      Run all scenarios (overrides other options)');

    log.instruct('Scenario options:');

    scenarios.forEach(
        scenario => log.instruct(yellow(`  ${scenario}`))
    );

    process.exit(1);
}


if (!runAll && !hasScenarios) {

    help('No scenarios provided');
}

if (
    hasScenarios &&
    !hasValidScenarios
) {

    log.badUsage(invalidScenarios.join(', '));

    help('Invalid scenarios provided');
}

stepper.emit('ready');

const run = async () => {

    stepper.emit('starting-scenarios');
    preScenarios();

    if (runAll) {

        for (const scn of scenarios) {

            await import(`./scenarios/${scn}`);
        }
    }
    else {

        for (const scn of wantedScenarios) {

            await import(`./scenarios/${scn}`);
        }
    }

    postScenarios();
    rungivens();
}

run();