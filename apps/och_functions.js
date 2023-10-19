
// Secant method for Manning's equation
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

function secant_manning(y1, y2, tolerance, Q, n, So, b, s)
{
    let i = 0, y0
    let i_max = 20

    do {
        // calculate the intermediate value
        let f1 = f(y1, Q, n, So, b, s)
        let f2 = f(y2, Q, n, So, b, s)

        let dy = f2*(y2-y1)/(f2-f1)
        y0 = y2-dy

        // if x0 is the root of equation then break the loop
        if (Math.abs(dy) < tolerance)
            break;

        // update the value of interval
        y1 = y2;
        y2 = y0;
        // update number of iterations
        i++;
    } while (i < i_max); // repeat the loop until the convergence

    if(i >= i_max)
    {
        console.log("Possible non-convergence: Max number of iterations exceeded = " + i );
    }


    let sec_props = get_trap_section_props(y0, Q, n, So, b, s)
    sec_props.num_itts = i
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

function f_cubic(A, B, C, D, y)
{
    let f_cubic = A * y * y * y + B * y * y + C * y + D
    return f_cubic
}

function SecantCubic(A , B , C , D, error , num , y0 , y1, debug) {
    let y2 = (y0 + y1) / 2

    let step = 1
    let Condition = true

    let i = 0
    while(Condition){

        let f0 = f_cubic(A, B, C, D, y0)
        let f1 = f_cubic(A, B, C, D, y1)

        if (debug > 0){
            console.log(`SecantCubic: ${i} y0=${y0} f0=${f0}`)
            console.log(`SecantCubic: ${i} y1=${y1} f1=${f1}`)
        }

        if (f0 === f1){
            msg = "Divide by zero"
            console.log(msg)
            break
        }

        y2 = y0 - f0 * (y1 - y0) / (f1 - f0)
        let f2 = f_cubic(A, B, C, D, y2)
        if (debug > 0){
            console.log(`SecantCubic: ${i} y2=${y2} f2=${f2}`)
        }
        y0 = y1
        y1 = y2

        step = step + 1

        if(step > num){
            msg = "not convergent"
            console.log(msg)
            Condition = false
        }


        if (Math.abs(f2) < error) {
            // SUCCESS
            Condition = false
        }

        i = i + 1
    }
    return y2
}

function GetHighestCubicDepth(A, B, C, D, error, num, y_low, y_high, num_intervals, debug) {
    // steps from y_high to y_low to find first solution
    let dx = (y_high - y_low) / num_intervals
    let y0 = y_high

    let root = -1

    for (let i = 0; i<num_intervals; i++){
        let y1 = y0 - dx
        let f0 = f_cubic(A, B, C, D, y0)
        let f1 = f_cubic(A, B, C, D, y1)

        if (debug > 1){
            console.log(`HighestCubicDepth: y0=${y0} f0=${f0} y1=${y1} f1=${f1}` )
        }

        if (f0 * f1 < 0){
            //# solution between y0 and y1
            root = SecantCubic(A, B, C, D, error, num, y0, y1, debug)
            break
        }

        y0 = y1
    }

    return root
}

function GetPositiveCubicDepths(A, B, C, D, error, num, y_low, y_high, num_intervals, debug) {
    // steps from y_high to y_low to find first solution
    let dx = (y_high - y_low) / num_intervals
    let y0 = y_high

    let roots = []

    for( let i = 0 ; i < num_intervals; i++)
    {
        let root = -1

        let y1 = y0 - dx
        let f0 = f_cubic(A, B, C, D, y0)
        let f1 = f_cubic(A, B, C, D, y1)

        if (debug > 1){
            console.log(`GetPositiveCubicDepths: y0=${y0} f0=${f0} y1=${y1} f1=${f1}`)
        }

        if (f0 * f1 < 0){
            // solution between y0 and y1
            root = SecantCubic(A, B, C, D, error, num, y0, y1, debug)
            roots.push(root)
        }
    
        y0 = y1
    }
    return roots
}

function TestSecantEnergyFunctions(){
    //#------------------------------
    //# Here is the example problem
    //  #------------------------------
    let A = 1
    let B = -1.18
    let C = 0
    let D = 0.204

    let tolerance = 0.0001
    let max_iterations = 10
    let debug = 0

    let y1 = -0.4
    let y2 = 0
    y2 = SecantCubic(A , B , C , D, tolerance , max_iterations , y1 , y2, debug)
    console.log(`Solution 1 is: y = ${y2}`)


    y1 = 0.5
    y2 = 0.7
    y2 = SecantCubic(A , B , C , D, tolerance , max_iterations , y1 , y2, debug)
    console.log(`Solution 2 is: y = ${y2}`)


    y1 = 1.0
    y2 = 2
    y2 = SecantCubic(A , B , C , D, tolerance , max_iterations , y1 , y2, debug)
    console.log(`Solution 3 is: y = ${y2}`)

    let y_low = 0
    let y_high = 2
    let num_intervals = 30

    y2 = GetHighestCubicDepth(A,B,C,D,tolerance,max_iterations,y_low,y_high, num_intervals,debug)
    console.log(`The highest solution to this cubic is: y = ${y2}`)

    debug = 2
    positive_roots = GetPositiveCubicDepths(A,B,C,D,tolerance,max_iterations,y_low,y_high, num_intervals,debug)
    //console.log(positive_roots)
    for(let i=0; i < positive_roots.length; i++){
        let root = positive_roots[i]
        console.log(`Positive solution ${i} to this cubic is: y = ${root}`)
    }

}