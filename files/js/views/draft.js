jQuery(function ($) {

    // UI SETUP
    $("button").button();

    $("#randomButton").hide();
    $("#radiantButton").hide();
    $("#opponentChooseButton").hide();
    $("#direButton").hide();
    $("#banButton").hide();
    $("#pickButton").hide();
    $("#readyButton").hide();
    $("#redraftButton").hide();
    $("#laneButton").hide();
    $("#laneLegend").hide();
    $("#tournamentVersionButton").hide();
    $("#latestVersionButton").hide();

    var index = { 'Ban': { 'Radiant': 1, 'Dire': 1}, 'Pick': { 'Radiant': 1, 'Dire': 1}};

    // PARAMETERS
    var parameters = function () {
        var query_string = {};
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
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
    }();

    var youNickname = null;
    var opponentNickname = null;
    var mode = 'cm';
    var type = 'rand';
    var roomId = 0;
    var id = null;

    if (typeof(parameters.nick) != 'undefined')
        youNickname = decodeURI(parameters.nick);
    if (typeof(parameters.mode) != 'undefined') {
        var aux = decodeURI(parameters.mode);
        if (aux == 'cm' || aux == 'cd')
            mode = aux;
    }
    if (mode === 'cd') {
        $('#radiantBan4').hide();
        $('#radiantBan5').hide();
        $('#direBan4').hide();
        $('#direBan5').hide();
    }
    if (typeof(parameters.type) != 'undefined') {
        var aux = decodeURI(parameters.type);
        if (aux == 'rand' || aux == 'pv')
            type = aux;
    }
    if (typeof(parameters.id) != 'undefined')
        id = decodeURI(parameters.id);

    function getYouNickname() {
        if (youNickname == null)
            return "You";
        else
            return youNickname;
    }

    function getOpponentNickname() {
        if (opponentNickname == null)
            return "Opponent";
        else
            return opponentNickname;
    }

    // NETWORK SETUP
    var socket = io.connect(document.location.protocol + '//' + document.domain, { reconnect : false });
    var connected = 0;
    var status = 'Connecting';

    // GAME LOGIC
    var youSide = '';
    var fp = '';
    var pickingSide = '';

    var selectedHero = null;
    var toChoose = null;


    var timeManager = null;
    $(".pictureArea").click(function (event) {
        if (selectedHero != null) {
            selectedHero.css({ 'border-color': '#000000' });
        }

        $(this).css({ 'border-color': '#FFFFFF' });
        selectedHero = $(this);

    });

    writeToChat('>>> Connecting to room...');

    // CONNECTION

    socket.on('connection_success', function () {
        writeToChat('>>> You are connected.');
        socket.emit('join', { nick: youNickname, mode: mode, roomType: type, roomId: id});
    });

    socket.on('disconnect', function () {
        writeToChat('>>> Disconnected from the distant server.');
    });

    socket.on('error', function () {
        //writeToChat('>>> Error encountered with the websocket.');
    });

    socket.on('connect_failed', function () {
        writeToChat('>>> Connection failed to the remote server. Retry later or contact admin.');
    });

    socket.on('join_success', function (data) {
        if (typeof(data) == 'undefined')
            writeToChat('>>> Waiting for opponent...');
        else
            writeToChat('>>> Send room id ' + data.roomId + ' to opponent.');
        connected = 1;
        status = 'WaitingForOpponent';
    });

    socket.on('join_fail', function (data) {
        if (data.error == 'restart')
            writeToChat('>>> Impossible to join, server will restart soon, please refresh later.');
        else if (data.error == 'noroom')
            writeToChat('>>> Impossible to join ' + id + ', no such room.');
        connected = 0;
        status = 'End';
    });

    socket.on('player_join', function (data) {
        opponentNickname = data.nick;
        writeToChat('>>> ' + getOpponentNickname() + ' connected. Waiting players to be ready.');
        status = 'WaitingForReady';
        roomId = data.id;
        console.log(data)
        mode = data.mode
        if (mode === 'cd') {
            $('#radiantBan4').hide();
            $('#radiantBan5').hide();
            $('#direBan4').hide();
            $('#direBan5').hide();
        }
        $("#spectatorLink").click(function (){
            window.open(document.location.protocol + '//' + document.domain + '/spectate?id=' + roomId, '_blank');
        });
        $("#readyButton").show();
        highlightTab();
    });

    socket.on('player_left', function () {
        writeToChat('>>> ' + getOpponentNickname() + ' left, game ended.');
        status = 'End';

        $("#randomButton").hide();
        $("#radiantButton").hide();
        $("#opponentChooseButton").hide();
        $("#direButton").hide();
        $("#banButton").hide();
        $("#pickButton").hide();
        $("#readyButton").hide();
        $("#redraftButton").hide();
        $("#laneButton").hide();

        if (youSide == 'Radiant')
            unSetupLaning($('.radiantPick'));
        else
            unSetupLaning($('.direPick'));

        connected = 0;
        if (timeManager != null)
            clearInterval(timeManager);
    });

    socket.on('message', function (data) {
        writeToChat(getOpponentNickname() + ' : ' + data.message);
    });

    // GAME

    $('#readyButton').click(function () {
        socket.emit('player_ready');
    });

    $('#tournamentVersionButton').click(function () {
        socket.emit('version_choose', { version: 'Tournament' });
        $('#tournamentVersionButton').hide();
        $('#latestVersionButton').hide();
    });

    $('#latestVersionButton').click(function () {
        socket.emit('version_choose', { version: 'Latest' });
        $('#tournamentVersionButton').hide();
        $('#latestVersionButton').hide();
    });

    socket.on('player_ready', function (data) {
        if (data.player == 'you') {
            writeToChat('>>> You are now ready.');
            $("#readyButton").hide();
        } else if (data.player == 'opponent') {
            writeToChat('>>> ' + getOpponentNickname() + ' is now ready.');
        }
    });

    socket.on('version_choose', function (data) {
        status = 'ChooseVersion';

        if (data.player == 'you') {
            writeToChat('>>> You choose game version.');
            $("#tournamentVersionButton").show();
            $("#latestVersionButton").show();
        } else {
            writeToChat('>>> ' + getOpponentNickname() + ' chooses game version.');
        }
    });

    socket.on('side_choose', function (data) {
        // Setup version
        setupVersion(data.version.heroes);

        // Side choose
        status = 'ChooseSide';

        if (data.player == 'you') {
            writeToChat('>>> You choose side.');
            $("#radiantButton").show();
            $("#opponentChooseButton").show();
            $("#direButton").show();
        } else {
            writeToChat('>>> ' + getOpponentNickname() + ' chooses side.');
        }
        highlightTab();
    });

    socket.on('setup_mode', function (data) {
        console.log(data)
        setupVersion(data.heroes);
        setupTime(data.globalTime, data.radiantTime, data.direTime);
    });

    function setupVersion(heroes) {
        $('.pictureArea').addClass('locked');
        for (var i = 0; i < heroes.length; i++) {
            $('#' + heroes[i]).removeClass('locked');
        }
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

    function sideChoose(data) {
        socket.emit('side_choose', { side: data });
    };

    function beginChoose(data) {
        socket.emit('begin_choose', { side: data });
    };

    $('#radiantButton').click(function () {
        if (status == 'ChooseSide')
            sideChoose('Radiant');
        else if (status == 'ChooseBegin')
            beginChoose('Radiant');
    });
    $('#opponentChooseButton').click(function () {
        if (status == 'ChooseSide')
            sideChoose('Other');
        else if (status == 'ChooseBegin')
            beginChoose('Other');
    });
    $('#direButton').click(function () {
        if (status == 'ChooseSide')
            sideChoose('Dire');
        else if (status == 'ChooseBegin')
            beginChoose('Dire');
    });
    $('#randomButton').click(function () {
        if (status == 'ChooseBegin')
            beginChoose('Random');
    });

    socket.on('side_choose_value', function (data) {
        $("#radiantButton").hide();
        $("#opponentChooseButton").hide();
        $("#direButton").hide();

        if (data.side != 'Other') {
            if (data.player == 'you') {
                writeToChat('>>> You choose ' + data.side + ' side.');
                if (data.side == 'Radiant') {
                    $('#radiantPlayer').html('( ' + getYouNickname() + ' )');
                    $('#direPlayer').html('( ' + getOpponentNickname() + ' )');
                    youSide = 'Radiant';
                } else {
                    $('#radiantPlayer').html('( ' + getOpponentNickname() + ' )');
                    $('#direPlayer').html('( ' + getYouNickname() + ' )');
                    youSide = 'Dire';
                }
            } else {
                writeToChat('>>> ' + getOpponentNickname() + ' chooses ' + data.side + ' side.');
                if (data.side == 'Radiant') {
                    $('#radiantPlayer').html('( ' + getOpponentNickname() + ' )');
                    $('#direPlayer').html('( ' + getYouNickname() + ' )');
                    youSide = 'Dire';
                } else {
                    $('#radiantPlayer').html('( ' + getYouNickname() + ' )');
                    $('#direPlayer').html('( ' + getOpponentNickname() + ' )');
                    youSide = 'Radiant';
                }
            }
        } else {
            if (data.player != 'you') {
                writeToChat('>>> ' + getOpponentNickname() + ' lets you choose side.');
                $("#radiantButton").show();
                $("#direButton").show();
            } else {
                writeToChat('>>> You let ' + getOpponentNickname() + ' choose side.');
            }
        }
    });

    socket.on('begin_choose', function (data) {
        status = 'ChooseBegin';
        if (data.player == 'you') {
            writeToChat('>>> You choose who pick first.');
            $("#radiantButton").show();
            $("#opponentChooseButton").show();
            $("#randomButton").show();
            $("#direButton").show();
        } else {
            writeToChat('>>> ' + getOpponentNickname() + ' chooses who pick first.');
        }
    });

    function setupPickBanLayout() {
        console.log('here: ' + mode);
        if (mode === 'cd') {
            if (pickingSide === 'Radiant') {
                $('.cdRFPbr').show();
                $('.cdRSPbr').hide();

                $('.cdDFPbr').hide();
                $('.cdDSPbr').show();
            } else {
                $('.cdRFPbr').hide();
                $('.cdRSPbr').show();

                $('.cdDSPbr').hide();
                $('.cdDFPbr').show();
            }
        }
    }

    socket.on('begin_choose_value', function (data) {
        $("#radiantButton").hide();
        $("#opponentChooseButton").hide();
        $("#randomButton").hide();
        $("#direButton").hide();

        if (data.side != 'Other') {
            status = 'Started';
            var randominfo = '';
            if (data.side == 'Random') {
                pickingSide = data.randomResult;
                randominfo = ' (' + pickingSide + ')';
            } else
                pickingSide = data.side;

            if (data.player == 'you') {
                writeToChat('>>> You choose ' + data.side + randominfo + ' to pick first.');
            } else {
                writeToChat('>>> ' + getOpponentNickname() + ' chooses ' + data.side + randominfo + ' to pick first.');
            }
            setupPickBanLayout();
            startDraft();
        } else {
            if (data.player != 'you') {
                writeToChat('>>> ' + getOpponentNickname() + ' lets you choose who pick first.');
                $("#radiantButton").show();
                $("#randomButton").show();
                $("#direButton").show();
            } else {
                writeToChat('>>> You let ' + getOpponentNickname() + ' choose who pick first.');
            }
        }
    });

    function resetMasterTime() {
        $('#timeSec').html('00');
        $('#time').css('color', '#FFFFFF');

        $('#radiantTimeSec').html('00');
        $('#radiantTimeMin').html('0');

        $('#direTimeSec').html('00');
        $('#direTimeMin').html('0');
    };

    function startDraft() {
        writeToChat('>>> START.');
        status = 'Ban';
        if (pickingSide == youSide) {
            $("#banButton").show();
            if (youSide == 'Radiant')
                fp = 'r';
            else
                fp = 'd';
        } else {
            if (youSide == 'Radiant')
                fp = 'd';
            else
                fp = 'r';
        }

        resetMasterTime();
        timeManager = setInterval(actualisation, 1000);
        if (pickingSide == 'Radiant')
            toChoose = $('#radiantBan1');
        else
            toChoose = $('#direBan1');
        toChoose.css({ 'border-color': '#FFFFFF' });
    };

    $('#banButton').click(function () {
        if (selectedHero == null)
            return;
        if (selectedHero.attr('class') == 'pictureArea locked')
            return;
        if (pickingSide != youSide)
            return;
        socket.emit('choose_hero', { choice: selectedHero.attr('id'), action: 'Ban'});
    });

    $('#pickButton').click(function () {
        if (selectedHero == null)
            return;
        if (selectedHero.attr('class') == 'pictureArea locked')
            return;
        if (pickingSide != youSide)
            return;
        socket.emit('choose_hero', { choice: selectedHero.attr('id'), action: 'Pick'});
    });

    function actualisation() {
        if (status == 'Ban' || status == 'Pick') {

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

                    if (pickingSide == 'Radiant') {
                        timeSecE = $('#radiantTimeSec');
                        timeMinE = $('#radiantTimeMin');
                    } else {
                        timeSecE = $('#direTimeSec');
                        timeMinE = $('#direTimeMin');
                    }

                    timeSec = timeSecE.html();
                    if (timeSec != 0) {
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

    socket.on('choose_hero', function (data) {
        $('#' + data.choice).addClass('locked');

        toChoose.css({ 'border-color': '#000000'});
        toChoose.attr('src', $('#' + data.choice).attr('src'));
        toChoose = null;
        index[data.action][data.side]++;

    });

    socket.on('new_state', function (data) {
        $('#banButton').hide();
        $('#pickButton').hide();

        pickingSide = data.side;
        status = data.action;

        if (data.side == 'Radiant')
            toChoose = 'radiant';
        else
            toChoose = 'dire';

        if (pickingSide == null) {
            writeToChat('>>> Picks over, click on heroes to change lanes.');
            clearInterval(timeManager);
            if (youSide == 'Radiant')
                setupLaning($('.radiantPick'));
            else
                setupLaning($('.direPick'));
            $("#laneLegend").show();
            $("#laneButton").show();
        } else {
            toChoose = toChoose + data.action + index[data.action][data.side];
            toChoose = $('#' + toChoose);
            toChoose.css({ 'border-color': '#FFFFFF'});

            if (pickingSide == youSide) {
                if (data.action == 'Ban') {
                    $('#banButton').show();
                } else if (data.action == 'Pick') {
                    $('#pickButton').show();
                }
            }

            if (data.radiantTime.sec < 10)
                $('#radiantTimeSec').html('0' + data.radiantTime.sec);
            else
                $('#radiantTimeSec').html(data.radiantTime.sec);
            $('#radiantTimeMin').html(data.radiantTime.min);

            if (data.direTime.sec < 10)
                $('#direTimeSec').html('0' + data.direTime.sec);
            else
                $('#direTimeSec').html(data.direTime.sec);
            $('#direTimeMin').html(data.direTime.min);

            if (data.globalTime < 10)
                $('#timeSec').html('0' + data.globalTime);
            else
                $('#timeSec').html(data.globalTime);
        }

    });

    function setupLaning(balises) {
        balises.css('border-color', '#DD0000');
        balises.click(function () {
            var borderColor = $(this).css('border-top-color');
            if (borderColor == "rgb(221, 0, 0)" || borderColor == "#DD0000" || borderColor == "rgb(221,0,0)")
                $(this).css('border-color', '#00DD00');
            else if (borderColor == "rgb(0, 221, 0)" || borderColor == "#00DD00" || borderColor == "rgb(0,221,0)")
                $(this).css('border-color', '#0000DD');
            else if (borderColor == "rgb(0, 0, 221)" || borderColor == "#0000DD" || borderColor == "rgb(0,0,221)")
                $(this).css('border-color', '#DDDD00');
            else if (borderColor == "rgb(221, 221, 0)" || borderColor == "#DDDD00" || borderColor == "rgb(221,221,0)")
                $(this).css('border-color', '#DDDDDD');
            else if (borderColor == "rgb(221, 221, 221)" || borderColor == "#DDDDDD" || borderColor == "rgb(221,221,221)")
                $(this).css('border-color', '#DD0000');
        });
    };

    function unSetupLaning(balises) {
        balises.unbind('click');
    };

    function getLaning() {
        var lanes = { '1': null, '2': null, '3': null, '4': null, '5': null };
        var base = '';
        if (youSide == 'Radiant')
            base = 'radiantPick';
        else
            base = 'direPick';

        for (var lane in lanes) {
            var balise = $('#' + base + lane);
            var borderColor = balise.css('border-top-color');
            if (borderColor == "rgb(221, 0, 0)" || borderColor == "#DD0000" || borderColor == "rgb(221,0,0)")
                lanes[lane] = 'Mid';
            else if (borderColor == "rgb(0, 221, 0)" || borderColor == "#00DD00" || borderColor == "rgb(0,221,0)")
                lanes[lane] = 'Top';
            else if (borderColor == "rgb(0, 0, 221)" || borderColor == "#0000DD" || borderColor == "rgb(0,0,221)")
                lanes[lane] = 'Bot';
            else if (borderColor == "rgb(221, 221, 0)" || borderColor == "#DDDD00" || borderColor == "rgb(221,221,0)")
                lanes[lane] = 'Woods';
            else if (borderColor == "rgb(221, 221, 221)" || borderColor == "#DDDDDD" || borderColor == "rgb(221,221,221)")
                lanes[lane] = 'Roam';
        }
        return lanes;
    };

    $('#laneButton').click(function () {
        $('#laneButton').hide();
        if (youSide == 'Radiant')
            unSetupLaning($('.radiantPick'));
        else
            unSetupLaning($('.direPick'));
        var lanes = getLaning();
        socket.emit('lanes', lanes);
    });

    socket.on('lanes_status', function (data) {
        if (data.player == 'You')
            writeToChat('>>> You define lanes.');
        else
            writeToChat('>>> ' + getOpponentNickname() + ' defines lanes.');
    });

    socket.on('lanes_result', function (lanes) {
        var base = '';
        if (youSide == 'Dire')
            base = 'radiantPick';
        else
            base = 'direPick';

        for (var lane in lanes) {
            var balise = $('#' + base + lane);
            if (lanes[lane] == 'Mid')
                balise.css('border-color', '#DD0000');
            else if (lanes[lane] == 'Top')
                balise.css('border-color', '#00DD00');
            else if (lanes[lane] == 'Bot')
                balise.css('border-color', '#0000DD');
            else if (lanes[lane] == 'Woods')
                balise.css('border-color', '#DDDD00');
            else if (lanes[lane] == 'Roam')
                balise.css('border-color', '#DDDDDD');
        }

        $('#redraftButton').show();
        writeToChat('>>> Draft over.');
        writeLinkToChat();

    });

    $("#redraftButton").click(function () {
        socket.emit('redraft');
    });

    socket.on('redraft', function (data) {
        if (data.player == 'you') {
            writeToChat('>>> You want do redraft.');
            $("#redraftButton").hide();
        } else if (data.player == 'opponent') {
            writeToChat('>>> ' + getOpponentNickname() + ' wants to redraft.');
        }
    });

    socket.on('redraft_start', function () {
        $(".pictureAreaBanPick").attr('src', 'files/image/empty.png');
        $(".pictureArea").attr('class', 'pictureArea');

        resetMasterTime();
        youSide = '';
        pickingSide = '';

        toChoose = null;
        index = { 'Ban': { 'Radiant': 1, 'Dire': 1}, 'Pick': { 'Radiant': 1, 'Dire': 1}};
        timeManager = null;

        $('.pictureAreaBanPick').css('border-color', '#000000');
        if (youSide == 'Radiant')
            unSetupLaning($('.radiantPick'));
        else
            unSetupLaning($('.direPick'));

        $("#laneLegend").hide();
        $('#radiantPlayer').html('( ... )');
        $('#direPlayer').html('( ... )');

        status = 'WaitingForReady';
        $("#readyButton").show();
    });

    socket.on('spectator_count', function (data) {
        $('#spectatorCount').html(data.spectatorsCount);
    });

    socket.on('no_activity_timeout', function () {
        writeToChat(">>> No activity timeout from players, room is closed.");

        status = 'End';

        $("#randomButton").hide();
        $("#radiantButton").hide();
        $("#opponentChooseButton").hide();
        $("#direButton").hide();
        $("#banButton").hide();
        $("#pickButton").hide();
        $("#readyButton").hide();
        $("#redraftButton").hide();
        $("#laneButton").hide();

        if (youSide == 'Radiant')
            unSetupLaning($('.radiantPick'));
        else
            unSetupLaning($('.direPick'));

        connected = 0;
        if (timeManager != null)
            clearInterval(timeManager);
    });

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
            '1': 'kunkka', '1pos': 'Mid',
            '2': 'kunkka', '2pos': 'Top',
            '3': 'kunkka', '3pos': 'Bot',
            '4': 'kunkka', '4pos': 'Woods',
            '5': 'kunkka', '5pos': 'Roam'};

        draftToEncode.dpick = {
            '1': 'kunkka', '1pos': 'Mid',
            '2': 'kunkka', '2pos': 'Top',
            '3': 'kunkka', '3pos': 'Bot',
            '4': 'kunkka', '4pos': 'Woods',
            '5': 'kunkka', '5pos': 'Roam'};

        draftToEncode.rban = {
            '1': 'kunkka',
            '2': 'kunkka',
            '3': 'kunkka',
            '4': 'kunkka',
            '5': 'kunkka'};

        draftToEncode.dban = {
            '1': 'kunkka',
            '2': 'kunkka',
            '3': 'kunkka',
            '4': 'kunkka',
            '5': 'kunkka'};

        for (var i = 1; i < 6; i++) {
            var aux = $('#radiantPick' + i).attr('src');
            draftToEncode.rpick[i] = aux.substr(13, aux.length - 17);
            aux = $('#radiantBan' + i).attr('src');
            draftToEncode.rban[i] = aux.substr(13, aux.length - 17);

            var borderColor = $('#radiantPick' + i).css('border-top-color');
            if (borderColor == "rgb(221, 0, 0)" || borderColor == "#DD0000" || borderColor == "rgb(221,0,0)")
                draftToEncode.rpick[i + 'pos'] = 'Mid';
            else if (borderColor == "rgb(0, 221, 0)" || borderColor == "#00DD00" || borderColor == "rgb(0,221,0)")
                draftToEncode.rpick[i + 'pos'] = 'Top';
            else if (borderColor == "rgb(0, 0, 221)" || borderColor == "#0000DD" || borderColor == "rgb(0,0,221)")
                draftToEncode.rpick[i + 'pos'] = 'Bot';
            else if (borderColor == "rgb(221, 221, 0)" || borderColor == "#DDDD00" || borderColor == "rgb(221,221,0)")
                draftToEncode.rpick[i + 'pos'] = 'Woods';
            else if (borderColor == "rgb(221, 221, 221)" || borderColor == "#DDDDDD" || borderColor == "rgb(221,221,221)")
                draftToEncode.rpick[i + 'pos'] = 'Roam';
        }

        for (var i = 1; i < 6; i++) {
            var aux = $('#direPick' + i).attr('src');
            draftToEncode.dpick[i] = aux.substr(13, aux.length - 17);
            aux = $('#direBan' + i).attr('src');
            draftToEncode.dban[i] = aux.substr(13, aux.length - 17);

            var borderColor = $('#direPick' + i).css('border-top-color');
            if (borderColor == "rgb(221, 0, 0)" || borderColor == "#DD0000" || borderColor == "rgb(221,0,0)")
                draftToEncode.dpick[i + 'pos'] = 'Mid';
            else if (borderColor == "rgb(0, 221, 0)" || borderColor == "#00DD00" || borderColor == "rgb(0,221,0)")
                draftToEncode.dpick[i + 'pos'] = 'Top';
            else if (borderColor == "rgb(0, 0, 221)" || borderColor == "#0000DD" || borderColor == "rgb(0,0,221)")
                draftToEncode.dpick[i + 'pos'] = 'Bot';
            else if (borderColor == "rgb(221, 221, 0)" || borderColor == "#DDDD00" || borderColor == "rgb(221,221,0)")
                draftToEncode.dpick[i + 'pos'] = 'Woods';
            else if (borderColor == "rgb(221, 221, 221)" || borderColor == "#DDDDDD" || borderColor == "rgb(221,221,221)")
                draftToEncode.dpick[i + 'pos'] = 'Roam';
        }

        var url = window.location + '';

        var info = '';
        if (youSide == 'Radiant')
            info = 'op=r';
        else
            info = 'op=d';

        info = info + '&fp=' + fp;
        writeToChat('>>> Link to share draft result <a href="' + url.substr(0, url.lastIndexOf('/') + 1) + 'show?' + info + '&' + encode(draftToEncode) + '">here</a>.');
    };

    $(document).keypress(function (e) {
        if (e.keyCode == 13) {
            if ($('#chatMessage').val() != '') {
                var msg = $('#chatMessage').val();
                $('#chatMessage').val('');
                if (connected == 1) {
                    socket.emit('message', {message: msg});
                    writeToChat(getYouNickname() + ' : ' + msg);
                } else {
                    writeToChat('>>> You are not connected.');
                }
            }
        }
    });

    if ($('#pub').height() == 0) {
        $('#advert').css("background-image", "url(files/css/images/adblocked.jpg)");
    }

    var window_focus = true;
    var titles = [];
    titles.push(window.document.title);
    titles.push(window.document.title + " - Player Joined")
    var currentTitle = 0;
    var titleChanger = null;
    function highlightTab() {
        $("#dingSound").trigger("play");
        if (!window_focus) {
            titleChanger = setInterval(function() {
                currentTitle = (currentTitle + 1) % 2;
                window.document.title = titles[currentTitle];
            }, 800);
        }
    }

    $(window).bind("focus", function() {
        window_focus = true;
        clearInterval(titleChanger);
        window.document.title = titles[0];
    });
    $(window).bind("blur", function() {
        window_focus = false;
    });

});
