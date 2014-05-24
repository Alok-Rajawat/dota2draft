$(function () {
    $("#tabs").tabs();
});

jQuery(function ($) {
    function getURLParameter(name) {
        return decodeURI((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]);
    };

    var bansURL = getURLParameter('ban');
    if (bansURL != 'null') {
        var bans = decodeBans(bansURL);

        for (var i = 1; i < 6; i++) {
            var element = $('#radiantBan' + i);
            element.attr('src', '/files/image/' + bans.rban[i] + '.png');
            element.attr('title', bans.rban[i]);
        }

        for (var i = 1; i < 6; i++) {
            var element = $('#direBan' + i);
            element.attr('src', '/files/image/' + bans.dban[i] + '.png');
            element.attr('title', bans.dban[i]);
        }
    }

    var picks = getURLParameter('pick');
    if (picks != 'null') {
        var decoded = decodePicks(picks);

        for (var i = 1; i < 6; i++) {
            var element = $('#radiant' + decoded.rpick[i + 'pos']);
            element.append('<img class="pick" id="radiant' + i + '" src="/files/image/' + decoded.rpick[i] + '.png" title="' + decoded.rpick[i] + '">');
            element = $('#radiantPick' + i);
            element.attr('src', '/files/image/' + decoded.rpick[i] + '.png');
            element.attr('title', decoded.rpick[i]);
        }

        for (var i = 1; i < 6; i++) {
            var element = $('#dire' + decoded.dpick[i + 'pos']);
            element.append('<img class="pick" id="dire' + i + '" src="/files/image/' + decoded.dpick[i] + '.png" title="' + decoded.dpick[i] + '">');
            element = $('#direPick' + i);
            element.attr('src', '/files/image/' + decoded.dpick[i] + '.png');
            element.attr('title', decoded.dpick[i]);
        }
    }

    var fp = getURLParameter('fp');
    if (fp != 'null') {
        if (fp == 'r')
            $('#radiantFP').show("fast");
        if (fp == 'd')
            $('#direFP').show("fast");
    }

    if ($('#pub').height() == 0) {
        $('#advert').css("background-image", "url(files/css/images/adblocked.jpg)");
    }
});
