function Cache() {}
Cache.prototype.test = function(id) {
	return (typeof localStorage[id] != 'undefined');
}
Cache.prototype.load = function(id) {
	return (typeof localStorage[id] != 'undefined') ? JSON.parse(localStorage[id]) : null;
}
Cache.prototype.save = function(id, value) {
	localStorage[id] = JSON.stringify(value);
}
Cache.prototype.removeAll = function() {
	for (var k in localStorage) {
		localStorage[k] = null;
		delete localStorage[k];
	}
}

var cache = new Cache();


var Settings = {
	githubUser: '',
	githubToken: '',

	defaultUser: '',
	defaultRepository: '',

	defaultTab: 'branches', // pulls|branches

	pollInterval: 60 //in seconds
}


var UI = {
	startLoading: function() {
		$('#loader').show();
	},
	stopLoading: function() {
		$('#loader').hide();
	},

	/**
	 * @param object branches {names:[], commits[]}
	 * @param jquery element to append branches to}
	 */
	drawBranches: function(branches, where) {
		//cleanup
        where.text('');

	    for (var k in branches.names) {
	        var sha = branches.commits[branches.names[k]],
    	        sha10 = sha.substr(0, 10);

        	where.append($('<li class="branch"><span class="hash">'+sha10+'</span><a class="sha" href="#" rel="'+sha10+'">'+branches.names[k]+'</a></li>'));
    	}
	},

	drawUsername: function(data) {
		$('#username').text(data.name + ' ' + data.email).before('Logged in as: ');
	},


	/* Options page */
	restoreOptions: function(){
		$('#githubUser').val(Settings.githubUser);
		$('#githubToken').val(Settings.githubToken);
		$('#defaultUser').val(Settings.defaultUser);
		$('#defaultRepository').val(Settings.defaultRepository);
		$('#defaultTab').val(Settings.defaultTab);
	},
	saveOptions: function(){
		//clean cache to reload all data on changed settings
		cache.removeAll();

		Settings.githubUser = $('#githubUser').val();
		Settings.githubToken = $('#githubToken').val();
		Settings.defaultUser = $('#defaultUser').val();
		Settings.defaultRepository = $('#defaultRepository').val();
		Settings.defaultTab = $('#defaultTab').val();

		//save settings
		Utils.saveSettings();

		$('#save-message').show();
	},

	showNeedOptions: function(){
		$('body').html('<p>Please <a href="options.html">set up</a> your github account first!');
	},

	tabContainerActive: function(container, name) {
		if (name == 'pulls') {
			UI.startLoading();
			container.html('');

			gh.pulls(Settings.defaultUser, Settings.defaultRepository).allPulls(function (data) {
	            data.pulls.forEach(function (pull) {
	                container.append(Utils.formatPull(pull));
	            });
	            UI.stopLoading();
	        });
		} else if (name == 'branches') {
			var branches = {},
			    cacheKeyBranches = Settings.githubUser + ':' + Settings.defaultRepository + ':branches';

			if (cache.test(cacheKeyBranches)) {
			    branches = cache.load(cacheKeyBranches);
			    UI.drawBranches(branches, $('#branches'));

			} else {
			    var repository = gh.repo(Settings.githubUser, Settings.defaultRepository);
			    UI.startLoading();
			    repository.branches(function(data){
			        UI.stopLoading();

			        var branchNames = [];

			        for (var k  in data.branches) {
			            if (k == 'master') continue;
			            branchNames.push(k);
			        }

			        branchNames.sort();

			        var obj = {names: branchNames, commits: data.branches};
			        cache.save(cacheKeyBranches, obj);

			        UI.drawBranches(obj, $('#branches'));
			    });
			}
		}
	},

	/**
	 * show notifications popup
	 */
	notify: function(title, text, url) {		
		var notification = webkitNotifications.createHTMLNotification(
			'pull-notification.html' +
				'?t='+encodeURIComponent(title) +
				'&d='+encodeURIComponent(text) + 
				'&u='+encodeURIComponent(url)
		);
		  // 'icon.png',  // icon url - can be relative
		  // title,  // notification title
		  // text  // notification body text
		//);
		notification.show();
	}
};

var Utils = {
	/* restore Settings obj from cache */
	restoreSettings: function() {
		if (!cache.test('settings')) {
			return false;
		}

		var cached = cache.load('settings');
		for (var k in cached) {
			Settings[k] = cached[k];
		}
	},
	/* save Settings obj to cache */
	saveSettings: function() {
		cache.save('settings', Settings);
	},

	/**
	 * @return html string
	 */
	formatCommit: function(commit) {
	    var html = '';
	    html += '<a target="_blank" class="commit" title="Open commit in new tab" href="https://github.com'+commit.url+'"><span>'+commit.id.substr(0,10) + ' &rarr;</span></a> ';
	    html += '<span class="title">&quot;'+commit.message+'&quot;</span> ';
	    html += '<br/>';
	    html += '<span class="committed">' + commit.committed_date.substr(0, 19).replace('T', ' ') + '</span>';
	    html += '<span class="committer">' + commit.committer.name +'</span> ';

	    return html;
	},

	/**
	 * @return html string
	 */
	formatPull: function(pull) {
		var html = '<div class="pull-request">';
        html += '<div class="head">'+pull.head.label+'</div>';
		html += '<div class="title">#: '+pull.number+' <a target="_blank" href="'+pull.html_url+'">'+pull.title+'</a></div>';
		html += '<div class="body">'+pull.body+'</div>';
        html += '<span class="state">'+pull.state+'</span>'  ;
		html += '<span class="comments">comments: '+pull.comments+'</span> ';
		html += '<span class="diffurl"><a target="_blank" href="'+pull.diff_url+'">DIFF</a></span>';
		html += '<span class="created-at">created: '+pull.created_at+'</span> ';
		html += '<span class="updated-at">updated: '+pull.updated_at+'</span>';
        html += '</div>';
		return html;
	}

}


//restore settings
Utils.restoreSettings();
