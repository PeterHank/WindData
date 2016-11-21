//// SVG AND D3 STUFF
var svg = d3.select("#chart").append("svg")
  .attr("width", 5000)
  .attr("height", 800);
var defs = svg.append("defs");
  
var projection = d3.geo.mercator()
  .center([90, 45]) 
  .scale(5000)
  .translate([300, 300]);

var path = d3.geo.path()
  .projection(projection);

var arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2";

var arrowMarker_weak = defs.append("marker")
						.attr("id","arrow_weak")
						.attr("markerUnits","strokeWidth")
					    .attr("markerWidth","2.5")
                        .attr("markerHeight","2.5")
                        .attr("viewBox","0 0 12 12") 
                        .attr("refX","6")
                        .attr("refY","6")
                        .attr("orient","auto")
						.attr("stroke","red");
						//.attr("fill", "red");						
arrowMarker_weak.append("path")
			.attr("d",arrow_path)
			.attr("fill","red");
			
var lines_weak = [];
			
var arrowMarker_norm = defs.append("marker")
						.attr("id","arrow_norm")
						.attr("markerUnits","strokeWidth")
					    .attr("markerWidth","3.5")
                        .attr("markerHeight","3.5")
                        .attr("viewBox","0 0 12 12") 
                        .attr("refX","6")
                        .attr("refY","6")
                        .attr("orient","auto")
						.attr("stroke","black");
						//.attr("fill", "red");
						
arrowMarker_norm.append("path")
			.attr("d",arrow_path)
			.attr("fill","red");			
var lines_norm = [];	

var arrowMarker_mid = defs.append("marker")
						.attr("id","arrow_mid")
						.attr("markerUnits","strokeWidth")
					    .attr("markerWidth","4.5")
                        .attr("markerHeight","4.5")
                        .attr("viewBox","0 0 12 12") 
                        .attr("refX","6")
                        .attr("refY","6")
                        .attr("orient","auto")
						.attr("stroke","blue");
						//.attr("fill", "red");
						
arrowMarker_mid.append("path")
			.attr("d",arrow_path)
			.attr("fill","red");			
var lines_mid = [];	

var arrowMarker_strong = defs.append("marker")
						.attr("id","arrow_strong")
						.attr("markerUnits","strokeWidth")
					    .attr("markerWidth","6.5")
                        .attr("markerHeight","6.5")
                        .attr("viewBox","0 0 12 12") 
                        .attr("refX","6")
                        .attr("refY","6")
                        .attr("orient","auto")
						.attr("stroke","orange");
						//.attr("fill", "red");
						
arrowMarker_strong.append("path")
			.attr("d",arrow_path)
			.attr("fill","red");			
var lines_strong = [];	



//// MATH FUNCTIONS
function toRad(deg) {return deg * Math.PI / 180;}
function toDeg(rad) {return rad * 180 / Math.PI;}

function lonLatFromLonLatDistanceAndBearing(lonLat, d, brng) {
  // Formulae from http://www.movable-type.co.uk/scripts/latlong.html
  // brg in radians, d in km
  var R = 6371; // Earth's radius in km
  var lon1 = toRad(lonLat[0]), lat1 = toRad(lonLat[1]);
  var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng) );
  var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(lat1), Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));
  return [toDeg(lon2), toDeg(lat2)];
}


//// INITIALISATION
var cardinalToBearing = {};
var windData;

function init() {
	
	// clear the data
	lines_mid=[];
	lines_norm=[];
	lines_weak=[];
	lines_strong=[];
	  
  var i, cardinalPoints = [ 'S', 'SW','W','NW','N', 'NE', 'E', 'SE'];

  // Calculate cardinal point to bearing mapping (wind direction is where the wind is coming *from*!)
  for(i = 0; i < cardinalPoints.length; i++)
    cardinalToBearing[cardinalPoints[i]] = i * Math.PI / 4;

  // Prepare line co-ordinates
  for(i = 0; i < windData.length; i++) {
    var d = windData[i];
    var speed = d.Period.Rep.S;
    var feelsLikeTemperature = d.Period.Rep.F;
    var lonLat0 = [d.lon, d.lat];
	
	if(speed == 9999){
		speed = 1;
	}

    // Scale line length proportionally to speed
    var lonLat1 = lonLatFromLonLatDistanceAndBearing(lonLat0, 1.2 * speed, cardinalToBearing[d.Period.Rep.D]);

    x0y0 = projection(lonLat0);
    x1y1 = projection(lonLat1);
	if (speed  < 2){
		var line_weak = 
		{
		  x0: x0y0[0],
		  y0: x0y0[1],
		  x1: x1y1[0],
		  y1: x1y1[1],
		  s: speed,
		};
		lines_weak.push(line_weak);
	}
	else if (speed < 4){
		var line_norm = 
		{
		  x0: x0y0[0],
		  y0: x0y0[1],
		  x1: x1y1[0],
		  y1: x1y1[1],
		  s: speed,
		};
		lines_norm.push(line_norm);
	}
	else if (speed < 6){
		var line_mid = 
		{
		  x0: x0y0[0],
		  y0: x0y0[1],
		  x1: x1y1[0],
		  y1: x1y1[1],
		  s: speed,
		};
		lines_mid.push(line_mid);
	}
	else if (speed >= 6){
		var line_strong = 
		{
		  x0: x0y0[0],
		  y0: x0y0[1],
		  x1: x1y1[0],
		  y1: x1y1[1],
		  s: speed,
		};
		lines_strong.push(line_strong);
	}	
  }
}

var flag = 0;

function DrawMap(ShowNorm,ShowMid,ShowStrong){
   d3.json("china.topojson", function(error, toporoot) {
	if (error) 
		return console.error(error);
	
	//输出china.topojson的对象
	//console.log(toporoot);
	
	//将TopoJSON对象转换成GeoJSON，保存在georoot中
	var georoot = topojson.feature(toporoot,toporoot.objects.china);
	
	//输出GeoJSON对象
	console.log(georoot);

	//包含中国各省路径的分组元素
	var china = svg.append("g");
		
	//添加中国各种的路径元素
	var provinces = china.selectAll("path")
			.data( georoot.features )
			.enter()
			.append("path")
			.attr("class","province")
			.style("fill", "yello")
			.attr("d", path );
			
	if(flag == 1)
	{
		norm.remove()
		mid.remove()
		strong.remove()
	}
	else {
		flag = 1;
	}
			

	 weak = svg.selectAll('line_weak')
		.data(lines_weak)
		.enter()
		.append("line")
		.attr({
			  x1: function(d) {return d.x0}, 
			  y1: function(d) {return d.y0},
			  x2:function(d) {return d.x1},
			  y2:function(d) {return d.y1}

		})
		//.attr("class","route")
		.attr("marker-end","url(#arrow_weak)")
		weak.remove()
	
	// norm_line
	  norm = svg.selectAll('line_norm')
		.data(lines_norm)
		.enter()
		.append("line")
		.attr({
			  x1: function(d) {return d.x0}, 
			  y1: function(d) {return d.y0},
			  x2:function(d) {return d.x1},
			  y2:function(d) {return d.y1}

		})
		.attr("marker-end","url(#arrow_norm)")

	//mid_wind	
	  mid = svg.selectAll('line_mid')
		.data(lines_mid)
		.enter()
		.append("line")
		.attr({
			  x1: function(d) {return d.x0}, 
			  y1: function(d) {return d.y0},
			  x2:function(d) {return d.x1},
			  y2:function(d) {return d.y1}

		})
		//.attr("class","route")
		.attr("marker-end","url(#arrow_mid)")
		//.call(change_data_norm);
	//strong_wind
	  strong = svg.selectAll('line_strong')
		.data(lines_strong)
		.enter()
		.append("line")
		.attr({
			  x1: function(d) {return d.x0}, 
			  y1: function(d) {return d.y0},
			  x2:function(d) {return d.x1},
			  y2:function(d) {return d.y1}

		})
		//.attr("class","route")
		.attr("marker-end","url(#arrow_strong)")
		if(ShowNorm ==0){
			norm.remove()
		}
		if(ShowMid == 0){
			mid.remove()
		}
		if(ShowStrong ==0){
			strong.remove()
		}		
	});	

}
var flag =0;    //denote if this is the first time show data, if flag ==0, it is the first time, there is no need to clear data  
var Data_Flag=0;
var WindDatas=[];
var ShowTime = 0;
windDatas = [weather010101,weather010109,weather010117,
			weather010201,weather010209,weather010217,
			weather010301,weather010309,weather010317,
			weather010401,weather010409,weather010417,
			weather010501,weather010509,weather010517,
			weather010601,weather010609,weather010617,
			weather010701,weather010709,weather010717,
			weather010801,weather010809,weather010817,
			weather010901,weather010909,weather010917
			];
			
// startpoint represent the flash start from a setting time.
var Startpoint=0;
var IsShowNorm;
var IsShowMid;
var IsShowStrong;
var EnterFuncTime = 0;
function change_lines(ShowNorm,ShowMid,ShowStrong,startpoint){
	
	EnterFuncTime += 1;
	var RunningTime = EnterFuncTime;
	temp= startpoint||88;
	if(temp == 88){
		startpoint = ShowTime+Startpoint;
		Startpoint = startpoint;
	}
	else{
		Startpoint = temp;		
	}
	ShowTime = 0;
	IsShowNorm = ShowNorm;
	IsShowMid = ShowMid;
	IsShowStrong = ShowStrong;
	RePlay(RunningTime);
}

function RePlay(sp){
	
	if(EnterFuncTime != sp){
		return;				
	}	
	windData = windDatas[ShowTime+Startpoint].SiteRep.DV.Location;
	init();	
	DrawMap(IsShowNorm,IsShowMid,IsShowStrong);
	ShowTime +=1;
	if(ShowTime+Startpoint == windDatas.length){
		ShowTime = 0;
		Startpoint = 0;
		//return;
	}
	//return ; 
	var funcitonName = 'RePlay'+'('+sp+')';
	setTimeout(funcitonName,1000);	
	
}

function ShowOneDayWind(WindDataInThisDay,ShowNorm,ShowMid,ShowStrong){
	windData = WindDataInThisDay.SiteRep.DV.Location;
	init();
	DrawMap(ShowNorm,ShowMid,ShowStrong);	
}
	change_lines(1,1,1,8);	







//ShowOneDayWind(weather030101,0,1,1);  //show the wind in a day






