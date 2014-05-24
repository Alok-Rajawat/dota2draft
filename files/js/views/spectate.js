jQuery(function ($) {
    // UI SETUP
    $("button").button();
    $("#laneLegend").hide();
    $("#chatMessage").attr("disabled", "disabled");

    var index = { 'Ban' : { 'Radiant' : 1, 'Dire' : 1}, 'Pick' : { 'Radiant' : 1, 'Dire' : 1}};

    // PARAMETERS
    var parameters = function () {
        var query_string = {};
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = pair[1];
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]], pair[1] ];
                query_string[pair[0]] = arr;
            } else {
                query_string[pair[0]].push(pair[1]);
            }
        }
        return query_string;
    } ();

    var id = null;

    if (typeof(parameters.id) != 'undefined')
        id = decodeURI(parameters.id);

    // ID Valid
    var intRegex = /^\d+$/;
    if(!intRegex.test(id)) {
        writeToChat('>>> Impossible to spectate game, empty or invalid id "' + id + '".');
        return;
    }

    // Socket spectate
    writeToChat('>>> Connecting to game ' + id);

    var socket = io.connect('http://' + document.domain + ':9000', { reconnect : false });

    var players = { player1 : { name : "Anonymous", side : null }, player2 : { name : "Anonymous", side : null}};
    var counts = { Radiant : { Pick : 0, Ban : 0 }, Dire : { Pick : 0, Ban : 0 }};
    var firstPick ="";
    var pickSide = "";

    function getNickname(player) {
        if (players[player].name != 'Anonymous')
            return players[player].name;

        if (player == "player1") {
            if (players["player2"].name != 'Anonymous') return 'Anonymous';
            return 'Anonymous (1)';
        } else {
            if (players["player1"].name != 'Anonymous') return 'Anonymous';
            return 'Anonymous (2)';
        }
    }

    socket.on('connection_success', function() {
        socket.emit('spectate', { roomId : id });
    });

    socket.on('spectate_invalidRoom', function() {
        writeToChat('>>> Invalid room to spectate.');
        socket.disconnect();
    });

    socket.on('spectate_valid', function(data) {
        if (data.player1nickname != null)
            players.player1.name = data.player1nickname;
        if (data.player2nickname != null)
            players.player2.name = data.player2nickname;

        setupHeroes(data.heroes);

        if (data.radiant.player == 'player1'){
            players.player1.side = 'Radiant';
            players.player2.side = 'Dire';
        }
        if (data.radiant.player == 'player2'){
            players.player2.side = 'Radiant';
            players.player1.side = 'Dire';
        }
        setupNames(players);

        setupTime(data.globalTime, data.radiant.time, data.dire.time);

        setupPicks(data.radiant.picklist, data.dire.picklist);
        setupBans(data.radiant.banlist, data.dire.banlist);
        counts.Radiant.Pick = data.radiant.pick;
        counts.Radiant.Ban = data.radiant.ban;
        counts.Dire.Pick = data.dire.pick;
        counts.Dire.Ban = data.dire.ban;

        if (data.action == 'Laning') {
            $("#laneLegend").show();

            if (players.player1.side == 'Radiant')
                setupLanes(data.player1lanes, data.player2lanes);
            else
                setupLanes(data.player2lanes, data.player1lanes);
        }
        if (data.pickingSide != null) {
            pickSide = data.pickingSide;
            timeManager = setInterval(actualisation, 1000);
            var area = $('#' + data.pickingSide.toLowerCase() + data.action + (counts[data.pickingSide][data.action]+1));
            area.css({ 'border-color' : '#FFFFFF'});
        }

        firstPick = data.firstPick;

        writeToChat('>>> You are now spectating ' + getNickname("player1") + ' against ' + getNickname("player2") + '.');
    });

    socket.on('player_left', function(data) {
        if (timeManager != null) clearInterval(timeManager);
        writeToChat('>>> ' + getNickname(data.player) + ' left, spectating is over.');
    });

    socket.on('redraft', function(data) {
        writeToChat('>>> ' + getNickname(data.player) + ' wants to redraft.');
    });

    socket.on('redraft_start', function() {
        $("#laneLegend").hide();

        $(".pictureAreaBanPick").attr('src', 'files/image/empty.png');
        $(".pictureArea").attr('class', 'pictureArea');

        setupTime(0, { min : 0, sec : 0}, { min : 0, sec : 0});
        players.player1.side = null;
        players.player2.side = null;
        counts = { Radiant : { Pick : 0, Ban : 0 }, Dire : { Pick : 0, Ban : 0 }};

        $('.pictureAreaBanPick').css('border-color', '#000000');

        $('#radiantPlayer').html('( ... )');
        $('#direPlayer').html('( ... )');

        writeToChat('>>> Redraft started by players.');

    });

    socket.on('side_choose', function(data) {
        // Setup version
        writeToChat('>>> Draft version is ' + data.version.name + ' version.');
        setupHeroes(data.version.heroes);

        writeToChat('>>> ' + getNickname(data.player) + ' chooses side.');
    });

    socket.on('player_ready', function(data) {
        writeToChat('>>> ' + getNickname(data.player) + ' is now ready.');
    });

    socket.on('version_choose', function(data) {
        writeToChat('>>> ' + data.player + ' is choosing version.');
    });

    socket.on('side_choose_value', function(data) {
        if (data.side == 'Other')
            writeToChat('>>> ' + getNickname(data.player) + ' chooses to let ' + getNickname(data.nonPlayer) + ' choose side.');
        else {
            players[data.player].side = data.side;
            if (data.side == 'Radiant')
                players[data.nonPlayer].side = 'Dire';
            if (data.side == 'Dire')
                players[data.nonPlayer].side = 'Radiant';

            setupNames(players);

            writeToChat('>>> ' + getNickname(data.player) + ' chooses ' + data.side + ' side.');
        }
    });

    socket.on('begin_choose', function(data) {
        writeToChat('>>> ' + getNickname(data.player) + ' chooses who has first pick.');
    });

    socket.on('begin_choose_value', function(data) {
        var side = data.side;
        if (side == 'Random')
            side = side + ' (' + data.randomResult + ')';

        writeToChat('>>> ' + getNickname(data.player) + ' chooses ' + side + ' to have first pick.');
        writeToChat('>>> START.');

        pickSide = side;
        firstPick = side;
        setupTime({ min : 0, sec : 0}, { min : 0, sec : 0}, { min : 0, sec : 0});
        timeManager = setInterval(actualisation, 1000);

        var area = $('#' + side.toLowerCase() + "Ban1");
        area.css({ 'border-color' : '#FFFFFF'});
    });

    socket.on('setup_mode', function(data){
        setupHeroes(data.heroes);
        setupTime(data.globalTime, data.radiantTime, data.direTime);
    });

    socket.on('lanes_status', function(data) {
        if (players[data.player].side == 'Radiant')
            setupLanes(data.lanes, null);
        else
            setupLanes(null, data.lanes);

        writeToChat('>>> ' + getNickname(data.player) + ' laning over.');
    });


    socket.on('lanes_result', function(data) {
        writeLinkToChat();
    });

    socket.on('message', function(data) {
        writeToChat(getNickname(data.player) + ' : ' + data.message);
    });

    socket.on('choose_hero', function(data) {
        var pickSide = players[data.player].side;
        counts[pickSide][data.action]++;

        var heroSelector = $('#' + data.choice);
        heroSelector.addClass('locked');

        var area = $('#' + pickSide.toLowerCase() + data.action + counts[pickSide][data.action]);
        area.attr('src', heroSelector.attr('src'));
        area.css({ 'border-color' : '#000000'});
    });

    socket.on('new_state', function(data) {
        setupTime(data.globalTime, data.radiantTime, data.direTime);
        pickSide = data.side;
        if (data.action == 'Laning') {
            clearInterval(timeManager);
            $("#laneLegend").show();

            writeToChat('>>> Laning phase starts.');
        } else {
            var area = $('#' + data.side.toLowerCase() + data.action + (counts[data.side][data.action]+1));
            area.css({ 'border-color' : '#FFFFFF'});
        }
    });

    // Functions

    function setupHeroes(heroes) {
        $('.pictureArea').addClass('locked');
        for (var i = 0; i < heroes.length; i++) {
            $('#' + heroes[i]).removeClass('locked');
        }
    }

    function setupNames(players) {
        var radiantName = "...";
        var direName = "...";

        if (players.player1.side == 'Radiant') {
            radiantName = getNickname("player1");
            direName = getNickname("player2");
        }
        if (players.player1.side == 'Dire') {
            radiantName = getNickname("player2");
            direName = getNickname("player1");
        }

        $('#radiantPlayer').html('( ' + radiantName + ' )');
        $('#direPlayer').html('( ' + direName + ' )');
    }

    function setupTime(globalTime, radiantTime, direTime) {

        $('#timeSec').html(globalTime);

        $('#radiantTimeMin').html(radiantTime.min);
        if (radiantTime.sec < 10)
            $('#radiantTimeSec').html('0' + radiantTime.sec);
        else
            $('#radiantTimeSec').html(radiantTime.sec);

        $('#direTimeMin').html(direTime.min);
        if (direTime.sec < 10)
            $('#direTimeSec').html('0' + direTime.sec);
        else
            $('#direTimeSec').html(direTime.sec);
    }

    function setupPicks(radiantPicks, direPicks) {
        for (var i = 0; i < radiantPicks.length; i++) {
            if($('#radiantPick'+(i+1)).attr('src') != $('#' + radiantPicks[i]).attr('src'))
                $('#radiantPick'+(i+1)).attr('src', $('#' + radiantPicks[i]).attr('src'));
        }
        for (var i = 0; i < direPicks.length; i++) {
            if ($('#direPick'+(i+1)).attr('src') != $('#' + direPicks[i]).attr('src'))
                $('#direPick'+(i+1)).attr('src', $('#' + direPicks[i]).attr('src'));
        }
    }

    function setupBans(radiantBans, direBans) {
        for (var i = 0; i < radiantBans.length; i++) {
            if ($('#radiantBan'+(i+1)).attr('src') != $('#' + radiantBans[i]).attr('src'))
                $('#radiantBan'+(i+1)).attr('src', $('#' + radiantBans[i]).attr('src'));
        }
        for (var i = 0; i < direBans.length; i++) {
            if ($('#direBan'+(i+1)).attr('src') != $('#' + direBans[i]).attr('src'))
                $('#direBan'+(i+1)).attr('src', $('#' + direBans[i]).attr('src'));
        }
    }

    function setupLanes(radiant, dire) {
        if (radiant != null) {
            $('.radiantPick').css({ 'border-color' : '#000000'});
            for (var i = 1; i < 6; i++) {
                var elem = $('#radiantPick'+i);
                if (radiant[i] == 'Mid')
                    elem.css({ 'border-color' : '#DD0000'});
                else if (radiant[i] == 'Top')
                    elem.css({ 'border-color' : '#00DD00'});
                else if (radiant[i] == 'Bot')
                    elem.css({ 'border-color' : '#0000DD'});
                else if (radiant[i] == 'Woods')
                    elem.css({ 'border-color' : '#DDDD00'});
                else if (radiant[i] == 'Roam')
                    elem.css({ 'border-color' : '#DDDDDD'});
            }
        }

        if (dire != null) {
            $('.direPick').css({ 'border-color' : '#000000'});
            for (var i = 1; i < 6; i++) {
                var elem = $('#direPick'+i);
                if (dire[i] == 'Mid')
                    elem.css({ 'border-color' : '#DD0000'});
                else if (dire[i] == 'Top')
                    elem.css({ 'border-color' : '#00DD00'});
                else if (dire[i] == 'Bot')
                    elem.css({ 'border-color' : '#0000DD'});
                else if (dire[i] == 'Woods')
                    elem.css({ 'border-color' : '#DDDD00'});
                else if (dire[i] == 'Roam')
                    elem.css({ 'border-color' : '#DDDDDD'});
            }
        }
    }

    socket.on('spectator_count', function (data) {
        $('#spectatorCount').html(data.spectatorsCount);
    });

    // Timings

    var timeManager = null;

    function actualisation() {
        if (pickSide != "") {
            var timeSec = $('#timeSec').html();

            if (timeSec != 0) {
                timeSec--;
                if (timeSec < 10)
                    $('#timeSec').html('0' + timeSec);
                else
                    $('#timeSec').html(timeSec);
            } else {
                    var timeSecE = null;
                    var timeMinE = null;

                    if (pickSide == 'Radiant') {
                        timeSecE = $('#radiantTimeSec');
                        timeMinE = $('#radiantTimeMin');
                    } else {
                        timeSecE = $('#direTimeSec');
                        timeMinE = $('#direTimeMin');
                    }

                    timeSec = timeSecE.html();
                    if (timeSec !=0) {
                        timeSec--;
                        if (timeSec < 10)
                            timeSecE.html('0' + timeSec);
                        else
                            timeSecE.html(timeSec);
                    } else {
                        timeMin = timeMinE.html();
                        if (timeMin != 0) {
                            timeMin--;
                            timeMinE.html(timeMin);
                            timeSecE.html('59');
                        }
                    }
            }
        }
    };

    socket.on('no_activity_timeout', function() {
        writeToChat(">>> No activity timeout from players, room is closed.");
    })

    // CHAT

    function writeToChat(string) {
        if ($('#chatScreenContent').html() != '')
            $('#chatScreenContent').append('<br />');
        $('#chatScreenContent').append(string);

        var objDiv = document.getElementById('chatScreen');
        objDiv.scrollTop = objDiv.scrollHeight;
    };

    function writeLinkToChat() {
        var draftToEncode = {};

        draftToEncode.rpick = {
            '1' : 'kunkka', '1pos' : 'Mid',
            '2' : 'kunkka', '2pos' : 'Top',
            '3' : 'kunkka', '3pos' : 'Bot',
            '4' : 'kunkka', '4pos' : 'Woods',
            '5' : 'kunkka', '5pos' : 'Roam'};

        draftToEncode.dpick = {
            '1' : 'kunkka', '1pos' : 'Mid',
            '2' : 'kunkka', '2pos' : 'Top',
            '3' : 'kunkka', '3pos' : 'Bot',
            '4' : 'kunkka', '4pos' : 'Woods',
            '5' : 'kunkka', '5pos' : 'Roam'};

        draftToEncode.rban = {
            '1' : 'kunkka',
            '2' : 'kunkka',
            '3' : 'kunkka',
            '4' : 'kunkka',
            '5' : 'kunkka'};

        draftToEncode.dban = {
            '1' : 'kunkka',
            '2' : 'kunkka',
            '3' : 'kunkka',
            '4' : 'kunkka',
            '5' : 'kunkka'};

        for (var i = 1; i < 6; i++) {
            var aux = $('#radiantPick'+i).attr('src');
            draftToEncode.rpick[i] = aux.substr(13, aux.length-17);
            aux = $('#radiantBan'+i).attr('src');
            draftToEncode.rban[i] = aux.substr(13, aux.length-17);

            var borderColor = $('#radiantPick'+i).css('border-top-color');
            if (borderColor == "rgb(221, 0, 0)" || borderColor == "#DD0000" || borderColor == "rgb(221,0,0)")
                draftToEncode.rpick[i+'pos'] = 'Mid';
            else if (borderColor == "rgb(0, 221, 0)" || borderColor == "#00DD00" || borderColor == "rgb(0,221,0)")
                draftToEncode.rpick[i+'pos'] = 'Top';
            else if (borderColor == "rgb(0, 0, 221)" || borderColor == "#0000DD" || borderColor == "rgb(0,0,221)")
                draftToEncode.rpick[i+'pos'] = 'Bot';
            else if (borderColor == "rgb(221, 221, 0)" || borderColor == "#DDDD00" || borderColor == "rgb(221,221,0)")
                draftToEncode.rpick[i+'pos'] = 'Woods';
            else if (borderColor == "rgb(221, 221, 221)" || borderColor == "#DDDDDD" || borderColor == "rgb(221,221,221)")
                draftToEncode.rpick[i+'pos'] = 'Roam';
        }

        for (var i = 1; i < 6; i++) {
            var aux = $('#direPick'+i).attr('src');
            draftToEncode.dpick[i] = aux.substr(13, aux.length-17);
            aux = $('#direBan'+i).attr('src');
            draftToEncode.dban[i] = aux.substr(13, aux.length-17);

            var borderColor = $('#direPick'+i).css('border-top-color');
            if (borderColor == "rgb(221, 0, 0)" || borderColor == "#DD0000" || borderColor == "rgb(221,0,0)")
                draftToEncode.dpick[i+'pos'] = 'Mid';
            else if (borderColor == "rgb(0, 221, 0)" || borderColor == "#00DD00" || borderColor == "rgb(0,221,0)")
                draftToEncode.dpick[i+'pos'] = 'Top';
            else if (borderColor == "rgb(0, 0, 221)" || borderColor == "#0000DD" || borderColor == "rgb(0,0,221)")
                draftToEncode.dpick[i+'pos'] = 'Bot';
            else if (borderColor == "rgb(221, 221, 0)" || borderColor == "#DDDD00" || borderColor == "rgb(221,221,0)")
                draftToEncode.dpick[i+'pos'] = 'Woods';
            else if (borderColor == "rgb(221, 221, 221)" || borderColor == "#DDDDDD" || borderColor == "rgb(221,221,221)")
                draftToEncode.dpick[i+'pos'] = 'Roam';
        }

        var url = window.location + '';

        var info = 'fp=';
        if (firstPick == 'Radiant')
            info += 'r';
        else
            info += 'd';
        writeToChat('>>> Link to share draft result <a href="' + url.substr(0, url.lastIndexOf('/')+1)+ 'show?' + info + '&' + encode(draftToEncode)+'">here</a>.');
    };

    if ($('#pub').height() == 0) {
        $('#advert').css("background-image", "url(files/css/images/adblocked.jpg)");
    }
});