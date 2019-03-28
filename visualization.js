
// Using jQuery, read our data and call visualize(...) only once the page is ready:
$(function() {
  d3.csv("majornewtotals.csv").then(function(data) {
    
    // Write the data to the console for debugging:
    console.log(data);
    // Call our visualize function:
    visualize(data);
  });
});


var visualize = function(data, opponents) {
  // Boilerplate:
  var margin = { top: 50, right: 50, bottom: 50, left: 50 },
     width = 2000 - margin.left - margin.right,
     height = 3000 - margin.top - margin.bottom;
 
  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .html((d, i) => {
    return "College: " + d.group + " Major Name: " + d.name + " Gender: " + d.gender + " \nAbsolute Difference from 1980-2018 for this Gender: " +
       d.value + " Percentage Difference " + Math.floor(d.percentage);
  });
 
  var center = {
    x : width/2,
    y : height/2
  };

  var forceStrength = 0.3;

  var bubbles = null;
  var nodes = [];

  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(width / 2))
    .force('y', d3.forceY().strength(forceStrength).y(height / 2))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  simulation.stop();

  var yDimension = d3.scaleLinear()
    .domain([0, 20])
    .range([center.y+height/40, center.y-height/40]);

  var xDimension = d3.scaleOrdinal()
    .domain([-100, 10000])
    .range([center.x+width/4, center.x-width/4])

  var relativeColor = d3.scaleOrdinal()
    .domain([0, 20, 40, 50, 60, 80, 100, 120, 140])
    .range(["#FF0000", "#FF5555", "#C66363", "#646464", "#57BE6A", "#87C191", "#00FF2E"]); 

  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("width", width + margin.left + margin.right)
    .style("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.call(tip);
  // Visualization Code:
  
  function createNodes(data) {

    var maxAmount = d3.max(data, (d) => 
    { 
      return +d.AbsDif; 
    });

    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([5, 40])
      .domain([0, maxAmount]);
 
    var myNodesMale = data.map(function (d) {
      return {
        radius: radiusScale(Math.abs(d.AbsDifMale)),
        value: d.AbsDifMale,
        name: d.MajorName,
        percentage: d.RelDifMale,
        group: d.College,
        year: d.Fall,
        gender: "male",
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    var myNodesFemale = data.map(function (d) {
      return {
        radius: radiusScale(Math.abs(d.AbsDifFemale)),
        value: d.AbsDifFemale,
        name: d.MajorName,
        percentage: d.RelDifFemale,
        group: d.College,
        year: d.Fall,
        gender: "female",
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    function compareNodes(a, b)
    {
      let first = b.group.localeCompare(a.group);
      return first;
    }

    var myNodes = myNodesMale.concat(myNodesFemale);
    myNodes.sort((a, b) => {return compareNodes(a, b)});
    /*
    let j = 0;
    myNodes = myNodes.map((d, i, a) =>
    {
      if (i > 0 && d.group !== a[i-1].group)
        ++j;
      d.degree = j*360/20;
      return d;
    });
    */
    return myNodes;
  }
  
  function calcColor(percentage)
  {
    if (percentage < -80)
      return 0;
    if (percentage > -5 && percentage < 5)
      return 50;
    if (percentage < -50)
      return 20;
    if (percentage < -5)
      return 40;
    if (percentage < 50)
      return 60;
    if (percentage < 80)
      return 80;
    if (percentage < 150)
      return 100;
    if (percentage < 1000)
      return 120;
    return 140;
  }

  nodes = createNodes(data);
  console.log(nodes);
   
  bubbles = svg.selectAll('.bubble')
    .data(nodes, (d) => {return d.name;})
    .enter()
    .append('circle')
    .classed('bubble', true)
    .attr('r', 10)
    .attr('fill', (d) => { return relativeColor(calcColor(d.percentage)); })
    .attr('stroke', (d) => { return d3.rgb(relativeColor(calcColor(d.percentage))).darker(); })
    .attr('stroke-width', 2)
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
 
  bubbles.transition()
    .duration(2000)
    .attr('r', function (d) { return d.radius; });

  simulation.nodes(nodes);

  splitBubbles();

  function splitBubbles() {

    simulation.force('x', d3.forceX().strength(forceStrength).x(relDifx));
    simulation.force('y', d3.forceY().strength(forceStrength).y(relDify));
    simulation.alpha(1).restart();
    simulation.alphaDecay(0.005)
  }

  function ticked() {
  bubbles
    .attr('cx', function (d) { return d.x; })
    .attr('cy', function (d) { return d.y; });
  }

  function relDifx(d)
  {
    if (d.percentage === "-100.0")
      return xDimension(d.percentage);
    if (d.percentage === "10000.0")
      return xDimension(d.percentage);
    return center.x;
  }
  function relDify(d)
  {
    if (d.percentage !== "-100.0" && d.percentage !== "10000.0")
      return yDimension(d.radius);
    return center.y;
  }

  function nodeYearPos(d) {
    var genMod = (d.gender == "male")? 0:1;
    return fallCenters[+d.year+genMod].x;
  }

  function showYearTitles()
  {
    var yearsData = d3.keys(titles);
    var years = svg.selectAll('.year')
      .data(yearsData)
      .enter()
      .append('text')
      .attr('x', (d) => {return titles[d];})
      .attr('y', height/2-240)
      .attr('text-anchor', 'middle')
      .text((d) => {
        console.log(d);
        if (d === "1980" || d === "2018")
          return "Male Students, " + d.toString();
        else
          return "Female Students, " + (Number(d)-1).toString();
      });
  }
};
