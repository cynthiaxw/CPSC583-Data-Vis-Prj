/**
 * Call our functions on window load event
 */
window.onload = function(){
    setupVis1();
};

/**
 * Global variables
 */
var _vis1;       // The visualization

var SpiralPlot = function(){
    this.data;  // the data subset to present
    this.width = 800;
    this.height = 800;
    this.margin = {top:50, bottom:50, left:50, right:50};
    this.start = 2.2;
    this.end = 0;
    this.spiralNum = 3;
    var spiralNum = this.spiralNum;
    this.svgContainer;
    this.minRadius = 60;

    this.theta = function(r) {
        return spiralNum * Math.PI * r;
    };

    this.r;
    this.radius;
    this.spiral;
    this.path;
    this.points;

    this.yScale;
    this.xScale;
    this.spiralLength

    this.setSpiral = function(){
        // set svg attributes
        this.svgContainer = this.svgContainer
            .attr("width", this.width + this.margin.right + this.margin.left)
            .attr("height", this.height + this.margin.left + this.margin.right)
            .append("g")
            .attr('id', "g-vis")
            .attr("transform", "translate(" + 500 + "," + 450 +")");

        this.r = d3.min([this.width, this.height])/2-this.minRadius;

        this.radius = d3.scaleLinear()
            .domain([this.start, this.end])
            .range([this.minRadius, this.r]);

        this.spiral = d3.radialLine()
            .curve(d3.curveCardinal)
            .angle(this.theta)
            .radius(this.radius);

        var points = d3.range(this.start, this.end + 0.001, (this.end-this.start)/1000);

        var path = this.svgContainer.append("path")
            .datum(points)
            .attr("id", "spiral")
            .attr("d", this.spiral)
            .style("fill", "none")
            .style("stroke", "steelblue");

        var spiralLength = path.node().getTotalLength(),
            N = this.data.length-1,
            barWidth = (spiralLength/N) - 1;

        var xScale = d3.scaleBand()
            .domain(this.data.map(function(d){
                return d['Country/Region'];
            }))
            .range([0,spiralLength]);

        console.log("min: " + d3.min(this.data, function(d){
            if(d['Mean years of schooling'] !== "")
                return +d['Mean years of schooling'];
        }));
        console.log("max: " + d3.max(this.data, function(d){
            return +d['Mean years of schooling'];
        }));

        var yScale = d3.scaleLinear()
            .domain([0,d3.max(this.data, function(d){
                return +d['Mean years of schooling'];
            })])
            .range([2, 50]);

        var colorScale = d3.scaleQuantize()
            .domain([d3.min(this.data, function(d){
                if(d['Share of education in governmental expenditure (%)'] !== "")
                    return +d['Share of education in governmental expenditure (%)'];
            }), d3.max(this.data, function(d){
                return +d['Share of education in governmental expenditure (%)'];
            })])
            .range(colorbrewer.PuBuGn[9]);

        this.svgContainer.selectAll("rect")
            .data(this.data)
            .enter()
            .append("rect")
            .attr("x", function(d, i){
                var linePer = xScale(d['Country/Region']),
                    posOnLine = path.node().getPointAtLength(linePer),
                    angleOnLine = path.node().getPointAtLength(linePer - barWidth);

                d.linePer = linePer;
                d.x = posOnLine.x;
                d.y = posOnLine.y;
                d.a = (Math.atan2(angleOnLine.y, angleOnLine.x) * 180/Math.PI) - 90;

                return d.x;
            })
            .attr("y", function(d){
                return d.y;
            })
            .attr("width", function(d){
                return barWidth;
            })
            .attr("height", function(d){
                return yScale(d['Mean years of schooling']);
            })
            .style("fill", function(d){
                // return d3.interpolateSpectral(colorScale(d['Share of education in governmental expenditure (%)']));
                if(d['Share of education in governmental expenditure (%)'] !== "")
                    return colorScale(d['Share of education in governmental expenditure (%)']);
                else return "#666666";
            })
            .style("stroke", "grey")
            .style("stroke-width", "1px")
            .attr("transform", function(d){
                return `rotate(${d.a},${d.x},${d.y})`;
            });

        var cnt = 0;
        // Add text
        this.svgContainer.selectAll("text")
            .data(this.data)
            .enter()
            .append("text")
            .attr("dy", -5)
            .style("text-anchor", "start")
            .style("font", "10px arial")
            .append("textPath")
            // only add for the first of each month
            .filter(function(d){
                if(cnt === 0){
                    d.labelFlg = true;
                }else d.labelFlg = false;
                if(cnt++ % 18 === 0 || cnt === 213)return true;
                return false;
            })
            .text(function(d){
                if(d.labelFlg === true){
                    return "Literacy rate";
                }
                else return (d['Literacy rate(%)'] + "%");
            })
            // place text along spiral
            .attr("xlink:href", "#spiral")
            .style("fill", "dark-grey")
            .attr("startOffset", function(d){
                return ((d.linePer / spiralLength) * 100) + "%";
            });

        var x0 = 500,
            y0 = -250;
        var legend1 = [];
        var min_val = d3.min(this.data, function(d){
            if(d['Share of education in governmental expenditure (%)'] !== "")
                return +d['Share of education in governmental expenditure (%)'];
        }),
            max_val = d3.max(this.data, function(d){
            return +d['Share of education in governmental expenditure (%)'];
        });
        for(let i=0; i<9; i++){
            legend1.push({
                value: i,
                pos: [x0, y0+i*30],
                t: (i * (max_val - min_val)/10).toFixed(2) + "~" +
                    ((i+1) * (max_val - min_val)/10).toFixed(2)
            });
        }
        legend1.push({value:-1, pos:[x0, y0+270], t:"Not Available"});
        //legend group
        d3.select("#v11_svg")
            .append("g")
            .attr("class", "legend1")
            .attr("transform", "translate(" + 500 + "," + 450 +")");

        d3.select('.legend1')
            .selectAll("rect")
            .data(legend1)
            .enter()
            .append("rect")
            .attr("x", function(d){
                return d.pos[0];
            })
            .attr("y", function(d){
                return d.pos[1];
            })
            .attr("height", 20)
            .attr("width", 30)
            .style("fill", function(d){
                console.log(d.value + ": " + colorbrewer.PuBuGn[9][d.value])
                if(d.value === -1){
                    return "#666666";
                }
                else return colorbrewer.PuBuGn[9][d.value];
            })
            .style("stroke", "grey")
            .style("stroke-width", "1px");

        d3.select('.legend1')
            .selectAll("text")
            .data(legend1)
            .enter()
            .append("text")
            .attr("x", function(d){
                return d.pos[0] + 40;
            })
            .attr("y", function(d){
                return d.pos[1] + 15;
            })
            .text(function(d){
                return d.t;
            });

        d3.select('.legend1')
            .append("text")
            .attr("x", x0-5)
            .attr("y", y0-40)
            .text("Share of education in");
        d3.select('.legend1')
            .append("text")
            .attr("x", x0-5)
            .attr("y", y0-20)
            .text("government expenditure");


        // Interaction
        var popUp = d3.select("#div_visuals")
            .append('div')
            .attr('class', 'tooltip');
        popUp.append('div')
            .attr('class','dx');
        popUp.append('div')
            .attr('class','country');
        popUp.append('div')
            .attr('class', 'literacy');
        popUp.append('div')
            .attr('class', 'schooling');
        popUp.append('div')
            .attr('class', 'expenditure');

        d3.select("#g-vis")
            .selectAll("rect")
            .on('mouseover', function(d){
                popUp.select('.dx').html("Country/Region: <b>" + d.x + "</b>");
                popUp.select('.country').html("Country/Region: <b>" + d['Country/Region'] + "</b>");
                popUp.select('.literacy').html("Literacy rate: <b>" + d['Literacy rate(%)'] + "%</b>");
                popUp.select('.schooling').html("Mean Year of Schooling: <b>" + d['Mean years of schooling'] + "years</b>");
                popUp.select('.expenditure').html("Share of education in governmental expenditure: <b>" + d['Share of education in governmental expenditure (%)'] + "%</b>");

                d3.select(this)
                    .style("fill", "#FFFFFF")
                    .style("stroke", "#000000")
                    .style("stroke-width", "2px");

                popUp.style('display', 'block');
                popUp.style('opacity', 2);
            })
            .on('mousemove', function(d){
                popUp.style('top', (d3.event.layerY + 10) + 'px')
                    .style('left', (d3.event.layerX - 25) + 'px');
            })
            .on('mouseout', function(d){
                d3.select("#g-vis")
                    .selectAll("rect")
                    .style("fill", function(d){
                        // return d3.interpolateSpectral(colorScale(d['Share of education in governmental expenditure (%)']));
                        if(d['Share of education in governmental expenditure (%)'] !== "")
                            return colorScale(d['Share of education in governmental expenditure (%)']);
                        else return "#666666";
                    })
                    .style("stroke", "grey")
                    .style("stroke-width", "1px");

                popUp.style('display', 'none');
                popUp.style('opacity', 0);
            });
    }

}

function setupVis1() {
    _vis11 = new SpiralPlot();
    _vis11.svgContainer = d3.select("#v11_svg");

    loadData("worldwide-literacy.csv");
}

function loadData(path) {
    d3.csv(path).then(function(data){
        _vis11.data = data;
        console.log(_vis11.data);
        _vis11.setSpiral();
    })
}


function setupVis2() {

}
