var leaseData = [
    {
        "unitName": "A101",
        "beginTimestamp": 1328256000000,
        "endTimestamp": 1359978400000,
        "rent": 1200
    },
    {
        "unitName": "B201",
        "beginTimestamp": 1298966400000,
        "endTimestamp": 1398966400000,
        "rent": 1300
    },
    {
        "unitName": "A301",
        "beginTimestamp": 1275721200000,
        "endTimestamp": 1298966400000,
        "rent": 1500
    },
    {
        "unitName": "A101",
        "beginTimestamp": 1298966400000,
        "endTimestamp": 1310664000000,
        "rent": 1100
    },
    {
        "unitName": "A301",
        "beginTimestamp": 1357878400000,
        "endTimestamp": 1369878400000,
        "rent": 2000
    }
];


//Extract the range of dates to be displayed & the unit names to be displayed.
var unitNames = [];
var earliestLease = Infinity;
var latestLease = 0;
$.each(leaseData, function( index, value ) {
    unitNames[unitNames.length] = value.unitName;
    if (value.beginTimestamp < earliestLease){
        earliestLease = value.beginTimestamp;
    };
    if (value.endTimestamp > latestLease){
        latestLease = value.endTimestamp;
    };
});
// Remove duplicate unit names
$.unique(unitNames)

// Sort the unit names to ensure they are displayed in a consistent order
unitNames.sort();

// Calculate the number of months to be displayed
earliestDate = new Date(earliestLease);
latestDate = new Date(latestLease);
//var timeSpan = calculateTimeSpan(earliestDate, latestDate);
var timeSpan = calculateMonthSpread(earliestDate, latestDate)+1;
// Determine container height, such that each row gets 100px
var heightMultiplier = 50;
var containerHeight = 50 + (unitNames.length * heightMultiplier);
var lineHeight = containerHeight - 50;

// Determine container width based on months in data set
// A 'month' is 20px wide
var containerWidth = 200 + ((timeSpan -1 ) * 20);
var lineWidth = containerWidth - 200;
var svgContainer = d3.select(".svg").append("svg").attr("width", containerWidth).attr("height",containerHeight);

var yDescription = svgContainer.append("text").attr("x", 25).attr("y", 20).attr("font-family", "sans-serif").attr("font-size","20px").attr("fill", "black").text("Units");

var xDescription = svgContainer.append("text").attr("x", 10).attr("y", containerHeight - 25).attr("font-family", "sans-serif").attr("font-size","20px").attr("fill", "black").text("Months");

var yLine = svgContainer.append("line").attr("x1", 100).attr("y1", 0).attr("x2", 100).attr("y2", lineHeight);

// Offset the ending of the line to account for it starting 100px earlier.
var xLine = svgContainer.append("line").attr("x1", 0).attr("y1", lineHeight).attr("x2", lineWidth+100).attr("y2", lineHeight);

// Months array for determining the month with the highest revenue
var months = [];
for(var i = 0; i<(calculateMonthSpread(earliestDate, latestDate)); i++) {
    months.push({
        "month": i,
        "totalRent": 0,
});
}


labelXAxis(earliestDate, timeSpan);
labelYAxis(unitNames);
populateGraph(leaseData);
highlightRevenue(months);
// calculateMonthSpread determines the number of months between
// two given dates.
// Ideally this would be somehow used to scale the graph and
// ensure it remains usable even with edge case datasets,
// however that seems out of scope
function calculateMonthSpread(earlyDate, lateDate) {
    var earlyDateMonthCount = earlyDate.getFullYear()*12 + earlyDate.getMonth();
    var lateDateMonthCount = lateDate.getFullYear()*12 + lateDate.getMonth();
    var spread = lateDateMonthCount - earlyDateMonthCount;
    // This method assumes that we count both the month of the early and late date.
    return spread + 1;
}

// Label the x axis with the months in the timeSpan
function labelXAxis(earliestDate, timeSpan) {
    var tempDate = new Date(earliestDate);
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    //Loop through each month until we reach the end of the graph
    for(i = 0; i < timeSpan - 1; i++) {
        // Determine the month prefix and append the year to it
        var text = monthNames[tempDate.getMonth()] + tempDate.getFullYear().toString();
        // Label every 20 px with the associated month
        svgContainer.append("text").attr("x", lineHeight).attr("y", (-100 - (20*i)) ).attr("font-family", "sans-serif").attr("font-size","11px").text(text).attr("transform", "rotate(90 0,0)");
        svgContainer.append("line").attr("x1", 100 + (20*i)).attr("y1", 0).attr("x2", 100 + (20*i)).attr("y2", lineHeight);
        tempDate.setMonth(tempDate.getMonth()+1);
    }
}

function labelYAxis(unitNames){
    // For each unit, place it on the graph's y axis
    $.each(unitNames, function ( index, value ){
        svgContainer.append("text").attr("x", 25).attr("y", 40 + (heightMultiplier * index)).attr("font-family", "sans-serif").attr("font-size","20px").attr("fill", "black").text(value);
    })
}

function populateGraph(leaseData) {
    $.each(leaseData, function ( index, value ){
        var beginDate = new Date(value.beginTimestamp);
        var endDate = new Date(value.endTimestamp);
        // Assemble variables to populate the month array
        var startMonth = calculateMonthSpread(earliestDate, beginDate);
        var endMonth = (calculateMonthSpread(earliestDate, beginDate)+calculateMonthSpread(beginDate, endDate)-1);

        for(var i = startMonth-1; i < endMonth; i++) {
            months[i].totalRent += value.rent;
        }
        // Calculate the width of the rectangle based on begin & end date
        var width = 20 * calculateMonthSpread(beginDate, endDate);
        // Calculate the x-axis offset
        var xAxisOffset = 20 * (calculateMonthSpread(earliestDate, beginDate)-1);
        // Calculate the y-axis offset
        var yAxisOffset = heightMultiplier * unitNames.indexOf(value.unitName)
        // Render the occupancy squares
        svgContainer.append("rect").attr("width", width).attr("height", 20).attr("x", 100 + xAxisOffset).attr("y", 20 + yAxisOffset).attr("fill", "green");
    });
}

function highlightRevenue(months) {
    // Sort the months by their total rents
    months.sort(function(a,b) { return  b.totalRent - a.totalRent });

    //Determine which month(s) to highlight
    var highestRevenue = 0;
    for( var i = 0; i < months.length; i++){
        if (months[i].totalRent < highestRevenue) {
            break;
        }else{
            highestRevenue = months[i].totalRent;
            svgContainer.append("rect").attr("width", 20).attr("height", 20).attr("x", 100 + (20*months[i].month)).attr("y", 0).attr("fill", "yellow").attr("class", "highlight");
        }
    }
    svgContainer.append("rect").attr("width", 100).attr("height", 20).attr("x", containerWidth-100).attr("y", 5).attr("fill", "yellow").attr("class", "highlight");
    svgContainer.append("text").attr("x", containerWidth-100).attr("y", 20).attr("font-family", "sans-serif").attr("font-size","15px").attr("fill", "black").text("Best Revenue");
    svgContainer.append("text").attr("x", containerWidth-100).attr("y", 40).attr("font-family", "sans-serif").attr("font-size","15px").attr("fill", "black").text(months[0].totalRent);
}