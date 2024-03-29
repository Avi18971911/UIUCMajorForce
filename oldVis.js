
// Using jQuery, read our data and call visualize(...) only once the page is ready:
$(function() {
  d3.csv("majortotals2.csv").then(function(data) {
    
    // Write the data to the console for debugging:
    console.log(data);
    // Call our visualize function:
    visualize(data);
  });
});


var visualize = function(data, opponents) {
  // Boilerplate:

  let currentYear = "1980.0";

  var margin = { top: 50, right: 50, bottom: 50, left: 50 },
     width = 2000 - margin.left - margin.right,
     height = 3000 - margin.top - margin.bottom;
 
  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .html((d, i) => {
    return "College: " + d.group + " Major Name: " + d.name + "\nTotal Number of Students: " +
       d.year[currentYear].total + " Total Number of Students of this Gender: " + d.year[currentYear].value;
  });
 
  var center = {
    x : width/2,
    y : height/2
  };

  var genderCenters = {
    0: 1.5*width/5,
    1: 3.3*width/5
  };

  var titles = {
    1: 1.5*width/5-18,
    2: 3.3*width/5+32,
  };
  
  var forceStrength = 0.3;

  var bubbles = null;
  var nodes = [];

  function charge(d) {
    if (d.year[currentYear])
      return -Math.pow(d.year[currentYear].radius, 2.0) * forceStrength;
    else
      return 0;
  }

  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(width / 2))
    .force('y', d3.forceY().strength(forceStrength).y(height / 2))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  simulation.stop();

  var fillColor = d3.scaleOrdinal()
    .domain([data.college])
    .range(["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"]);
 
  var collegeScale = d3.scaleOrdinal()
    .domain([data.college])
    .range(data.map((d, i) => { return height/400*i+height/4})); 

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

  var dateData = [...new Set(data.map(d => d.Fall))]
  var colData = [...new Set(data.map(d => d.College))]
  console.log(dateData);

  var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dateData))
    .max(d3.max(dateData))
    .step(1.0)
    .width(1000)
    .tickValues(dateData)
    .tickFormat(d3.format("d"))
    .default(1980)
    .on('onchange', val => {
      d3.select('p#value-time').text((val))
      currentYear = val.toString()
      currentYear += ".0"
      simulationChange(val);
    }); 
 
 
  svg.append("g")
    .attr('transform', "translate(400, 1000)")
    .call(sliderTime);

  function createNodes(data, colData) {

    var maxAmount = d3.max(data, (d) => 
    { 
      return +d.Total; 
    });

    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([5, 40])
      .domain([0, maxAmount]);

    var myNodesMale = {};
    for (let i of colData)
      if (!myNodesMale[i])
        myNodesMale[i] = {};
    
    for (let d of data)
    {
      if (!myNodesMale[d.College][d.MajorName])
      {
        myNodesMale[d.College][d.MajorName] = {
          name: d.MajorName,
          group: d.College,
          year: {},
          gender: "male",
          x: Math.random() * 900,
          y: Math.random() * 800
        };
      }
        myNodesMale[d.College][d.MajorName].year[d.Fall] = {
          name: d.Fall,
          value: d.Male,
          radius: radiusScale(+d.Male),
          total: d.Total
        }; 
    }

   var myNodesFemale = {};
    for (let i of colData)
      if (!myNodesFemale[i])
        myNodesFemale[i] = {};
    
    for (let d of data)
    {
      if (!myNodesFemale[d.College][d.MajorName])
      {
        myNodesFemale[d.College][d.MajorName] = {
          name: d.MajorName,
          group: d.College,
          year: {},
          gender: "female",
          x: Math.random() * 900,
          y: Math.random() * 800
        };
      }
        myNodesFemale[d.College][d.MajorName].year[d.Fall] = {
          name: d.Fall,
          value: d.Female,
          radius: radiusScale(+d.Female),
          total: d.Total
        }; 
    }
 
    function compareNodes(a, b)
    {
      let first = b.group.localeCompare(a.group);
      return first;
    }

    var myNodes = [];
    
    for (let college in myNodesMale)
    {
      for (let major in myNodesMale[college])
      {
        myNodes.push(myNodesMale[college][major]);
        myNodes.push(myNodesFemale[college][major]);
      }
    }
    
    myNodes.sort((a, b) => {return compareNodes(a, b)});
    let j = 0;
    myNodes = myNodes.map((d, i, a) =>
    {
      if (i > 0 && d.group !== a[i-1].group)
        ++j;
      d.degree = j*360/20;
      return d;
    });
    return myNodes;
  }
  
  nodes = createNodes(data, colData);
  console.log(nodes);
  
  bubbles = svg.selectAll('.bubble')
    .data(nodes, (d) => {return d.name;})
    .enter()
    .append('circle')
    .classed('bubble', true)
    .attr('r', 0)
    .attr('fill', (d) => { return fillColor(d.group); })
    .attr('stroke', (d) => { return d3.rgb(fillColor(d.group)).darker(); })
    .attr('stroke-width', 2)
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
  
  function simulationChange(val)
  {

    simulation.force('charge', d3.forceManyBody().strength(charge))
    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) {
        let yeario = val;
        yeario = yeario.toString();
        yeario += ".0";
        if (!d.year[yeario])
          return 0;
        else
        {
          return d.year[yeario].radius;
        }
        })
    simulation.alpha(0.5).restart();
    simulation.alphaDecay(0.005);
  }

  simulation.nodes(nodes);
  simulationChange(1980);
  splitBubbles();
  
  function splitBubbles() {
    showYearTitles();

    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeRadialPosx));
    simulation.force('y', d3.forceY().strength(forceStrength).y(nodeRadialPosy));
    simulation.alpha(1).restart();
    simulation.alphaDecay(0.005)
  }

  function ticked() {
  bubbles
    .attr('cx', function (d) { return d.x; })
    .attr('cy', function (d) { return d.y; });
  }

  function nodeRadialPosx(d) 
  {
    let radius = 15;
    return nodeYearPos(d) + radius*Math.cos(d.degree * Math.PI / 180);
  }

  function nodeRadialPosy(d)
  {
    let radius = 15;
    return center.y - 700 + radius*Math.sin(d.degree * Math.PI / 180);
  }

  function nodeYearPos(d) {
    var genMod = (d.gender == "male")? 0:1;
    return genderCenters[genMod];
  }

  function showYearTitles()
  {
    var yearsData = d3.keys(titles);
    var years = svg.selectAll('.year')
      .data(yearsData)
      .enter()
      .append('text')
      .attr('x', (d) => {return titles[d];})
      .attr('y', height/4-200)
      .attr('text-anchor', 'middle')
      .text((d, i) => {
        if (i == 0)
          return "Male Students";
        else
          return "Female Students";
      });
  }
};
