//One universal basic required here to get things going once loaded
window.onload = function() {
    //We need to set up buttons in this onload section
    /*
    document.getElementById('ClickMe').onclick = function() {
         alert('ClickMe was clicked');
    };
    */

    //restoreDefaultValues(); //Un-comment this if you want to start with defaults
    Main();
};

//Main() is hard wired as THE place to start calculating when inputs change
//It does no calculations itself, it merely sets them up, sends off variables, gets results and, if necessary, plots them.
function Main() {
    //Save settings every time you calculate, so they're always ready on a reload
    saveSettings();

    //Send all the inputs as a structured object
    //If you need to convert to, say, SI units, do it here!
    const inputs = {
        linVal_Q: sliders.SlideLin_Q.value,
        linVal_n: sliders.SlideLin_n.value,
        linVal_b: sliders.SlideLin_b.value,
        linVal_s: sliders.SlideLin_s.value,
		linVal_So: sliders.SlideLin_So.value,
    };

    //Send inputs off to CalcIt where the names are instantly available
    //Get all the resonses as an object, result
    const result = CalcIt(inputs);

    //Set all the text box outputs
    document.getElementById('NormalDepth').value = result.normal_depth.toFixed(3);
    document.getElementById('Area').value = result.area.toFixed(3);
    document.getElementById('SurfaceB').value = result.section_props.B.toFixed(3);
    document.getElementById('WettedP').value = result.section_props.P.toFixed(3);
    document.getElementById('RadiusR').value = result.section_props.R.toFixed(3);
    document.getElementById('MeanDepthDm').value = result.section_props.Dm.toFixed(3);
    document.getElementById('Fr').value = result.section_props.Fr.toFixed(3);
    //Do all relevant plots by calling plotIt - if there's no plot, nothing happens
    //plotIt is part of the app infrastructure in app.new.js
    if(result.plots) {
        for(let i = 0; i < result.plots.length; i++) {
            plotIt(result.plots[i], result.canvas[i]);
        }
    }
}

//Here's the app calculation
//The inputs are just the names provided - their order in the curly brackets is unimportant!
//By convention the input values are provided with the correct units within Main
function CalcIt({linVal_Q, linVal_n, linVal_b, linVal_s, linVal_So}) {
	let y_1 = 1.0
	let y_2 = 2.0
	let tolerance = 0.001
    let sec_props = secant_manning(y_1, y_2, tolerance, linVal_Q, linVal_n, linVal_So, linVal_b, linVal_s)
	let y_n = sec_props.y

    //Now we create some plots of teh trapezoidal channel
    const plotOne = [], plotTwo = [];
    let xval, y1, y2, yhigh;
    let x1_0, x1_1, x1_2, x1_3
    let y1_0, y1_1, y1_2, y1_3
    let x2_0, x2_1, x2_2, x2_3
    let y2_0, y2_1, y2_2, y2_3

    // Channel
    yhigh = y_n*1.1
    x1_0 = 0.0
    y1_0 = yhigh
    plotOne.push({x: x1_0, y: y1_0});
    x1_1 = yhigh*linVal_s
    y1_1 = 0.0
    plotOne.push({x: x1_1, y: y1_1});
    x1_2 = x1_1+linVal_b
    y1_2 = 0.0
    plotOne.push({x: x1_2, y: y1_2});
    x1_3 = x1_2+x1_1
    y1_3 = y1_0
    plotOne.push({x: x1_3, y: y1_3});

    // Water
    x2_0 = (yhigh-y_n)*linVal_s
    y2_0 = y_n
    plotTwo.push({x: x2_0, y: y2_0});
    x2_1 = x1_1
    y2_1 = y2_0
    plotTwo.push({x: x2_1, y: y2_1});
    x2_2 = x1_2
    y2_2 = y2_0
    plotTwo.push({x: x2_2, y: y2_2});
    x2_3 = x1_3-x2_0
    y2_3 = y2_0
    plotTwo.push({x: x2_3, y: y2_3});

     //Now set up all the graphing data.
    //We use the amazing Open Source Chart.js, https://www.chartjs.org/
    //A lot of the sophistication is addressed directly here
    //But if you need something more, read the Chart.js documentation or search Stack Overflow

    //Usually we can put these directly into the graph data
    //But they depend on the setup in this example
    let plotData = [], lineLabels = [], isFilled = [], isStraight = []

    plotData.push(plotOne);
    lineLabels.push('Channel');
    isFilled.push(false);
    isStraight.push(true);

    plotData.push(plotTwo);
    lineLabels.push('Water level');
    isFilled.push(false);
    isStraight.push(true);

    //Some demo text to show it's possible
    let inText = []
    //yp=0 is bottom, 100 is top
    if(sec_props.num_itts > 10) {
        let label = "Number of iterations: " + sec_props.num_itts
        inText.push({txt: label, xp: 95, yp: 100, fontSize: 15, fillStyle: 'gray', bold: false})
    }

   //Now set up all the graphing data detail by detail.
    const prmap = {
        plotData: plotData, //An array of 1 or more datasets
        lineLabels: lineLabels, //An array of labels for each dataset
        hideLegend: false, //Set to true if you don't want to see any labels/legnds.
        xLabel: 'x, distance&m', //Label for the x axis, with an & to separate the units
        yLabel: 'y, depth&m', //Label for the y axis, with an & to separate the units
        y2Label: null, //Label for the y2 axis, null if not needed
        yAxisL1R2: [], //Array to say which axis each dataset goes on. Blank=Left=1
        logX: false, //Is the x-axis in log form?
        xTicks: undefined, //We can define a tick function if we're being fancy
        logY: false, //Is the y-axis in log form?
        yTicks: undefined, //We can define a tick function if we're being fancy
        legendPosition: 'top', //Where we want the legend - top, bottom, left, right
        xMinMax: [,], //Set min and max, e.g. [-10,100], leave one or both blank for auto
        yMinMax: [,], //Set min and max, e.g. [-10,100], leave one or both blank for auto
        y2MinMax: [,], //Set min and max, e.g. [-10,100], leave one or both blank for auto
        xSigFigs: 'F1', //These are the sig figs for the Tooltip readout. A wide choice!
        ySigFigs: 'F3', //F for Fixed, P for Precision, E for exponential
        inText: inText, //See the code for what this does
        isFilled: isFilled,
        isStraight: isStraight
    };
   

   //Now we return everything - text boxes, plot and the name of the canvas, which is 'canvas' for a single plot
   return {
        normal_depth: sec_props.y,//.toFixed(3),
        area: sec_props.A, //.toPrecision(3),
        section_props: sec_props,
        plots: [prmap],
        canvas: ['canvas'],
    };
}

