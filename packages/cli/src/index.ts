import { Command } from 'commander';

const program = new Command();

program
  .name('autoguide')
  .description('Automated video guide generator for software products')
  .version('0.1.0');

program.parse();
