// © 2022 Leon Poon. All Rights Reserved.

// for inquire button to display tooltips
const overlay = document.querySelector('.overlay');

const inquireBtn = document.querySelector('.inquire');
inquireBtn.addEventListener('click', ()=> {
    document.querySelector('dialog').showModal();
    overlay.style.display = 'flex';
    document.body.style.overflowY = 'hidden';
});

const closeModalBtn = document.querySelector('.closeModalBtn');
closeModalBtn.addEventListener('click', () => {
    document.querySelector('dialog').close();
    overlay.style.display = 'none';
    document.body.style.overflowY = 'scroll';
});

window.onload = function() {
    let calculateBtn = document.querySelector('.calculate');
    let inputFields = document.querySelectorAll('.item-input');
    let myChart;

    // check for input values prior to enabling button
    inputFields.forEach( (element) => {

        element.defaultValue ='';
        element.addEventListener('input', () => {
                                
            if (compoundTime.value != '--Select compounding period--' && presentValue.value != ''
                && interest.value != '' && years.value != '') {

                calculateBtn.disabled = false;

            } else {
                calculateBtn.disabled = true;
            }
        });
    });

    //calculate futureValue and display breakdown of values per compound interval
    calculateBtn.addEventListener('click', () => {

        //retrieve values from input
        let [ compoundTime, presentValue, interest, years, contributionPerYear ] = getValues();

        //double check for input to not be absent
        if (compoundTime == '--Select compounding period--' || isNaN(presentValue)
            || isNaN(interest) || isNaN(years) ||isNaN(contributionPerYear)) {
            
                document.querySelector('.textValue').innerHTML = "Please enter corresponding values above.";

        } else {
            
            let futureValue = 0;
            let contributionPerInterval;
            let grossContribution;
            let n;

            // determine compound period type
            //'n' denotes occurences of compound interval
            if (compoundTime == "annual") {
                n = 1.0;
            } else if (compoundTime == "biannual") {
                n = 2.0;
            } else if (compoundTime ==   "quarterly") {
                n = 4.0;
            } else if (compoundTime == "monthly") {
                n = 12.0;
            }

            contributionPerInterval = contributionPerYear / n;
            grossContribution = contributionPerYear * years;

            // Equation to arrive at final answer instantly..
            // futureValue = ( presentValue * Math.pow(( 1 + interest/n ), ( years * n )) );
            
            const perYearValue = breakdown(presentValue, years, n, interest, contributionPerInterval);
            let stringBreakdown = `${compoundTime} breakdown intervals:<br>`;

            let enumerate = '';
            let valueStrParse = '';
            
            // for graph
            let perYearValueArray = [];

            // parse array of interval values into a concatenated string for display
            for (let i = 0; i < perYearValue.length; i++) {
                perYearValueArray.push(parseFloat(perYearValue[i]).toFixed(2));
                enumerate += `${i + 1}) <br>`;
                valueStrParse += `$ ${ numberWithCommas(parseFloat(perYearValue[i]).toFixed(2)) }<br>`
            }

            // get final calculated value within th last array position
            futureValue = perYearValue[(perYearValue.length - 1)];

            
            //display summary present and future value and breakdown subtitle
            document.querySelector('.textValue').style.overflowY = "scroll";
            document.querySelector('.output').innerHTML = `The total future value of the investment:<br><b>$ ${ numberWithCommas( parseFloat(futureValue).toFixed(2))}</b>
                                                        <br><br> The total interest earned from investment:<br><b>$ ${ numberWithCommas( parseFloat(futureValue - presentValue - grossContribution).toFixed(2) ) }</b>
                                                        <br><br> The total contribution within ${years} years:<br><b>$ ${ numberWithCommas( parseFloat(grossContribution).toFixed(2) ) }</b>
                                                        <br><br><br>Total ${stringBreakdown}`;
            document.querySelector('.enumerate').innerHTML = enumerate;
            document.querySelector('.compoundValueOutput').innerHTML = valueStrParse;

            //clear previous chart if present, then render new chart
            if (myChart) {
                myChart.destroy();
            }
            createChart(years, n, perYearValue);
        }
    });

    // returns input values typed by user in an array
    function getValues() {
        let compoundTime = document.querySelector('#compoundTime').value;
        let presentValue = document.querySelector('#presentValue').value;
        let interest = (document.querySelector('#interest').value) / 100;
        let years = document.querySelector('#years').value;
        
        let contributionPerYear;
        
        if (document.querySelector('#contribution').value == '') {
            contributionPerYear = 0;
        } else {
            contributionPerYear = document.querySelector('#contribution').value;
        }

        return [compoundTime, presentValue, interest, years, contributionPerYear];
    }

    //Retrieved from: https://sebhastian.com/javascript-format-number-commas/
    function numberWithCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // returns an array of values per compound period
    function breakdown(presentValue, years, n, interest, contributionPerInterval) {
                
        let amount = parseFloat(presentValue);

        totalCompoundIntervals = years * n;
        interestPerInterval = interest / n;
        
        let perYearValue = [];

        // interval contributions are summed prior to applying the interval interest
        for (let i = 0; i < totalCompoundIntervals; i++) {
            amount += parseFloat(contributionPerInterval);
            amount *= (1 + interestPerInterval);
            let tempData = 0;
            tempData = amount;

            perYearValue.push(tempData);
        }
        
        return perYearValue;
    }

    // iterate through data, save aray of x-axis labels for chart
    function xAxisLabel(years, n) {
        
        let intervalArray = [];
        let totalCompoundIntervals = years * n;

        years = 0;
        for (let i = 0; i < totalCompoundIntervals; i++) {
            if (i % n == 0) {
                years += 1;
                intervalArray.push('Year ' + (years) + ' - (' + (i+1) + ')' );
            } else {
                intervalArray.push('(' + (i+1) +')' );
            }
        }
        
        return intervalArray;
    }
    
    // ChartJS
    function createChart(years, n, perYearValue) {

        // add dynamic title based on number of years compound
        const chartContainer = document.querySelector('.chartContainer');
        let titleDiv;

        // create <h4> tag if new graph or use existing element in an existing graph
        if ( !document.querySelector('h4') ) {
            titleDiv = document.createElement('h4');
        } else {
            titleDiv = document.querySelector('h4');
        }
        // string interpolate years variable based on user input
        titleDiv.innerHTML = `Compounded Equity after ${years} Years`;
        titleDiv.style.cssText = 'text-align: center; background-color: white; padding: 0.5rem;';
        chartContainer.appendChild(titleDiv);

        //Chart creation
        const ctx = document.getElementById('compoundInterestChart').getContext('2d');

        //Bg styling
        const gradientBg = ctx.createLinearGradient(0, 0, 0, 800);
        /*  x0 = start point of gradient in canvas horizontally (left-most)
            y0 = starting point vertical top
            x1 = ending point horizontal (right-most)
            y1 = ending point of vertical (bottom)
        */
        gradientBg.addColorStop(0, 'hsla(133, 100%, 70%, 0.8)');
        gradientBg.addColorStop(0.35, 'hsla(0, 100%, 100%, 0.75)');

        // line styling and label => data => config
        const gradientLine = ctx.createLinearGradient(0, 0, 0, 800);
        gradientLine.addColorStop(0, 'hsla(0, 0%, 90%, 0.8)');
        gradientLine.addColorStop(0.6, 'hsla(251, 100%, 65%, 0.95)');

        const labels = xAxisLabel(years, n);

        const data = {
            labels: labels,
            datasets: [{
                data: perYearValue,
                label: "Equity ($)",
                fill: true,
                lineTension: 0.2,
                backgroundColor: gradientBg,
                borderColor: gradientLine,
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
            }
        };

        //config => render new chart, and fade opacity to 1.0 with CSS
        myChart = new Chart(ctx, config);
        chartContainer.classList.add('fullOpacity');
    }
}
