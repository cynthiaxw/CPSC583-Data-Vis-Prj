/**
 * Call our functions on window load event
 */
window.onload = function(){
    setupVis();
};

/**
 * Global variables
 */
var _vis;       // The visualization

var SpiralPlot = function(){
    this.data;  // the data subset to present
    this.width = 500;
    this.height = 500;
    this.margin = {top:50, bottom:50, left:50, right:50};
    this.start = 0;
    this.end = 2.25;
    var spiralNum = 3;
    this.svgContainer;
    this.minRadius = 40;

    this.theta = function(r) {
        return spiralNum * Math.PI * r;
    };

    this.color = d3.scaleOrdinal(d3.schemeRdYlGn);

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
            .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");

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

        console.log("max: " + spiralLength);
        console.log(xScale("Bolivia"));

        var yScale = d3.scaleLinear()
            .domain([0,d3.max(this.data, function(d){
                return d['Literacy rate(%)'];
            })])
            .range([0, (this.r / spiralNum) - 40]);

        console.log("r: " + this.r);
        console.log("spiralNum: " + spiralNum);
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
                return yScale(d['Literacy rate(%)']);
            })
            .style("fill", "coral")
            .style("stroke", "none")
            .attr("transform", function(d){
                return `rotate(${d.a},${d.x},${d.y})`;
            });

        var popUp = d3.select("#vis1")
            .append('div')
            .attr('class', 'tooltip');
        popUp.append('div')
            .attr('class','country');
        popUp.append('div')
            .attr('class', 'literacy');

        this.svgContainer.selectAll("rect")
            .on('mouseover', function(d){
                popUp.select('.country').html("Country/Region: <b>" + d['Country/Region'] + "</b>");
                popUp.select('.literacy').html("Literacy rate: <b>" + d['Literacy rate(%)'] + "%</b>")

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
                d3.selectAll("rect")
                    .style("fill", function(d){
                        return "coral";
                    })
                    .style("stroke", "none");

                popUp.style('display', 'none');
                popUp.style('opacity', 0);
            })
    }

}

function setupVis() {
    _vis = new SpiralPlot();
    _vis.svgContainer = d3.select("#v1_literacy_rate_svg");
    loadData("worldwide-literacy.csv");
}

function loadData(path) {
    d3.csv(path).then(function(data){
        _vis.data = data;
        console.log(_vis.data);
        _vis.setSpiral();
    })
}