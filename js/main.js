//restore settings
Utils.restoreSettings();

if (Settings.githubUser == '' && Settings.githubToken == '') {
    UI.showNeedOptions();
    return false;
}

gh.authenticate(Settings.githubUser, Settings.githubToken);

if (cache.test('username')) {
    UI.drawUsername(cache.load('username'));
} else {
    var user = gh.user(Settings.githubUser);
    UI.startLoading();
    user.show(function (data) {
        UI.stopLoading();
        cache.save('username', data.user);
        UI.drawUsername(cache.load('username'));
    });
}

var mergeBranch = {title:'', sha:''};

var branches = {},
    cacheKeyBranches = Settings.defaultUser + ':' + Settings.defaultRepository + ':branches';

if (cache.test(cacheKeyBranches)) {
    branches = cache.load(cacheKeyBranches);
    UI.drawBranches(branches, $('#branches'));

} else {
    var repository = gh.repo(Settings.defaultUser, Settings.defaultRepository);
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

$('#branches').on('click', 'a.sha', function(){
    var elm = $(this),
        commit = gh.commit(Settings.defaultUser, Settings.defaultRepository, elm.attr('rel'));

    $('#branches li.active').removeClass('active');
    elm.parents('li').addClass('active');

    UI.startLoading();

    mergeBranch.title = elm.text();
    mergeBranch.sha = elm.attr('rel');
    $('#pullRequest').attr('value', "Request "+mergeBranch.title+" → master");
    $('#pull-title').val('Please merge branch "'+mergeBranch.title+'" into master');
    $('#pull-description').focus();

    commit.show(function(data){
        $('#commit-info').html(Utils.formatCommit(data.commit));
        $('.commit-legend').show();
        UI.stopLoading();
    });

    return false;
});


$('#pullRequest').click(function(){
    var pulls = gh.pulls(Settings.defaultUser, Settings.defaultRepository);
    pulls.createRequest('master', mergeBranch.title, $('#pull-title').val(), $('#pull-description').val(), function(data){

        $('#main-container').hide();
        $('#pull-request-container').show();
        
        var str = '';
        for(var k in data) {
            str += k + ': ' + data[k]+"\n";
        }
        $('#pull-request-container').html('<pre>'+str+'</pre>');
    });
});

