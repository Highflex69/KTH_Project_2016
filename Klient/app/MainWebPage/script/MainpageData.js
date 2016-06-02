/****
 * Teddy & co = Teddy & Carlos. This was to notice what was added and modified to avoid merge conflict and other problems.
 * To-do:
 * - The images need to be preloaded for better process performence, so it don't lag when sliding to fast.
 * - The defend and attack events drop-down menu should be deleted or add the function to filter it in the newsfeed.
 * **/

var sliderVal = 0;
var enemyType = "global_stats"// Teddy & Co: default drop down menu value, but changes when recived info from API.
var choosedSeason = 1;
var currentSeason = 1;
var flagg = false;
var mapImgBugs = "Images/helldivers_galcamp_progression/bug/helldivers_galcamp_progression_bug_";
var mapImgCyborgs = "Images/helldivers_galcamp_progression/cyborg/helldivers_galcamp_progression_cyborg_";
var mapImgIllu = "Images/helldivers_galcamp_progression/illuminate/helldivers_galcamp_progression_illuminate_";
var mapImg = [mapImgBugs, mapImgCyborgs, mapImgIllu];
var IMGformat = ".png";
var intervalId = null; //the intervalId is the id for the playButton, the id is needed to stop it when pleased.
var noEnemys = 3; // this need to be changed to a more efficient way.

function evalSlider2() {
    sliderVal = document.getElementById('slider').value;
    document.getElementById('sliderValue').innerHTML = sliderVal;
}

function createSelectOptions() {
    var x = document.getElementById('seasons');
    var i;

    if (flagg != true) {

        for (i = 1; i <= currentSeason; i++) {

            var option = document.createElement("option");
            option.text = i;
            x.add(option);
        }

        flagg = true;
    }
}

function saveSeason() {
    if(document.getElementById('seasons').value != null)
    {
        choosedSeason = document.getElementById('seasons').value;
    }
    else
    {
        choosedSeason = 1;
    }

}

var app = angular.module('app', ['extractDataFromAPI']);

/**
 * Teddy & Co added and modified:
 */
function calculate_region(points, points_max) {
    var points_per_region = points_max / 10;
    var region = Math.min(Math.max(Math.floor(points / points_per_region), 0), 10);
    return region;
}

/**
 * Teddy & Co added:
 */
function insertionSortEvents(events) {

    for(var i=1;i<events.length;i++)
    {
        var temp = events[i];
        var tempIndex = i;
        while(tempIndex > 0 && temp.end_time < events[tempIndex-1].end_time){
            events[tempIndex] = events[tempIndex-1];
            tempIndex--;
        }
        events[tempIndex] = temp;
    }
}
/**
 * Teddy & Co added:
 */
function isAttackEventSuccessful(season, enemytype, atDay){
    var attackEventOfEnemy = getAttackEvents(season, enemytype);
    var firstDayTime = getStartTimeInSeason(choosedSeason);
    var attack_eventDay;

    if(attackEventOfEnemy != null && attackEventOfEnemy.length > 0)
    {
        attack_eventDay = Math.floor((attackEventOfEnemy[attackEventOfEnemy.length-1].end_time - firstDayTime)/(60*60*24));
        if(attack_eventDay <= atDay && attackEventOfEnemy[attackEventOfEnemy.length-1].status == "success")
        {
            return true;
        }
    }
    return false;
}
/**
 * Teddy & Co added:
 */
function calculateImg(season, enemy)
{
    var result;
    if(isAttackEventSuccessful(season, enemy, Math.floor(sliderVal)))
    {
        result = 12;
    }
    else
    {
        var snapshotsCurrentSeason = getSnapshotsInSeason(season);
        var seasonSnapshot = getSeason(season);
        var points = (JSON.parse(snapshotsCurrentSeason[Math.floor(sliderVal)].data))[enemy].points;
        var points_max = seasonSnapshot.points_max[enemy];

        result = calculate_region(points, points_max) + 1;

        if (result < 10)
        {
            result = "0".concat(result);
        }
    }

    return result;
}

app.controller("WebApiCtrl", function ($scope) {

    $scope.data = null;

    // Ändrar dynamisk storleken på slidern beroende av den valda säsongen
    $scope.setEventSize = function () {
        document.getElementById('slider').max = getLatestDayInSeason(choosedSeason, null)-0.01;
    };

    /**
     * Teddy & Co added:
     */
    $scope.resetSlider = function() {
        var defaultValue = 0;
        document.getElementById('slider').value = defaultValue;
        document.getElementById('sliderValue').innerHTML = defaultValue;
        $scope.setEventSize();
        $scope.getImagePath();
        $scope.newsFeed();
        $scope.warStats();
        var table = document.getElementById("newsfeed");
        while(table.rows.length > 0)
        {
            table.deleteRow(0);
        }
    };
    /**
     * Teddy & Co modified:
     */
    $scope.defaultSlide = function () {
        return 0;
    };


    /**
     * Teddy & Co modified:
     */
    $scope.camp = function () {
        //updates the chosen enemy type.
        enemyType=document.getElementById('enemyType').value;
        /**
         * to get Region img :
         * **/
        $scope.getImagePath();
        /**
         * to get enemy stats:
         * */
        $scope.newsFeed();
        $scope.warStats();
    };

    /**
     * Teddy & Co modified:
     */
    $scope.selectStatisticsInSeason = function (){
        enemyType=document.getElementById('enemyType').value;
    };

    /**
     * Teddy & Co added:
     */
    $scope.getImagePath = function(){
        var URL;
        var result = [];

        for(var i=0;i<noEnemys;i++)
        {
            result[i] = calculateImg(choosedSeason, i);
        }

        if(enemyType == "global_stats")
        {

            for(var i=0;i<mapImg.length;i++)
            {
                var imgHolder = document.getElementById("maps"+i);
                var img = document.createElement('img');
                imgHolder.src =  mapImg[i].concat(result[i], IMGformat);
            }
        }
        else
        {
            URL = mapImg[enemyType].concat(result[enemyType], IMGformat);
            var regionIMG = document.getElementById("maps"+enemyType);
            regionIMG.src = URL;
        }
    };

    $scope.warStats=function () {
        evalSlider2();
        var stats=getSavedSeasonStatstics(choosedSeason);
        var seasonStats=getSeasonInfo(choosedSeason);
        var enemiesLerp=calculateLerp(seasonStats, sliderVal);
        var events=[];

        for(var counter=0;counter<stats.length;counter++){
            var dataText=[];
            var enemy="";

            if(counter == 0){
                enemy="Bugs:";
            }else if(counter ==1){
                enemy="Cyborgs:";
            }else{
                enemy="Illuminate:";
            }

            dataText.push(enemy+"\n");
            dataText.push(" Kills: "+stats[counter].kills.toFixed(0) + "  Deaths: "+stats[counter].deaths.toFixed(0)+
                " Accuracy:"+stats[counter].accuracy.toFixed(2)+"%"+"  KD:"+stats[counter].kdRatio.toFixed(2)+ " Successful missions:"+stats[counter].missionsPercentage.toFixed(2)+ "%"+
                " Succesfull defend events:"+stats[counter].defendPercentage.toFixed(2)+ "%"+" Succesfull attack events:"+stats[counter].attackPercentage.toFixed(2)+"%"+" Accidental kills:"+
                stats[counter].accidentalKills.toFixed(2)+"%" +" points: "+enemiesLerp[counter].points.toFixed(0) +" points taken: "+enemiesLerp[counter].points_taken.toFixed(0));
            events.push(dataText);
        }

        var table = document.getElementById("warfeed");
        while(table.rows.length > 0){
            table.deleteRow(0);
        }

        while(events.length > 0){
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            var td2 = document.createElement("td");

            var datarow = events.shift();
            td.appendChild(document.createTextNode(datarow[0]));
            td.className = "newsfeedDayColumn";
            td2.appendChild(document.createTextNode(datarow[1]));
            td2.className = "newsfeedStringColumn";


            tr.appendChild(td);
            tr.appendChild(td2);
            table.appendChild(tr);
        }
    };

    /**
     * Teddy & Co added:
     */
    $scope.newsFeed = function(){
        var allDefendEvents = getDefendEvents(choosedSeason, null);
        var allAttackEvents = getAttackEvents(choosedSeason, null);
        //
        var allEvents = [];

        allEvents = allAttackEvents.concat(allDefendEvents);
        //
        insertionSortEvents(allEvents);

        //counting the time at first day of the season:
        var firstDayTime = getStartTimeInSeason(choosedSeason);

        //chronological sort the text for attack and defend events. This might be separated with a function.
        var newsfeedText = [];

        for(var i=0;i<allEvents.length;i++)
        {
            var datatext = [];
            var day = Math.floor((allEvents[i].end_time - firstDayTime)/(60*60*24));
            //datatext[0] = "DAY day"
            datatext.push("DAY " + day);
            //datatext[1] = "Region..." || "Final..."
            if(allEvents[i].region)// if there is no region, then its an attack_event. The filtering could be done better.
            {

                if(enemyType == "global_stats")
                {
                    datatext.push("Region " + allEvents[i].region + " was attacked by " + allEvents[i].enemy +
                        " and Helldivers " +  (allEvents[i].status == "success" ? "defended" : "got crushed"));
                }
                else
                {
                    if(enemyType == allEvents[i].enemy)
                    {
                        datatext.push("Region " + allEvents[i].region + " was attacked by " + allEvents[i].enemy +
                            " and Helldivers " +  (allEvents[i].status == "success" ? "defended" : "got crushed"));
                    }
                    else
                    {
                        datatext.push("");
                    }
                }
            }
            else
            {
                if(enemyType == "global_stats")
                {
                    datatext.push("Final assault on " + allEvents[i].enemy + " was a " +
                        allEvents[i].status);
                }
                else
                {
                    if(enemyType == allEvents[i].enemy)
                    {
                        datatext.push("Final assault on " + allEvents[i].enemy + " was a " +
                            allEvents[i].status);
                    }
                    else
                    {
                        datatext.push("");
                    }
                }

            }
            //datatext[2] = day;
            datatext.push(day);
            newsfeedText.push(datatext);
        }

        //text table for newsfeed
        var table = document.getElementById("newsfeed");
        while(table.rows.length > 0)
        {
            table.deleteRow(0);
        }

        while(newsfeedText.length > 0 && (newsfeedText[0])[2] <= sliderVal){
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            var td2 = document.createElement("td");
            var newsrow = newsfeedText.shift();

            if(newsrow[1] != "")
            {
                td.appendChild(document.createTextNode(newsrow[0]));
                td.className = "newsfeedDayColumn";
                td2.appendChild(document.createTextNode(newsrow[1]));
                td2.className = "newsfeedStringColumn";
                tr.appendChild(td);
                tr.appendChild(td2);
                table.appendChild(tr);
            }

        }
    };

    /**
     * Teddy & Co added:
     */
    $scope.playSlider = function()
    {
        var latesDay = getLatestDayInSeason(choosedSeason,null);
        var dayStamp = Math.floor(sliderVal);

        intervalId = setInterval(function () {
            if(dayStamp == latesDay)
            {

                window.clearInterval(intervalId);
            }
            document.getElementById('slider').value = dayStamp;
            $scope.updateStats();
            dayStamp++;
        }, 500);
    };

    /**
     * Teddy & Co added:
     */
    $scope.updateStats = function () {
        evalSlider2();
        $scope.warStats();
        $scope.newsFeed();
        $scope.getImagePath();
    };
    /**
     * Teddy & Co added:
     */
    $scope.stopSlider = function(){
        if(intervalId != null)
        {
            window.clearInterval(intervalId);
        }
    };

});