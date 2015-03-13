//Use CommonJS style via browserify to load other modules
require("./lib/social");
require("./lib/ads");
var d3 = require("d3");

var providers = { 
  "Cascade Valley Foundation": { 
    "organization": "Cascade Valley Foundation", 
    "amount": 0, 
    "type": "provider" },
  "Red Cross": { 
    "organization": "Red Cross", 
    "amount": 0, 
    "type": "provider" },
  "United Way": { 
    "organization": "United Way", 
    "amount": 0, 
    "type": "provider" }
};

var organizations = {};

osoData.forEach(function(row) {
  row.amount = row.amount * 1;

  if (!organizations[row.organization]) { 
    organizations[row.organization] = { 
      "organization": row.organization, 
      "amount": 0, 
      "type": "organization" 
    };
  }
  organizations[row.organization].amount += row.amount;

  var p = providers[row.provider];
  if (p) {
    p.amount += row.amount;
  }
});

var nodes = [];
for (var p in providers) {
  nodes.push(providers[p]);
}
for (var org in organizations) {
  nodes.push(organizations[org]);
}

var links = osoData.map(function(row) {
  return {
    source: providers[row.provider],
    target: organizations[row.organization],
    amount: row.amount
  }
});

var width = 960,
    height = 500;

var color = d3.scale.category20();

var force = d3.layout.force()
    .charge(function(d) { return -1 * Math.log(d.amount/500)* 3 * 20 })
    .linkDistance(50)
    .size([width, height]);

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

force.nodes(nodes);
force.links(links);
force.start();

var link = svg.selectAll(".link")
  .data(links)
  .enter().append("line")
  .style("stroke-width", function(d) { return Math.log(d.amount/1000); })
  .style("stroke", "#d1d2d4")
  .style("stroke-opacity", .7);

var node = svg.selectAll(".node")
  .data(nodes)
  .enter().append("circle")
  .attr("r", function(d) { 
    var size = Math.log(d.amount/500) * 2;
    if (size < 3) { size = 3 }
    return d.type == "organization" ? size : 25 
  })
  .style("fill", function(d) { return d.type == "organization" ? "#fcbc85" : "#bac9e7" })
  .call(force.drag)
  .on("click", function(d) { console.log(d) });

node.append("title")
  .text(function(d) { return d.organization; });

force.on("tick", function() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
});
