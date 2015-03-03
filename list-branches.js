var program = require('commander');

program.version('0.0.1')
	.option('-q, --quiet', 'Doesn\'t display details for each branch')
	.option('-a, --age <n>', 'Displays or deletes branches which have not any commit since [n] days', parseInt)
	.option('-t, --total', 'Displays the total of branches')
	.option('-u, --user <user>', 'Filter on a specific user')
	.option('--merged', 'Loop on merged branches only')
	.option('--no--merged', 'Loop on not-merged branches only')
	.option('--force-delete', 'Force delete of the branches')
	.parse(process.argv);
