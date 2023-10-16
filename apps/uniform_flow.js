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
        //logVal: sliders.SlideLog.value,
        //multiplier: parseFloat(document.getElementById('Multiplier').value),
        //useOne: document.getElementById('Equ1').checked, //No need to check Equ2!
        useBoth: true //document.getElementById('Both').checked,
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

    //You might have some other stuff to do here, but for most apps that's it for Main!
}

//Here's the app calculation
//The inputs are just the names provided - their order in the curly brackets is unimportant!
//By convention the input values are provided with the correct units within Main
function CalcIt({linVal_Q, linVal_n, linVal_b, linVal_s, linVal_So, multiplier, useOne, useBoth}) {


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

    /*
    for(let i = 0; i <= 4; i++) {
        xval = i;
        y1 = linVal_Q;
        y2 = linVal_n;
        //All graph data consists of x:xval, y:yval pairs in curly brackets
        //Pushed onto the plot data
        plotOne.push({x: xval, y: y1});
        plotTwo.push({x: xval, y: y2});
    }
    */
    
     //Now set up all the graphing data.
    //We use the amazing Open Source Chart.js, https://www.chartjs.org/
    //A lot of the sophistication is addressed directly here
    //But if you need something more, read the Chart.js documentation or search Stack Overflow

    //Usually we can put these directly into the graph data
    //But they depend on the setup in this example
    let plotData = [], lineLabels = [], isFilled = [], isStraight = []
    //Code to set up the variables to go into the plot
    if (useBoth) {
        plotData.push(plotOne);
        lineLabels.push('Channel');
        isFilled.push(false);
        isStraight.push(true);

        plotData.push(plotTwo);
        lineLabels.push('Water level');
        isFilled.push(false);
        isStraight.push(true);
      } else {
        if (useOne) {
            plotData.push(plotOne);
            lineLabels.push('Channel');
        } else {
            plotData.push(plotTwo);
            lineLabels.push('Water level');
        }
    }

   //Now set up all the graphing data detail by detail.
    const prmap = {
        plotData: plotData, //An array of 1 or more datasets
        lineLabels: lineLabels, //An array of labels for each dataset
        hideLegend: false, //Set to true if you don't want to see any labels/legnds.
        xLabel: 'x, width&m', //Label for the x axis, with an & to separate the units
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
        xSigFigs: 'F0', //These are the sig figs for the Tooltip readout. A wide choice!
        ySigFigs: 'F0', //F for Fixed, P for Precision, E for exponential
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


// Secant method for mannings equation
function f(y, Q, n, So, b, s)
{
    // we are using the mannin'g equation for a trapezoidal channel
	let A = (b+s*y)*y
	let P = b+2*y*Math.sqrt(1+s*s)
	let R = A/P
	
	let f = A * Math.pow(R, 2/3) * Math.sqrt(So)/n
	f = Q-f
    
	return f;
}

function secant_manning(x1, x2, tolerance, Q, n, So, b, s)
{
    let i = 0, xm, x0, c;
	let i_max = 20
	
        do {
            // calculate the intermediate value
			let f1 = f(x1, Q, n, So, b, s)
			let f2 = f(x2, Q, n, So, b, s)
			
			let dx = f2*(x2-x1)/(f2-f1) 
			x0 = x2-dx
 

 
            // if x0 is the root of equation then break the loop
			if (Math.abs(dx) < tolerance)
				break;
			
			            // update the value of interval
            x1 = x2;
            x2 = x0;
            // update number of iteration
            i++;
        } while (i < i_max); // repeat the loop
                                // until the convergence
		if(i >= i_max)
		{
			console.log("Possible non-convergence: Max number of iterations exceeded = " + n );
		}


        let sec_props = get_trap_section_props(x0, Q, n, So, b, s)

		return sec_props
        
}

function get_trap_section_props(y, Q, n, So, b, s)
{
    let A = (b+s*y)*y
    let P = b+2*y*Math.sqrt(1+s*s)
    let R = A/P

    let B = b+2*s*y
    let Dm = A/B

    let g = 9.81

    let Fr = Q/A/Math.sqrt(g*Dm)

    return {y: y, Q: Q, A: A, P: P, R: R, B: B, Dm: Dm, Fr: Fr}
}
