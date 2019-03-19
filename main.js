/**
 * Call our functions on window load event
 */
window.onload = function(){
    setupVis1();
    setupVis2();
    setupVis3();
};

var SpiralPlot = function(){
    this.data;  // the data subset to present
    this.width = WIDTH;
    this.height = HEIGHT;
    this.margin = MARGIN;
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
            .attr("transform", "translate(" + 500 + "," + 470 +")");

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

        var yScale = d3.scaleLinear()
            .domain([0,15])
            .range([2, 70]);

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
            .attr("x", function(d){
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
            .attr("font-weight", function(d){
                if(d.labelFlg === true){
                    return "bold";
                }
                else return "normal";
            })
            .attr("font-size", function(d){
                if(d.labelFlg === true){
                    return "14px";
                }
                else return "10px";
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
                t: Math.round(i * (max_val - min_val)/9)+ "~" +
                    Math.round((i+1) * (max_val - min_val)/9)
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
                return d.t + " %";
            });

        d3.select('.legend1')
            .append("text")
            .attr("x", x0-20)
            .attr("y", y0-40)
            .text("Share of education in")
            .attr("font-weight", "bold");
        d3.select('.legend1')
            .append("text")
            .attr("x", x0-20)
            .attr("y", y0-20)
            .text("government expenditure")
            .attr("font-weight", "bold");

        var yAxis = d3.axisLeft(yScale)
            .tickValues([0, 5, 10, 15]);

        var legend2 = d3.select("#v11_svg")
            .append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + 505 + "," + 57 +")")
            .style("dominant-baseline", "central")
            .call(yAxis);

        legend2.select("path").attr("marker-end", "url(#arrowhead)");

        d3.select("#v11_svg")
            .append("g")
            .attr("id", "#legend2-text")
            .attr("transform", "translate(" + 500 + "," + 450 +")");
        var x1 = -20,
            y1 = y0-150;
        d3.select('.legend1')
            .append("text")
            .attr("x", x1)
            .attr("y", y1)
            .text("Mean year of schooling (years)")
            .attr("font-weight", "bold");
        d3.select('.legend1')
            .append("text")
            .attr("x", x1-77)
            .attr("y", y1 + 81)
            .style("font-size", 12)
            .text("Not Available");
        d3.select('.legend1')
            .append("text")
            .attr("x", x1-5)
            .attr("y", y1 + 59)
            .style("font-size", 12)
            .text("5");
        d3.select('.legend1')
            .append("text")
            .attr("x", x1-5)
            .attr("y", y1 + 37)
            .style("font-size", 12)
            .text("10");
        d3.select('.legend1')
            .append("text")
            .attr("x", x1-5)
            .attr("y", y1 + 15)
            .style("font-size", 12)
            .text("15");



        // Interaction
        var popUp = d3.select("#div_visuals")
            .append('div')
            .attr('class', 'tooltip');
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
                popUp.select('.country').html("Country/Region: <b>" + d['Country/Region'] + "</b>");
                popUp.select('.literacy').html("Literacy rate: <b>" + d['Literacy rate(%)'] + "%</b>");
                if(d['Mean years of schooling'] === "") popUp.select('.schooling').html("Mean Year of Schooling: <b>Not Available</b>");
                else popUp.select('.schooling').html("Mean Year of Schooling: <b>" + d['Mean years of schooling'] + " years</b>");
                if(d['Share of education in governmental expenditure (%)'] === "")popUp.select('.expenditure').html("Share of education in governmental expenditure: <b>Not Available</b>");
                else popUp.select('.expenditure').html("Share of education in government expenditure: <b>" + d['Share of education in governmental expenditure (%)'] + "%</b>");

                var bgd_color = "#666666";
                if(d['Share of education in governmental expenditure (%)'] !== ""){
                    bgd_color = colorScale(d['Share of education in governmental expenditure (%)']);
                }
                popUp.style("background", bgd_color);

                d3.select(this)
                    .style("fill", "#FFFFFF")
                    .style("stroke", "#000000")
                    .style("stroke-width", "2px");

                popUp.style('display', 'block');
                popUp.style('opacity', 0.8);
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
    // loadData("worldwide-literacy.csv");
    d3.csv("worldwide-literacy.csv").then(function(data){
        _vis11.data = data;
        console.log(_vis11.data);
        _vis11.setSpiral();
    })
}


/**
 * Global variables
 */
const WIDTH = 800;
const HEIGHT = 800;
const MARGIN = {top:50, bottom:50, left:50, right:50};
const start = 2.2,
    end = 0,
    spiralNum = 3,
    minRadius = 60;

theta = function(r) {
    return spiralNum * Math.PI * r;
};

function setSpiral2(data){  // variation 2

    // set svg attributes
    var svg = d3.select('#v12_svg')
        .attr("width", WIDTH + MARGIN.right + MARGIN.left)
        .attr("height", HEIGHT + MARGIN.right + MARGIN.left)
        .append("g")
        .attr('id', "g-vis2")
        .attr("transform", "translate(500,470)");

    // draw the plain spiral
    var r = d3.min([WIDTH, HEIGHT])/2-minRadius;
    var radius = d3.scaleLinear()
        .domain([start, end])
        .range([minRadius, r]);

    var spiral = d3.radialLine()
        .curve(d3.curveCardinal)
        .angle(theta)
        .radius(radius);

    points = d3.range(start, end + 0.001, (end-start)/1000);

    var path = svg.append("path")
        .datum(points)
        .attr("id", "spiral2")
        .attr("d", spiral)
        .style("fill", "none")
        .style("stroke", "steelblue");

    // set scales
    var spiralLength = path.node().getTotalLength(),
        N = data.length-1,
        barWidth = (spiralLength/N) - 1;

    var xScale = d3.scaleBand()
        .domain(data.map(function(d){
            return d['Country/Region'];
        }))
        .range([0,spiralLength]);

    var yScale = d3.scaleLinear()
        .domain([0,15])
        .range([2, 70]);

    var colorScale = d3.scaleQuantize()
        .domain([d3.min(data, function(d){
            if(d['Share of education in governmental expenditure (%)'] !== "")
                return +d['Share of education in governmental expenditure (%)'];
        }), d3.max(data, function(d){
            return +d['Share of education in governmental expenditure (%)'];
        })])
        .range(colorbrewer.PuBuGn[9]);


    // bind data to the spiral
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "vis2_rect")
        .attr("x", function(d){
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
            /* Variation 2: change the rectangle to point inwards*/
            if(d['Mean years of schooling'] == ""){
                return d.y - 20;
            }
            else return d.y;
        })
        .attr("width", function(d){
            return barWidth;
        })
        .attr("height", function(d){
            /* Variation 2: change the rectangle to point inwards*/
            if(d['Mean years of schooling'] == ""){
                return 20;
            }
            else return yScale(d['Mean years of schooling']);
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
    svg.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("dy", -25)
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
        .attr("font-weight", function(d){
            if(d.labelFlg === true){
                return "bold";
            }
            else return "normal";
        })
        .attr("font-size", function(d){
            if(d.labelFlg === true){
                return "12px";
            }
            else return "10px";
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
    var min_val = d3.min(data, function(d){
            if(d['Share of education in governmental expenditure (%)'] !== "")
                return +d['Share of education in governmental expenditure (%)'];
        }),
        max_val = d3.max(data, function(d){
            return +d['Share of education in governmental expenditure (%)'];
        });

    for(let i=0; i<9; i++){
        legend1.push({
            value: i,
            pos: [x0, y0+i*30],
            t: Math.round(i * (max_val - min_val)/9)+ "~" +
                Math.round((i+1) * (max_val - min_val)/9)
        });
    }
    legend1.push({value:-1, pos:[x0, y0+270], t:"Not Available"});
    //legend group
    d3.select("#v12_svg")
        .append("g")
        .attr("class", "legend21")
        .attr("transform", "translate(" + 500 + "," + 450 +")");

    d3.select('.legend21')
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
            if(d.value === -1){
                return "#666666";
            }
            else return colorbrewer.PuBuGn[9][d.value];
        })
        .style("stroke", "grey")
        .style("stroke-width", "1px");

    d3.select('.legend21')
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
            return d.t + " %";
        });

    d3.select('.legend21')
        .append("text")
        .attr("x", x0-20)
        .attr("y", y0-40)
        .text("Share of education in")
        .attr("font-weight", "bold");
    d3.select('.legend21')
        .append("text")
        .attr("x", x0-20)
        .attr("y", y0-20)
        .text("government expenditure")
        .attr("font-weight", "bold");


    // draw axis
    var yAxisScale = d3.scaleLinear()
        .domain([15,0])
        .range([0, 70]);
    var yAxis = d3.axisLeft(yAxisScale)
        .tickValues([0,5,10,15]);

    var legend22 = d3.select("#v12_svg")
        .append("g")
        .attr("class", "axis2")
        .attr("transform", "translate(" + 505 + "," + 60 +")")
        .style("dominant-baseline", "central")
        .call(yAxis)
        .attr("stroke", "black")
        .attr("fill", "grey");

    legend22.select("path").attr("marker-end", "url(#arrowhead)");

    var x1 = -20,
        y1 = y0-150;
    d3.select('.legend21')
        .append("text")
        .attr("x", x1)
        .attr("y", y1)
        .text("Mean year of schooling (years)")
        .attr("font-weight", "bold");
    d3.select('.legend21')
        .append("text")
        .attr("x", x1-70)
        .attr("y", y1 + 100)
        .style("font-size", 12)
        .text("Not Available");


    // Interaction
    var popUp = d3.select(".tooltip");

    d3.select("#g-vis2")
        .selectAll(".vis2_rect")
        .on('mouseover', function(d){
            popUp.select('.country').html("Country/Region: <b>" + d['Country/Region'] + "</b>");
            popUp.select('.literacy').html("Literacy rate: <b>" + d['Literacy rate(%)'] + "%</b>");
            if(d['Mean years of schooling'] === "") popUp.select('.schooling').html("Mean Year of Schooling: <b>Not Available</b>");
            else popUp.select('.schooling').html("Mean Year of Schooling: <b>" + d['Mean years of schooling'] + " years</b>");
            if(d['Share of education in governmental expenditure (%)'] === "")popUp.select('.expenditure').html("Share of education in governmental expenditure: <b>Not Available</b>");
            else popUp.select('.expenditure').html("Share of education in government expenditure: <b>" + d['Share of education in governmental expenditure (%)'] + "%</b>");

            var bgd_color = "#666666";
            if(d['Share of education in governmental expenditure (%)'] !== ""){
                bgd_color = colorScale(d['Share of education in governmental expenditure (%)']);
            }
            popUp.style("background", bgd_color);

            d3.select(this)
                .style("fill", "#FFFFFF")
                .style("stroke", "#000000")
                .style("stroke-width", "2px");

            popUp.style('display', 'block');
            popUp.style('opacity', 0.8);
        })
        .on('mousemove', function(d){
            popUp.style('top', (d3.event.layerY + 10) + 'px')
                .style('left', (d3.event.layerX - 25) + 'px');
        })
        .on('mouseout', function(d){
            d3.select("#g-vis2")
                .selectAll(".vis2_rect")
                .style("fill", function(d){
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

function setupVis2() {
    d3.csv("worldwide-literacy.csv").then(function(data){
        setSpiral2(data);
    })
}

function setSpiral3(data){

    // set svg attributes
    var svg = d3.select('#v13_svg')
        .attr("width", WIDTH + MARGIN.right + MARGIN.left)
        .attr("height", HEIGHT + MARGIN.right + MARGIN.left)
        .append("g")
        .attr('id', "g-vis3")
        .attr("transform", "translate(500,470)");

    // draw the plain spiral
    var r = d3.min([WIDTH, HEIGHT])/2-minRadius;
    var radius = d3.scaleLinear()
        .domain([start, end])
        .range([minRadius, r]);

    var spiral = d3.radialLine()
        .curve(d3.curveCardinal)
        .angle(theta)
        .radius(radius);

    points = d3.range(start, end + 0.001, (end-start)/1000);

    var path = svg.append("path")
        .datum(points)
        .attr("id", "spiral3")
        .attr("d", spiral)
        .style("fill", "none")
        .style("stroke", "steelblue");

    // set scales
    var spiralLength = path.node().getTotalLength(),
        N = data.length-1,
        barWidth = (spiralLength/N) - 1;

    var xScale = d3.scaleBand()
        .domain(data.map(function(d){
            return d['Country/Region'];
        }))
        .range([0,spiralLength]);

    var yScale = d3.scaleLinear()
        .domain([0,15])
        .range([0, 60]);

    var colorScale = d3.scaleQuantize()
        .domain([d3.min(data, function(d){
            if(d['Share of education in governmental expenditure (%)'] !== "")
                return +d['Share of education in governmental expenditure (%)'];
        }), d3.max(data, function(d){
            return +d['Share of education in governmental expenditure (%)'];
        })])
        .range(colorbrewer.PuBuGn[9]);


    // Add background color to the rectangle
    svg.append('g')
        .attr("id", "g_vis3_bgd");

    d3.select("#g_vis3_bgd")
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "vis3_rect_bgd")
        .attr("x", function(d){
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
            return 60;
        })
        .style("fill", function(d){
            // return d3.interpolateSpectral(colorScale(d['Share of education in governmental expenditure (%)']));
            if(d['Share of education in governmental expenditure (%)'] !== "")
                return colorScale(d['Share of education in governmental expenditure (%)']);
            else return "#666666";
        })
        .style("opacity", 0.7)
        .attr("transform", function(d){
            return `rotate(${d.a},${d.x},${d.y})`;
        });

    // bind data to the spiral
    svg.append('g')
        .attr("id", "g_vis3_data");
    d3.select("#g_vis3_data")
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "vis3_rect")
        .attr("x", function(d){
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
    svg.selectAll("text")
        .data(data)
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
        .attr("font-weight", function(d){
            if(d.labelFlg === true){
                return "bold";
            }
            else return "normal";
        })
        .attr("font-size", function(d){
            if(d.labelFlg === true){
                return "14px";
            }
            else return "10px";
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
    var min_val = d3.min(data, function(d){
            if(d['Share of education in governmental expenditure (%)'] !== "")
                return +d['Share of education in governmental expenditure (%)'];
        }),
        max_val = d3.max(data, function(d){
            return +d['Share of education in governmental expenditure (%)'];
        });

    for(let i=0; i<9; i++){
        legend1.push({
            value: i,
            pos: [x0, y0+i*30],
            t: Math.round(i * (max_val - min_val)/9)+ "~" +
                Math.round((i+1) * (max_val - min_val)/9)
        });
    }
    legend1.push({value:-1, pos:[x0, y0+270], t:"Not Available"});
    //legend group
    d3.select("#v13_svg")
        .append("g")
        .attr("class", "legend31")
        .attr("transform", "translate(" + 500 + "," + 450 +")");

    d3.select('.legend31')
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
            if(d.value === -1){
                return "#666666";
            }
            else return colorbrewer.PuBuGn[9][d.value];
        })
        .style("stroke", "grey")
        .style("stroke-width", "1px");

    d3.select('.legend31')
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
            return d.t + " %";
        });

    d3.select('.legend31')
        .append("text")
        .attr("x", x0-20)
        .attr("y", y0-40)
        .text("Share of education in")
        .attr("font-weight", "bold");
    d3.select('.legend31')
        .append("text")
        .attr("x", x0-20)
        .attr("y", y0-20)
        .text("government expenditure")
        .attr("font-weight", "bold");


    // draw axis
    var yAxisScale = d3.scaleLinear()
        .domain([15,0])
        .range([0, 60]);
    var yAxis = d3.axisLeft(yAxisScale)
        .tickValues([0,5,10,15]);

    var legend22 = d3.select("#v13_svg")
        .append("g")
        .attr("class", "axis3")
        .attr("transform", "translate(" + 505 + "," + 70 +")")
        .style("dominant-baseline", "central")
        .call(yAxis)
        .attr("stroke", "black")
        .attr("fill", "grey");

    legend22.select("path").attr("marker-end", "url(#arrowhead)");

    var x1 = -20,
        y1 = y0-150;
    d3.select('.legend31')
        .append("text")
        .attr("x", x1)
        .attr("y", y1)
        .text("Mean year of schooling (years)")
        .attr("font-weight", "bold");
    d3.select('.legend31')
        .append("text")
        .attr("x", x1-80)
        .attr("y", y1 + 87)
        .style("font-size", 12)
        .text("Not Available");


    // Interaction
    var popUp = d3.select(".tooltip");

    d3.select("#g-vis3")
        .selectAll(".vis3_rect_bgd")
        .on('mouseover', function(d){
            popUp.select('.country').html("Country/Region: <b>" + d['Country/Region'] + "</b>");
            popUp.select('.literacy').html("Literacy rate: <b>" + d['Literacy rate(%)'] + "%</b>");
            if(d['Mean years of schooling'] === "") popUp.select('.schooling').html("Mean Year of Schooling: <b>Not Available</b>");
            else popUp.select('.schooling').html("Mean Year of Schooling: <b>" + d['Mean years of schooling'] + " years</b>");
            if(d['Share of education in governmental expenditure (%)'] === "")popUp.select('.expenditure').html("Share of education in governmental expenditure: <b>Not Available</b>");
            else popUp.select('.expenditure').html("Share of education in government expenditure: <b>" + d['Share of education in governmental expenditure (%)'] + "%</b>");

            var bgd_color = "#666666";
            if(d['Share of education in governmental expenditure (%)'] !== ""){
                bgd_color = colorScale(d['Share of education in governmental expenditure (%)']);
            }
            popUp.style("background", bgd_color);

            d3.select(this)
                .style("fill", "#FFFFFF")
                .style("stroke", "#000000")
                .style("stroke-width", "2px");

            popUp.style('display', 'block');
            popUp.style('opacity', 0.8);
        })
        .on('mousemove', function(d){
            popUp.style('left', (d3.event.layerX - 25) + 'px')
                .style('top', (d3.event.layerY + 10) + 'px');
        })
        .on('mouseout', function(d){
            d3.select("#g-vis3")
                .selectAll(".vis3_rect_bgd")
                .style("fill", function(d){
                    if(d['Share of education in governmental expenditure (%)'] !== "")
                        return colorScale(d['Share of education in governmental expenditure (%)']);
                    else return "#666666";
                })
                .style("stroke", "grey")
                .style("stroke-width", "0")
                .style("opacity", 0.7);

            popUp.style('display', 'none');
            popUp.style('opacity', 0);
        });
}

function setupVis3() {
    d3.csv("worldwide-literacy.csv").then(function(data){
        setSpiral3(data);
    })
}
