import chalk from 'chalk';

export const logger = {
  info(msg: string) {
    console.log(chalk.blue('ℹ'), msg);
  },

  success(msg: string) {
    console.log(chalk.green('✓'), msg);
  },

  warn(msg: string) {
    console.log(chalk.yellow('⚠'), msg);
  },

  error(msg: string) {
    console.error(chalk.red('✗'), msg);
  },

  step(label: string, detail: string) {
    console.log(chalk.gray(`  [${label}]`), detail);
  },

  header(msg: string) {
    console.log();
    console.log(chalk.bold.white(msg));
    console.log(chalk.gray('─'.repeat(60)));
  },

  table(headers: string[], rows: string[][]) {
    const colWidths = headers.map((h, i) =>
      Math.max(h.length, ...rows.map((r) => (r[i] || '').length))
    );

    const formatRow = (cells: string[]) =>
      cells.map((c, i) => c.padEnd(colWidths[i])).join(' | ');

    console.log(chalk.bold(formatRow(headers)));
    console.log(chalk.gray(colWidths.map((w) => '─'.repeat(w)).join('─┼─')));
    rows.forEach((row) => console.log(formatRow(row)));
  },

  blank() {
    console.log();
  },
};
