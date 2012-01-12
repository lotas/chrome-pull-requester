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



$('#branches').on('click', 'li', function(){
    var elm = $(this),
        a = elm.find('a'),
        // asuming username/Yangutu as forks
        commit = gh.commit(Settings.githubUser, Settings.defaultRepository, a.attr('rel'));

    $('#branches li.active').removeClass('active');
    elm.addClass('active');

    UI.startLoading();

    mergeBranch.title = a.text();
    mergeBranch.sha = a.attr('rel');
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


$('#tabs a').click(function(){
    if ($(this).hasClass('act')) {
        return;
    }

    //swap act class
    $('#tabs a.act').removeClass('act');
    $(this).addClass('act');

    //swap tabs
    $('.tab-container').hide()
    var activeTabContainer = $('#tab-'+$(this).attr('rel')).show();

    UI.tabContainerActive(activeTabContainer, $(this).attr('rel'));
});

setTimeout(function(){
    //activate default tab on load
    $('#tabs a[rel='+Settings.defaultTab+']').trigger('click');
}, 100)