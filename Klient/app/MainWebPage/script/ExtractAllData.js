/**
 * Created by dani on 18/05/16.
 *
 */
var APIURL1 = "https://api.helldiversgame.com/1.0/";
var APIURL2 = "https://files.arrowheadgs.com/helldivers_api/default/" ;
var latestSeason;
var allSeasons = []; // has every season data 1-current season
var allAttackEvents = [];
var allDefendEvents = [];

/**
 * Teddy & Co added:
 */
//get_snapshots of the whole season
function getSeason(season)
{
    for(var i=0;i<allSeasons.length;i++)
    {
        if(allSeasons[i].snapshots[0].season  == season)
        {
            return allSeasons[i];
        }
    }
}
/**
 * Teddy & Co added:
 */
//in get_snapshots the snapshots array in season
function getSnapshotsInSeason(season)
{
    for(var i=0;i<allSeasons.length;i++)
    {
        if(allSeasons[i].snapshots[0].season  == season)
        {
            return allSeasons[i].snapshots;
        }
    }
}
/**
 * Teddy & Co added:
 */
function getAttackEvents(season, enemytype)
{
    var seasonAttackEvents = getSeason(season).attack_events;
    if(seasonAttackEvents == null)
    {

        return null;
    }

    if(enemytype != null)
    {
        var attackEventsForEnemy = [];

        for(var i=0;i<seasonAttackEvents.length;i++)
        {
            if(seasonAttackEvents[i].enemy == enemytype)
            {
                attackEventsForEnemy.push(seasonAttackEvents[i]);
            }
        }
        return attackEventsForEnemy;
    }
    else
    {
        //return attack evetn for all enemy
        return seasonAttackEvents;
    }
}
/**
 * Teddy & Co added:
 */
function getDefendEvents(season, enemytype)
{
    var seasonDefEvents = getSeason(season).defend_events;
    if(seasonDefEvents == null)
    {
        return null;
    }

    if(enemytype != null)
    {
        var defendEventsForEnemy = [];
        for(var i=0;i<seasonDefEvents.length;i++)
        {
            if(seasonDefEvents[i].enemy == enemytype)
            {
                defendEventsForEnemy.push(seasonDefEvents[i]);
            }
        }

        return defendEventsForEnemy;
    }
    else
    {
        //return attack evetn for all enemy
        return seasonDefEvents;
    }
}
/**
 * Teddy & Co added:
 */
function getLatestSeason(){
    return latestSeason;
}
/**
 * Teddy & Co added:
 */
function getStartTimeInSeason(season)
{
    var dataResponse = getSnapshotsInSeason(season);
    if( dataResponse.length != 0)
    {
        return dataResponse[0].time;

    }

    return null;
}
/**
 * Teddy & Co added:
 */
function getLatestDayInSeason(season, enemytype){

    var tempSeasonInfo = getSnapshotsInSeason(season);
    //earlier season can get an extra day error.
    if(tempSeasonInfo != null && enemytype == null)
    {
        return tempSeasonInfo.length;
    }
    else
    {
        var defEventsForEnemyAmount = 0;
        var attackEventsForEnemyAmount = 0;

        var enemyTypeDefEvents = getDefendEvents(season, enemytype);
        var enemyTypeAttackEvents = getAttackEvents(season, enemytype);

        if(enemyTypeDefEvents != null)
        {

            defEventsForEnemyAmount = enemyTypeDefEvents.length;
        }

        if(enemyTypeAttackEvents != null)
        {
            attackEventsForEnemyAmount = enemyTypeAttackEvents.length;
        }

        return Math.max(defEventsForEnemyAmount,attackEventsForEnemyAmount);
    }
    return null;
}
/**
 * Teddy & Co added:
 */
function extractEverything(JsonObj){

    allSeasons.push(JsonObj.data);

    if(JsonObj.data.attack_events === undefined)
    {
        allAttackEvents.push(null);
    }
    else
    {
        allAttackEvents.push(JsonObj.data.attack_events);
    }
    //got to do same for defend event as attack events
    if(JsonObj.data.defend_events === undefined)
    {
        allDefendEvents.push(null);
    }
    else
    {
        allDefendEvents.push(JsonObj.data.defend_events);
    }


    //for warStats
    getSnapshots(JsonObj.data.snapshots, seasons.length, JsonObj.data.points_max);
}

var extractDataFromAPI = angular.module('extractDataFromAPI', [], function ($httpProvider) {

    /**
     * Teddy & Co modified following:
     */

    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    //Access-Control-Allow-Origin not needed anymore
}).run(function(dataService){
    initialize(dataService);
});

extractDataFromAPI.service('dataService', function ($http) {

    this.getSnapshots = function (season, start, end) {
        /**
         * Teddy & Co modified following:
         */
        // $http() returns a $promise that we can add handlers with .then()
        return $http({
            method: 'POST',
            url: APIURL2,
            data : "action=get_snapshots" + "&season=" + season + "&start=" + start + "&end=" + end
        });
    };

    this.getCampaign = function () {
        /**
         * Teddy & Co modified following:
         */
        return $http({
            method: "POST",
            url: APIURL2,
            data :'action=get_campaign_status'
        });
    };

    this.getSeasonStatistics = function(season)
    {
        return $http({
            method: 'POST',
            url:APIURL2,
            data :'action=get_season_statistics' + "&season=" + season
        });
    };

});
/**
 * Teddy & Co modified:
 */
initialize = function (dataService){
    dataService.getCampaign().then(function(dataResponse){
        latestSeason = dataResponse.data.campaign_status[0].season;

        for(var i=1;i<=latestSeason;i++){ // loppar igenom det och hämtar statistiken för varje säsong
            dataService.getSnapshots(i,null,null).then(function (dataResponse) { // skickar in och sparar

                extractEverything(dataResponse);
            });
        }
        //start: this is the init of the variables that need to be ready for use in MainpageData.js.
        run(dataResponse.data.statistics);
        choosedSeason = currentSeason = latestSeason;
        createSelectOptions();
        //end
        for(var counter=1;counter<=latestSeason;counter++) {
            dataService.getSeasonStatistics(counter).then(function (dataResponse) { // skickar in och sparar

                run(dataResponse.data.statistics);
            });
        }
    });
};


/**
 * for warStats
 * **/

var seasons=new Array(), seasonsLengths=[];

/*
 1. Returnerar en hel säsong med objekt och möjligheten att välja enemytyper för varje dag
 2. resultatet som returneras: möjligheten att välja dag och enemytyp [dag (beroende av hur lång en säsong är 0 -x )] [enemytyp (0-2 max)]
 */
function getSeasonInfo(season){
    var start= seasonsLengths[season].start;
    var end = seasonsLengths[season].end;
    var result=[];

    var startTmp=start;
    var tmpCounter=0;

    for(var xCount=start;xCount<end;xCount++){
        result[tmpCounter]=new Array(seasons[xCount].length);

        for(var yCount=0;yCount<seasons[xCount].length;yCount++){
            result[tmpCounter][yCount]=seasons[startTmp][yCount];

        }
        startTmp++;
        tmpCounter++;
    }
    return result;
}

function getSnapshots(snapObject, currentSeasonLength, pointsMaxObj){
    if(snapObject !=null){
        var globalSeason=null;
        for(var counter=0;counter<snapObject.length;counter++){
            var seasonTmp=snapObject[counter].season;
            var timeTmp= snapObject[counter].time;
            globalSeason=seasonTmp;

            var extract=JSON.parse(snapObject[counter].data);
            seasons[counter+currentSeasonLength]= new Array(extract.length);
            for(var extractCount=0;extractCount<extract.length;extractCount++){ // antal data
                seasons[counter+currentSeasonLength][extractCount]={
                    points_max: pointsMaxObj[extractCount],
                    time: timeTmp,
                    season: seasonTmp,
                    points: extract[extractCount].points,
                    points_taken: extract[extractCount].points_taken,
                    status: extract[extractCount].status
                };
            }
        }

    }

    seasonsLengths[globalSeason]={
        start: currentSeasonLength,
        end: seasons.length
    };
}