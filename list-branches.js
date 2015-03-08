#!/usr/bin/env node

var program  = require('commander');
var exec     = require('child_process').exec;
var fs       = require('fs');
var util     = require('util');
var execSync = require('child_process').execSync;
var ProgressBar = require('progress');

program
    .version('0.0.1')
    .usage('[options] <directory>')
	.option('-q, --quiet', 'Doesn\'t display details for each branch')
	.option('-a, --age <n>', 'Displays or deletes branches which have not any commit since [n] days', parseInt)
	.option('-t, --total', 'Displays the total of branches')
	.option('-u, --user <user>', 'Filter on a specific user')
	.option('--merged', 'Loop on merged branches only')
	.option('--nomerged', 'Loop on not-merged branches only')
	.option('--delete', 'Delete the branches')
	.parse(process.argv);

if (program.delete) {
  program.quiet = true;
  program.total = false;
}

var cwd = process.cwd();
if (program.args.length !== 0) {
  try  {
    fs.lstatSync(program.args[0] + '/.git');
  } catch (e) {
    console.log(util.format("'%s' is not a valid git project directory", program.args[0]));
    process.exit(0);
  }

  cwd = program.args[0];
}

var command = 'git branch -r';
if (program.merged) {
  command += ' --merged gatekeeper/stable';
} else {
  if (program.nomerged) {
    command += ' --no-merged gatekeeper/stable';
  }
}

exec(command, {cwd: cwd, encoding: 'utf8'}, function(err, stdout) {
  if (err) throw err;

  var branchDaysMapping = {};

  var branches = stdout.split("\n").filter(function(branch, index, branches) {
    branch = branch.trim();

    var filter = 'gatekeeper/merge-requests/';
    if (program.user) {
      filter += program.user;
    }

    if (branch.indexOf(filter) === -1) {
      return false;
    }

    var nbDays = getNbDaysSinceLastCommitOfBranch(branch, cwd);
    if (program.age && nbDays < program.age) {
      return false;
    }

    branchDaysMapping[branch] = nbDays;

    return true;
  });

  if (!program.quiet) {
    branches.forEach(function(branch) {
      branch = branch.trim();
      console.log(util.format('Last commit on %s: %d days ago', branch, branchDaysMapping[branch]));
    });
  }

  if (program.delete) {
    var bar = new ProgressBar('deleting [:bar] :percent (:total branches)', { total: branches.length });
    branches.forEach(function(branch) {

      var i = 0;
      while (i++ < 5000000) {}
      bar.tick();
    });

  } else {
    showTotal(branches.length);
  }
});

function getNbDaysSinceLastCommitOfBranch(branch, cwd) {
  var date = execSync('git log -1 --pretty=format:"%cd" --date=iso ' + branch, {cwd: cwd, encoding: 'utf8'});
  date = new Date(date);
  var nbDays = Math.floor((new Date() - date) / (3600 * 24 * 1000));

  return nbDays;
}

function showTotal(total) {
  if (program.total) {
    if (program.merged || program.nomerged) {
      console.log(util.format('Total: %d %s branches', total, program.merged ? 'merged' : 'not merged'));
    } else {
      console.log(util.format('Total: %d branches', total));
    }
  }
}
