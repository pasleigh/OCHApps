//One universal basic required here to get things going once loaded
window.onload = function () {
    //We need to set up buttons in this onload section
    document.getElementById('Load').addEventListener('click', clearOldName, false);
    document.getElementById('Load').addEventListener('change', handleFileSelect, false);
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
        linVal: sliders.SlideLin.value,
        logVal: sliders.SlideLog.value,
        multiplier: parseFloat(document.getElementById('Multiplier').value),
        useOne: document.getElementById('Equ1').checked, //No need to check Equ2!
        useBoth: document.getElementById('Both').checked,
    };

    //Send inputs off to CalcIt where the names are instantly available
    //Get all the resonses as an object, result
    const result = CalcIt(inputs);

    //Set all the text box outputs
    document.getElementById('First').value = result.first;
    document.getElementById('Second').value = result.second;
    document.getElementById('Data').value = result.data;
    //Do all relevant plots by calling plotIt - if there's no plot, nothing happens
    //plotIt is part of the app infrastructure in app.new.js
    if (result.plots) {
        for (let i = 0; i < result.plots.length; i++) {
            plotIt(result.plots[i], result.canvas[i]);
        }
    }

    //You might have some other stuff to do here, but for most apps that's it for Main!
}
//We're being lazy and making these global
let plotOne = [], plotTwo = [], fromFile = false;

//Here's the app calculation
//The inputs are just the names provided - their order in the curly brackets is unimportant!
//By convention the input values are provided with the correct units within Main
function CalcIt({ linVal, logVal, multiplier, useOne, useBoth }) {
    //Now we create some plots
    if (!fromFile) {
        plotOne=[];plotTwo=[]
        let xval, y1, y2;
        for (let i = 0; i <= 100; i++) {
            xval = 3 * i;
            y1 = multiplier * linVal * Math.sin(logVal * xval / 50);
            y2 = multiplier * linVal * Math.cos(logVal * xval / 50);
            //All graph data consists of x:xval, y:yval pairs in curly brackets
            //Pushed onto the plot data
            plotOne.push({ x: xval, y: y1 });
            plotTwo.push({ x: xval, y: y2 });
        }
    }
    fromFile=false
    //Now set up all the graphing data.
    //We use the amazing Open Source Chart.js, https://www.chartjs.org/
    //A lot of the sophistication is addressed directly here
    //But if you need something more, read the Chart.js documentation or search Stack Overflow

    //Usually we can put these directly into the graph data
    //But they depend on the setup in this example
    let plotData = [], lineLabels = []
    //Code to set up the variables to go into the plot
     if (useBoth) {
        plotData.push(plotOne);
        lineLabels.push('First');
        plotData.push(plotTwo);
        lineLabels.push('Second');
    } else {
        if (useOne) {
            plotData.push(plotOne);
            lineLabels.push('First');
        } else {
            plotData.push(plotTwo);
            lineLabels.push('Second');
        }
    }
    let outText="" //Just a quick demo of a textArea
     for (let i=0;i<plotData.length;i++){
        for (let j=0;j<plotData[i].length;j++){
             outText+=plotData[i][j].x+", "+parseFloat(plotData[i][j].y).toPrecision(3)+"\n"
        }
    }
    //Now set up all the graphing data detail by detail.
    const prmap = {
        plotData: plotData, //An array of 1 or more datasets
        lineLabels: lineLabels, //An array of labels for each dataset
        hideLegend: false, //Set to true if you don't want to see any labels/legnds.
        xLabel: 'x values&x-units', //Label for the x axis, with an & to separate the units
        yLabel: 'y values&y-units', //Label for the y axis, with an & to separate the units
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
        xSigFigs: 'F0', //These are the sig figs for the Tooltip readout. A wide choice!
        ySigFigs: 'F0', //F for Fixed, P for Precision, E for exponential
    };


    //Now we return everything - text boxes, plot and the name of the canvas, which is 'canvas' for a single plot
    return {
        first: linVal.toFixed(1),
        second: logVal.toPrecision(3),
        data: outText,
        plots: [prmap],
        canvas: ['canvas'],
    };
}

//File handling stuff
function clearOldName() { //This is needed because otherwise you can't re-load the same file name!
    document.getElementById('Load').value = ""
}
function handleFileSelect(evt) {
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = function (e) {
            var data = e.target.result;
            LoadData(data)
        }
        r.readAsText(f);
    } else {
        return;
    }
}

//Load data from a chosen file
function LoadData(S) {
    Papa.parse(S, {
        download: false,
        header: true,
        skipEmptyLines: true,
        complete: papaCompleteFn,
        error: papaErrorFn
    })
}
function papaErrorFn(error, file) {
    console.log("Error:", error, file)
}
function papaCompleteFn() {
    var theData = arguments[0]
    if (theData.data.length < 3) return //Not a valid data file
    plotOne = []; plotTwo = []
    for (i = 0; i < theData.data.length; i++) {
        theRow = theData.data[i]
        plotOne.push({ x: theRow.x, y: theRow.y1 })
        plotTwo.push({ x: theRow.x, y: theRow.y2 })
    }
    fromFile=true
    Main()
}
