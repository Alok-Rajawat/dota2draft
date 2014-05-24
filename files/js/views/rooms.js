jQuery(function ($) {
    $("#refreshButton").button();
    $("#refreshButton").click(function () {

        // Clean table
        var table = $("#roomTable");
        table.find("tr:gt(0)").remove();

        $.get(window.location + '/get', function (data) {
            var publicRooms = 0;
            var privateRooms = 0;

            for (var roomId in data) {
                if (roomId == 'clone') continue;

                var room = data[roomId];
                if (room.isPv) {
                    privateRooms++;
                    continue;
                }
                publicRooms++;

                // Add row
                var newRow = "<tr>";

                if (room.player1nickname != null)
                    newRow += "<td>" + room.player1nickname + "</td>";
                else
                    newRow += "<td>Anonymous</td>";

                if (room.player2nickname != null)
                    newRow += "<td>" + room.player2nickname + "</td>";
                else
                    newRow += "<td>Anonymous</td>";

                if (room.action == "Laning") {
                    if (room.player1lanes != null && room.player2lanes != null)
                        newRow += "<td>Post-Draft</td>";
                    else
                        newRow += "<td>Laning</td>";
                } else if ((room.action == "Ban" || room.action == "Pick") && room.pickingSide != null) {
                    newRow += "<td>In Progress (" + (room.radiant.ban + room.dire.ban) + " bans, " + (room.radiant.pick + room.dire.pick) + " picks)</td>"
                } else {
                    newRow += "<td>Pre-Draft</td>"
                }


                newRow += "<td>" + room.mode.toUpperCase() + "</td>";

                newRow += "<td>" + room.spectatorsCount + "</td>";

                newRow += '<td><a href="/spectate?id=' + roomId + '">Spectate</a></td>';
                newRow += "</tr>"

                table.append(newRow);

            }

            $('#refreshSummary').html(publicRooms + ' public drafts, ' + privateRooms + ' private drafts.')
        });
    });

    if ($('#pub').height() == 0) {
        $('#advert').css("background-image", "url(files/css/images/adblocked.jpg)");
    }
});