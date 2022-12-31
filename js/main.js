let raceTypesSelected = ['T', 'G', 'J'];
let loadedRaces;
let racesToFilter;
let highestPurseRace;
let today = moment().utc();
let missingTime;
let daysLeft;
let hoursLeft;
let minutesLeft;

window.onload = async function() {
    await loadRaces();
}

async function loadRaces() {
    const url = `http://localhost:8080/next_races`;
    const response = await fetch(url);
    loadedRaces = await response.json();

    await loadNextRace();
}

async function loadNextRace() {
    loadedRaces.forEach(race => {
        race.purse.convertedAmount = race.purse.amount;
        if (race.purse.currency == 'GBP') {
            race.purse.convertedAmount = race.purse.amount * 1.13; // converting to eur
        }
    }); 

    racesToFilter = loadedRaces.filter(function (race) {
        let date = moment.unix(race.post_time).utc();

        // below I am simulating the date passed by the API added by a few years, months, days and hours 
        // in order to get close to the time I am testing it (30/12/2022 ~2am UTC)
        let datePostTime = date.add(7, 'years').add(4, 'months').add(11, 'days').add(17, 'hours');
        
        // it's possible to set the variable "date" here to get exactly what the API is retrieving. 
        // Then, it would be necessary to set a current timestamp there
        let dateToCompare = datePostTime; 
        
        missingTime = moment(dateToCompare).diff(moment(today));

        if (missingTime < 0 || !raceTypesSelected.includes(race.race_type)) {
            return false;
        }
        race.datePostTime = datePostTime.format('YYYY-MM-DD HH:mm');
        race.today = today.format('YYYY-MM-DD HH:mm')
        
        missingTime = moment.duration(missingTime);

        
        daysLeft = Math.round(missingTime.asDays()) + 1;
        hoursLeft = Math.round(missingTime.asHours()) + 1;
        minutesLeft = Math.round(missingTime.asMinutes()) + 1;
        
        race.missingTime = {'daysLeft': daysLeft, 'hoursLeft': hoursLeft, 'minutesLeft': minutesLeft};
        return true;
    });

    if (racesToFilter.length > 0) {
        highestPurseRace = racesToFilter.reduce(
            (prev, current) => {
              return prev.purse.convertedAmount > current.purse.convertedAmount ? prev : current
            }
        );
        
        document.getElementById('eventTitle').innerHTML = highestPurseRace.event.title;
        document.getElementById('eventCountry').src = 'assets/img/flags/' + highestPurseRace.event.country + '.gif';
        
        if (highestPurseRace.missingTime.daysLeft > 1) {
            document.getElementById('timeToStart').innerHTML = daysLeft + ' days';
        } else if (highestPurseRace.missingTime.hoursLeft > 1) {
            document.getElementById('timeToStart').innerHTML = hoursLeft + ' hours';
        } else if (highestPurseRace.missingTime.minutesLeft > 1) {
            document.getElementById('timeToStart').innerHTML = minutesLeft + ' minutes';
        } else {
            document.getElementById('timeToStart').innerHTML = 'Due';
        }


        document.getElementById('numberOfRunners').innerHTML = highestPurseRace.num_runners + ' Runners';
        document.getElementById('distance').innerHTML = highestPurseRace.distance + 'm';
        document.getElementById('amount').innerHTML = highestPurseRace.purse.amount;
        document.getElementById('currency').innerHTML = highestPurseRace.purse.currency;
        document.getElementById('raceTypeSvg').src = 'assets/race_types/white/' + highestPurseRace.race_type + '.svg';
        
        let runnersDiv = '';
        let showSilks = true;

        highestPurseRace.runners.forEach(runner => {
            
            if (!showSilks || runner.silk == '') {
                showSilks = false;
            }

            let silk = showSilks ? `
            <span class="silk" style="float: left!important">
                <img src="assets/img/silks/${runner.silk}">
            </span>` : '';
    
            runnersDiv += `
            <div id="runner-${runner.id_runner}" class="card-body border">
                <p class="card-text" style="font-family: Tahoma, Geneva, Verdana, sans-serif;">
                    ${silk}
                    <button 
                        style='all: unset; cursor: pointer;'
                        onclick="window.open('https://www.racebets.com/bet/${highestPurseRace.id_race}', '_blank')"> 
                        <span class="small">
                            ${runner.name} 
                        </span>
                    </button>
                    <span style="float: right!important">
                        <button class="button btn-warning btn-block" style="width: 40">${runner.odds}</button>
                    </span>
                </p>
            </div>
            `;
        });

        document.getElementById('next-race-box').style.display = 'block';
        document.getElementById('runners').innerHTML = runnersDiv;

        if (!showSilks) {
            const silks = document.getElementsByClassName('silk');
            for (let i = 0; i < silks.length; i++) {
                silks[i].innerHTML = '';
            }
        }

    } else {
        document.getElementById('next-race-box').style.display = 'none';
    }
}

async function manageRaceType(checkboxRaceType) {
    const raceType = checkboxRaceType.value;

    if (raceTypesSelected.includes(raceType)) {
        raceTypesSelected = raceTypesSelected.filter(function(e) {
            return e !== raceType;
        });
    } else {
        raceTypesSelected.push(raceType);
    }

    await loadNextRace();
}