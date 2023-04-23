$(document).ready(function(){
    /*
    window.MathJax = {
        tex: {
            inlineMath: [['[[', ']]']]
        }
    };
    */

    var quiz = window.location.pathname.split("/").pop().split(".")[0];
    var nonce = 45742;
    var qId = Cookies.get(quiz);
    try {
        qId = parseInt(atob(qId))-nonce;
    } catch {
        qId = null;
    }
    if (qId == null || isNaN(qId)) { qId = 0; }

    // Get from db
    var queryData = {
        apikey: "24mnMIv6lAJ4pz2nck8j3870sXA",
        dbowner: "lasse.ahrendt",
        dbname: "quiz_v1.db",
        sql: ""
    }
    var sqlQuery = "SELECT * FROM '" + quiz + "' WHERE Id>" + qId + " ORDER BY Id LIMIT 1;";
    queryData.sql = b64EncodeUnicode(sqlQuery);
    
    var dburl = "https://api.dbhub.io/v1/query";
    var answer, id;
    
    $.post(dburl, queryData, function(data, status) {
        if (status == "success") {
            // Good response from db
            data = JSON.parse(data);
            
            if (data == null) {
                // No more questions
                Cookies.set(quiz, btoa(nonce), { expires: 14 });
                window.location.reload();
            } else {
                // Results returned
                for (var i = 0; i < data[0].length; i++) {
                    switch(data[0][i].Name) {
                        case "Id":
                            id = data[0][i].Value;
                            break;
                        case "Title":
                            var title = data[0][i].Value;
                            break;
                        case "Text":
                            var text = data[0][i].Value;
                            break;
                        case "Image":
                            var image = data[0][i].Value;
                            break;
                        case "Answer":
                            answer = data[0][i].Value;
                            answer = answer.toString().trim().toLowerCase();
                            break;
                        default:
                            console.log("Error, unknown data received.");
                            console.log(data[0][i]);
                    }
                }
                populate(title, text, id, image);

                if (text.match("[[")) {
                    if (!window.MathJax) {
                        window.MathJax = {
                            tex: {
                                inlineMath: [['[[', ']]']]
                            }
                        };
                    }
                    var script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
                    document.head.appendChild(script);
                }
            }
        } else {
            // Bad response from db
            populate("Problem med forbindelsen", "Der var et problem med forbindelsen til databasen. Prøv venligst igen.");
        }
    });


    $("#helpOpen").click(function(){ $("#help").show(); })
    $("#helpClose").click(function(){ $("#help").hide(); })

    $("#formAnswer").submit(function(){
        event.preventDefault();
        var userAnswer = $("#answer").val().toString().trim().toLowerCase();
        $("#answer").val("");

        if (userAnswer == answer) {
            // Svar er korrekt
            Cookies.set(quiz, btoa(parseInt(id)+nonce), { expires: 14 });
            window.location.reload();
        } else {
            // Svar er forkert
            $("#panel").children("p").first().text("Dit svar '" + userAnswer + "' er desværre forkert. Prøv igen.");
            $("#panel").show();
        }
    })

    function populate(title, text, id=null, image=null){
        var converter = new showdown.Converter();
        $("#title").text(title);
        $("#text").html(converter.makeHtml(text));

        if (id != null) {
            $("#id").text(id).show();
        } else {
            $("#id").hide();
        }

        if (image != null) {
            $("#image").attr("src", image).show();
        } else {
            $("#image").hide();
        }
        MathJax.typeset();
    }

    function b64EncodeUnicode(str) {
        // first we use encodeURIComponent to get percent-encoded UTF-8,
        // then we convert the percent encodings into raw bytes which
        // can be fed into btoa.
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
        }));
    }
});
