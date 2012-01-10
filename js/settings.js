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
		localStorage[k] = '';
		delete localStorage[k];
	}
}

var cache = new Cache();


var Settings = {
	githubUser: '',
	githubToken: '',

	defaultUser: '',
	defaultRepository: ''
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

        	where.append($('<li><a class="sha" href="#" rel="'+sha10+'">'+branches.names[k]+'</a></li>'));
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
	},
	saveOptions: function(){
		//clean cache to reload all data on changed settings
		cache.removeAll();

		Settings.githubUser = $('#githubUser').val();
		Settings.githubToken = $('#githubToken').val();
		Settings.defaultUser = $('#defaultUser').val();
		Settings.defaultRepository = $('#defaultRepository').val();

		//save settings
		Utils.saveSettings();

		$('#save-message').show();
	},

	showNeedOptions: function(){
		$('body').html('<p>Please <a href="options.html">set up</a> your github account first!');
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
	formatCommit: function(commit){
	    var html = '';
	    html += '<a target="_blank" class="commit" title="Open commit in new tab" href="https://github.com'+commit.url+'"><span>'+commit.id.substr(0,10) + ' &rarr;</span></a> ';
	    html += '<span class="title">&quot;'+commit.message+'&quot;</span> ';
	    html += '<br/>';
	    html += '<span class="committed">' + commit.committed_date.substr(0, 19).replace('T', ' ') + '</span>';
	    html += '<span class="committer">' + commit.committer.name +'</span> ';

	    return html;
	}

}