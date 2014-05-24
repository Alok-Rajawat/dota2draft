jQuery(function ($) {

    // helper
    function getNickname() {
        var nick = '';
        if ($("#nickname").val() != '')
            nick = 'nick=' + $("#nickname").val();
        return nick;
    }

    // button events
    $("button").button();

    $("#randomRoomButton").click(function (event) {
        var url = '/draft?type=rand&mode=' + $("#mode :radio:checked").attr('id');
        var nickname = getNickname();
        if (nickname != '')
            url = url + '&' + nickname;
        window.location = encodeURI(url);
    });

    $("#listRoomsButton").click(function (event) {
        var url = '/rooms';
        window.location = encodeURI(url);
    });

    $("#createPrivateButton").click(function (event) {
        var url = '/draft?type=pv&mode=' + $("#mode :radio:checked").attr('id');
        var nickname = getNickname();
        if (nickname != '')
            url = url + '&' + nickname;
        window.location = encodeURI(url);
    });

    $("#joinPrivateButton").click(function (event) {
        if ($('#privateId').val() != '') {
            var url = '/draft?type=pv&id=' + $('#privateId').val();
            var nickname = getNickname();
            if (nickname != '')
                url = url + '&' + nickname;
            window.location = encodeURI(url);
        }
    });

    $("#mode").buttonset();

    $("#spectatePrivateButton").click(function (event) {
        if ($('#privateId').val() != '') {
            var url = '/spectate?id=' + $('#privateId').val();
            window.location = encodeURI(url);
        }
    });

    // ad
    if ($('#pub').height() == 0) {
        $('#advert').css("background-image", "url(files/css/images/adblocked.jpg)");
    }

    // fb
    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/fr_FR/all.js#xfbml=1";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    //g+
    window.___gcfg = {lang: 'en-GB'};
    (function () {
        var po = document.createElement('script');
        po.type = 'text/javascript';
        po.async = true;
        po.src = 'https://apis.google.com/js/plusone.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(po, s);
    })();
});
