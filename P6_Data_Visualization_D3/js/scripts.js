/*
// central idea modified from http://neuralengr.com/asifr/journals/
*/

/*
https://blog.repustate.com/twitter-postgis-d3-rob-ford-fun-with-data-visualizations/
http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=04b489fe9c18b210VgnVCM1000003dd60f89RCRD&vgnextchannel=75d6e03bb8d1e310VgnVCM10000071d60f89RCRD
http://geojson.org
http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=b1533f0aacaaa210VgnVCM1000006cd60f89RCRD&vgnextchannel=1a66e03bb8d1e310VgnVCM10000071d60f89RCRD
https://suffenus.wordpress.com/2014/01/07/making-interactive-maps-with-d3-for-total-beginners/
http://sandbox.idre.ucla.edu/sandbox/general/how-to-install-and-run-gdal
http://www.kyngchaos.com/software:frameworks
http://ben.balter.com/2013/06/26/how-to-convert-shapefiles-to-geojson-for-use-on-github/
*/


var margin = {top: 80, right: 0, bottom: 0, left: 80},
	width = 800, // width of neighbourhood + crime types + comm_housing bars
	height = 650; // TODO: need to update

var maxBarWidth = 200,
    barHeight = 20
    xAxisWidth = 400;

// http://bl.ocks.org/aaizemberg/78bd3dade9593896a59d
var c10 = d3.scale.category10();

// TODO: pull this from dataset
var x = d3.scale.ordinal()
    .domain(["Arsons","Assaults", "Break & Enters", "Fire Alarms", "Medical Calls",
            "Vehicle Incidents", "Hazardous Incidents", "Murders", "Robberies",
            "Sexual Assaults", "Thefts", "Vehicle Thefts"])
    .rangePoints([0, xAxisWidth]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top");

var xBarScale = d3.scale.linear()
    .domain([0, 1]) //d3.max(data, function(d) { return d.comm_housing_pop_ratio; })]);
    .range([0, 10]);

// http://bl.ocks.org/mstanaland/6106487
var formatDecimal = d3.format(".2f")

// http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922
var mapWidth = 350,
    mapHeight = 350;

var projection = d3.geo.albers();

var path = d3.geo.path()
    .projection(projection);

// TODO: update with with bar width
var svg = d3.select("body").append("svg")
	.attr("width", width + margin.left + margin.right + mapWidth)
	.attr("height", height + margin.top + margin.bottom + mapHeight)
	.style("margin-left", margin.left + "px")

var chartGroup = svg.append("g") // D3 group element
    .attr("class", "chartGroup")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var mapGroup = svg.append("g")
    .attr("class", "mapGroup")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

var mapLabel = mapGroup.append("text")
    .attr("y", 20)
    .attr("x", 0)
    .attr("class", "map_neighbourhood_name")

// xAxis group
chartGroup.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + 165 + "," + 0 + ")")
    .call(xAxis)
  .selectAll("text")
    .attr("y", -10)
    .attr("x", 5)
    .attr("dy", ".35em")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "start");

// load neighbourhood crime data
d3.json("data/sample_data.json", function(error, data) {
  if (error) throw error;

  // Apply svg elements for each individual record / neighbourhood
  for (var j = 0; j < data.length; j++) {
      var g = chartGroup.append("g")
          .attr("class","neighbourhood")
          .attr("transform", "translate(" + 0 + "," + j*5 + ")");

      var circles = g.selectAll("circle")
              .data(data[j]['crime_types'])
          .enter()
              .append("circle");

      var text = g.selectAll("text")
              .data(data[j]['crime_types'])
          .enter()
              .append("text");

      var rScale = d3.scale.sqrt() // d3.scale.linear()
          .domain([1, 800 ]) // .domain([0, d3.max(data[j]['crime_types'], function(d) { return d3.values(d)[0]; }) ])
          .range([1, 10])
          // .clamp(true);

      circles
          .attr("cx", function(d, i) { return i*35+175; })
          .attr("cy", j*20+20)
          .attr("r", function(d) { return rScale(d3.values(d)[0]); })
          .style("fill", function(d,i) { return c10(i); });

      text
          .attr("y", j*20+25)
          .attr("x",function(d, i) { return i*35+175; })
          .attr("class", "value")
          .text(function(d){ return d3.values(d)[0]; }) // each d = {key:value} of crime_types
          .style("fill", function(d,i) { return c10(i); })
          .style("text-anchor", "middle")
          .style("display", "none");

      g.append("text")
          .attr("y", j*20+25)
          .attr("x", 140) // Setting text-anchor to end means x must be x-(text.length) where text.length is max px of label
          .attr("class", "label")
          .text(data[j]['name'])
          .style("text-anchor", "end")
          .on("mouseover", mouseover)
          .on("mouseout", mouseout);

      g.append("rect")
          .attr("width", xBarScale(data[j]["comm_housing_pop_ratio"])*100)
          .attr("height", barHeight)
          .attr("class", "housing")
          .attr("y", j*20+25/2) // center rect on each neighbourhood
          .attr("transform", "translate(" + 600 + "," + 0 + ")") // TODO: get this working with variables
          .style("fill", c10(0));

      g.append("text")
          .attr("x", xBarScale(data[j]["comm_housing_pop_ratio"])*100)
          .attr("y", j*20+25/2)
          .attr("dy", "1.35em") //vertical align middle
          .attr("transform", "translate(" + 610 + "," + 0 + ")") // TODO: use exiting or put in variables at top
          .text(formatDecimal(data[j]["comm_housing_pop_ratio"]*100) + "%");

  };

  function mouseover(p) {
      var g = d3.select(this).node().parentNode;
      d3.select(g).selectAll("circle").style("display","none");
      d3.select(g).selectAll("text.value").style("display","block");
  }

  function mouseout(p) {
      var g = d3.select(this).node().parentNode;
      d3.select(g).selectAll("circle").style("display","block");
      d3.select(g).selectAll("text.value").style("display","none");
  }
  
});

// load neighbourhood map data
d3.json("data/toronto_topo.json", function(error, toronto) {
  if (error) throw error;

  var neighbourhoods = topojson.feature(toronto, toronto.objects.toronto); //,
//                   neighbourhood = neighbourhoods.features.filter(function(d) { return d.properties.id == 97; })[0];

  // set default projection values 
  projection
      .scale(1)
      .translate([0, 0]);

  // creates bounding box and helps with projection and scaling
  var b = path.bounds(neighbourhoods),
      s = .95 / Math.max((b[1][0] - b[0][0]) / mapWidth, (b[1][1] - b[0][1]) / mapHeight),
      t = [(mapWidth - s * (b[1][0] + b[0][0])) / 2, (mapHeight - s * (b[1][1] + b[0][1])) / 2];

  // set project with bounding box data
  projection
      .scale(s)
      .translate(t);

  // get individual neighbourhoods
  mapGroup.selectAll("path")
        .data(neighbourhoods.features)
      .enter().append("path")
        .attr("class", "map_neighbourhood")
        .attr("d", path)
        .on("mouseover", mouseover) 
        .on("mouseout", mouseout)
        .on("click", clicked)

  mapGroup.append("path")
      .datum(topojson.mesh(toronto, toronto.objects.toronto, function(a, b) { return a !== b; }))
      .attr("class", "map_mesh")
      .attr("d", path);

//              svg.append("path")
//                  .datum(neighbourhood)
//                  .attr("class", "map_outline")
//                  .attr("d", path)
  
  function mouseover(d) {     
    mapLabel.text(d.properties.name.slice(0,-5)) // remove suffix id from name
  }

  function mouseout(d) {     
    mapLabel.text("")  
  }

  function clicked(d) {
    console.log(d.properties.id, d.properties.name)
    /*TODO: 
      set selected to true
      add d.id to list or dictionary
      if selected == true, remove d.id from list
      update text showing list
    */
  }
  
});
