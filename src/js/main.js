//Use CommonJS style via browserify to load other modules
require("./lib/social");
require("./lib/ads");
var d3 = require("d3");
var ich = require("icanhaz");

var panelHTML = require("./_panel.html");
ich.addTemplate("panel", panelHTML);

var height = 380;
var width = document.documentElement.clientWidth;
if (width > 380) { width = 380 }

var providers = { 
  "Cascade Valley Hospital Foundation": { 
    "organization": "Cascade Valley Hospital Foundation", 
    "display": "CVHF",
    "amount": 0, 
    "type": "provider" },
  "Red Cross": { 
    "organization": "Red Cross", 
    "display": "Red Cross",
    "amount": 0, 
    "type": "provider" },
  "United Way": { 
    "organization": "United Way", 
    "display": "United Way",
    "amount": 0, 
    "type": "provider" }
};

var contributions = {};
var organizations = {};

osoData.forEach(function(row) {
  row.amount = row.amount * 1;

  if (!organizations[row.organization]) { 
    organizations[row.organization] = { 
      organization: row.organization, 
      amount: 0, 
      type: "organization",
      category: row.category,
      x: width / 2,
      y: height / 2
    };
  }
  organizations[row.organization].amount += row.amount;

  var p = providers[row.provider];
  if (p) {
    p.amount += row.amount;
  }

  // need object keyed by organization for info panel
  if (!contributions[row.organization]) { contributions[row.organization] = {} }
  contributions[row.organization][row.provider] = {
    amount: formatNumber(row.amount).toString(),
    services: row.services
  }
});

var nodes = [];
var totalAmount = 0;
for (var org in organizations) {
  nodes.push(organizations[org]);
}
for (var p in providers) {
  providers[p].x = width / 2;
  providers[p].y = height / 2;
  nodes.push(providers[p]);
  totalAmount += (providers[p].amount *1);
}
var links = osoData.map(function(row) {
  return {
    source: providers[row.provider],
    target: organizations[row.organization],
    amount: row.amount
  }
});

var force = d3.layout.force()
    .charge(function(d) { return -1 * Math.log(d.amount/500) * 3 * 20 })
    .linkDistance(40)
    .gravity(0.25)
    .size([width, height]);

var svg = d3.select(".graphic").append("svg")
  .attr("width", width)
  .attr("height", height);

force.nodes(nodes);
force.links(links);
force.start();

// Links
var link = svg.selectAll(".link")
  .data(links)
  .enter().append("line")
  .style("stroke-width", function(d) { return Math.log(d.amount/1000); })
  .style("stroke", "#BBB")
  .style("stroke-opacity", .7)
  .style("marker-end",  "url(#suit)");

// Nodes
var node = svg.selectAll(".node")
  .data(nodes)
  .enter().append("g")
  .attr("class", "node")
  .call(force.drag);

var colors = {
  "Family and community services": {
    light: "#b5bfa9",
    dark: "#798f71"
  },
  "Disaster relief": {
    light: "#d5e4f0",
    dark: "#7baddc"
  },
  "Youth programs": {
    light: "#fcbb75",
    dark: "#f36f21"
  },
  "Physical and mental health services": {
    light: "#ffe4b6",
    dark: "#ffc02d"
  },
  "Funeral costs": {
    light: "#c7bbdc",
    dark: "#7b5aa6"
  },
  "Economic development": {
    light: "#a0c5c7",
    dark: "#008778"
  },
  "Misc.": {
    light: "#d5dae5",
    dark: "#728cab"
  },
  "Multiple": {
    light: "#dcddde",
    dark: "#b2b3b6"
  },
}

// Circles
node.append("circle")
  .attr("r", function(d) { 
    var size = Math.log(d.amount/500) * 2;
    if (size < 3) { size = 3 }
    return d.type == "organization" ? size : Math.log(d.amount/100) * 3
  })
  .style("fill", function(d) { return d.type == "organization" ? "#EEE" : "#e5af9b" })
  .style("stroke", function(d) { return d.type == "organization" ? colors[d.category].dark : "white" })
  
  .on("click", function(d) { 
    onHoverOrClick(d, this);
  })
  .on("mouseenter", function(d) { 
    onHoverOrClick(d, this);
  });

// Titles
node.append("text")
  .attr("dx", "0")
  .attr("dy", ".35em")
  .attr("text-anchor", "middle")
  .text(function(d) { 
    if (d.type == "provider") { return d.display; }
  });

// set up initial panel info
document.getElementById("panel").innerHTML = ich.panel( {
  name: "2014 Oso Charitable Donations", 
  amount: formatNumber(totalAmount).toString(),
  cascade: {amount: formatNumber(providers["Cascade Valley Hospital Foundation"].amount).toString()},
  redcross: {amount: formatNumber(providers["Red Cross"].amount).toString()},
  united: {amount: formatNumber(providers["United Way"].amount).toString()}
} );

var onHoverOrClick = function(d, target) {
  node.selectAll("circle")
    .style("fill", function(d) { return d.type == "organization" ? "#EEE" : "#e5af9b" })
    .style("stroke", function(d) { return d.type == "organization" ? colors[d.category].dark : "white" })
    .style("stroke-width", 1);
  d3.select(target)
    .style("fill", function(d) { return d.type == "organization" ? "#BBB" : "#ca6951" })
    .style("stroke", function(d) { return d.type == "organization" ? colors[d.category].dark : "#888" })
    .style("stroke-width", 3);
  var options = {
    name: d.organization, 
    amount: formatNumber(d.amount).toString(),
    wording: d.type == "provider" ? "distributed" : "received"
  };
  if (d.type == "organization") {
    options.cascade = contributions[d.organization]["Cascade Valley Hospital Foundation"];
    options.redcross = contributions[d.organization]["Red Cross"];
    options.united = contributions[d.organization]["United Way"];
  }
  document.getElementById("panel").innerHTML = ich.panel( options );
};

force.on("tick", function () {
  link.attr("x1", function (d) { return d.source.x; })
      .attr("y1", function (d) { return d.source.y; })
      .attr("x2", function (d) { return d.target.x; })
      .attr("y2", function (d) { return d.target.y; });
  d3.selectAll("circle").attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; });
  d3.selectAll("text").attr("x", function (d) { return d.x; })
      .attr("y", function (d) { return d.y; });
});

