var enemyResult = [];
var seasonLength=[];

function run(jsonObj) {

    var i;
    var length= enemyResult.length;
    var globalSeason=null;
    
    if (jsonObj != null) {

        for (i = 0; i < jsonObj.length; i++) {

            globalSeason= jsonObj[i].season;
            
            var accidential = accidentialCalc(jsonObj[i].accidentals, jsonObj[i].kills);
            var attackPercentage = attackSuccessCalc(jsonObj[i].successful_attack_events, jsonObj[i].attack_events);
            var defendPercentage = defendSuccessCalc(jsonObj[i].successful_defend_events, jsonObj[i].defend_events);
            var missionsPercentage = missionSuccessCalc(jsonObj[i].successful_missions, jsonObj[i].missions);
            var kdRatio = kdRatioCalc(jsonObj[i].kills, jsonObj[i].deaths);
            var accuracy = accuracyCalc(jsonObj[i].hits, jsonObj[i].shots);

            enemyResult[i+length] = {

                season: globalSeason,
                enemy: jsonObj[i].enemy,
                kills: jsonObj[i].kills,
                deaths: jsonObj[i].deaths,
                accuracy: accuracy,
                kdRatio: kdRatio,
                missionsPercentage: missionsPercentage,
                defendPercentage: defendPercentage,
                attackPercentage: attackPercentage,
                accidentalKills: accidential
            };
        }

        seasonLength[globalSeason]={

            start: length,
            end: enemyResult.length
        };
        
    }else{

        seasonLength[globalSeason]=null;
    }
}

/*
    returnera statistiken beroende av säsongen som skickas in
 */
function getSavedSeasonStatstics(season){

    var result=[];

    if(seasonLength[season]!=null){

        var start = seasonLength[season].start;
        var end = seasonLength[season].end;
        var counter=0;

        for(var i=start;i<end;i++){

            result[counter]=enemyResult[i];
            counter++;
        }
    }

    return result;
}

function accuracyCalc(hits, shots) {

    if (hits == 0 || shots == 0) {

        return 0;
    } else {

        return ((hits / shots) * 100);
    }
}

function kdRatioCalc(kills, deaths) {

    if (kills == 0 || deaths == 0) {

        return 0;
    } else {

        return (kills / deaths);
    }
}

function accidentialCalc(accidentals, kills) {

    return ((accidentals / kills) * 100);
}

function attackSuccessCalc(successful_attack_events, attack_events) {

    if (successful_attack_events == 0 || attack_events == 0) {

        return 0;
    }
    else {

        return (successful_attack_events / attack_events) * 100;
    }
}

function defendSuccessCalc(successful_defend_events, defend_events) {

    if (successful_defend_events == 0 || defend_events == 0) {

        return 0;
    }
    else {

        return (successful_defend_events / defend_events) * 100;
    }
}

function missionSuccessCalc(successful_missions, missions) {

    if (successful_missions == 0 || missions == 0) {

        return 0;
    }
    else {

        return (successful_missions / missions) * 100;
    }
}

function getCalculations() {

    return enemyResult;
}