import { Command } from 'commander';
import { createInitCommand } from './commands/init';
import { createPlanCommand } from './commands/plan';
import { createStatusCommand } from './commands/status';
import { createCaptureCommand } from './commands/capture';

const program = new Command();

program
  .name('autoguide')
  .description('Automated video guide generator for software products')
  .version('0.1.0');

program.addCommand(createInitCommand());
program.addCommand(createPlanCommand());
program.addCommand(createStatusCommand());
program.addCommand(createCaptureCommand());

program.parse();
