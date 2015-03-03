var program = require('commander');
var Git = require('git-wrapper');
var Promise = require('promise');

program.version('0.0.1')
	.option('-q, --quiet', 'Doesn\'t display details for each branch')
	.option('-a, --age <n>', 'Displays or deletes branches which have not any commit since [n] days', parseInt)
	.option('-t, --total', 'Displays the total of branches')
	.option('-u, --user <user>', 'Filter on a specific user')
	.option('--merged', 'Loop on merged branches only')
	.option('--nomerged', 'Loop on not-merged branches only')
	.option('--force-delete', 'Force delete of the branches')
	.parse(process.argv);

var quiet = typeof program.quiet !== 'undefined';
var merged = typeof program['merged'] !== 'undefined' ? 'gatekeeper/stable' : false;
var nomerged = typeof program['nomerged'] !== 'undefined' ? 'gatekeeper/stable' : false;

var git = new Git({
  'git-dir': '/home/sites/sfPortal/.git'
});


var options = {
  'r': true,
  'merged': merged,
  'no-merged': nomerged
};
console.log(options);

var total = 0;
git.exec('branch', options, [], function(err, msg) {
  if (err) throw err;

  var branches = msg.split('\n');
  var promises = [];
  branches.forEach(function(branch) {
    branch = branch.trim();
    if (branch.indexOf('gatekeeper/merge-requests') === -1) {
      return;
    }

    if (typeof program.user !== 'undefined' && branch.indexOf('gatekeeper/merge-requests/' + program.user) === -1) {
      return;
    }

    if (typeof program.age !== 'undefined') {
      promises.push(isBranchTooOld(branch, program.age, quiet));
    } else {
      promises.push(Promise.resolve(true));
    }
  });

  if (typeof program.total !== 'undefined') {
    showTotal(promises, program.age, merged, nomerged);
  }
});

function isBranchTooOld(branch, age, quiet) {
  return new Promise(function(fulfill, reject) {
      git.exec('log', {'1': true, pretty: 'format:"%cd"', date: 'iso'}, [branch], function(err, msg) {
        if (err) return reject(err);

        var days = Math.round((new Date() - new Date(msg))/(24 * 3600 * 1000));

        if (days < age) {
          return fulfill(false);
        }

        if (!quiet) {
          console.log('Last commit on ' + branch + ' : ' + days + ' days ago');
        }
        return fulfill(true);
      });
  });
}

function showTotal(promises, age, merged, nomerged) {
  Promise.all(promises).then(function(res) {
    var total = res.filter(function(item) {
      return item;
    }).length;

    var type = '';

    if (typeof age !== 'undefined') {
      console.log(total + type + ' branches with a last commit older than ' + age + ' days');
    } else {
      console.log(total + type + ' branches');
    }
  });
}