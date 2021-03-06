var ItemPoint = function(_game, _product, _details) {
	this.game_ = _game;

	this.raw_ = _product;
	this.name_ = _product['productName'];
	this.img_ = _product['productImage'];
	this.desc_ = _product['productDescription'];

	this.radius_ = _details.radius;

	this.colour_ = _details.catinfo['colour'];
	this.colourVal_ = _details.catinfo['colourVal'];

	this.icon_ = _details.catinfo['icon'];

	this.cat_ = _details.catid;

	this.visible_ = true;

	this.marker_ = null;
	this.circle_ = null;

	this.overlay_ = null;
	
	this.latlong_ = new google.maps.LatLng(_details.lat, _details.lng);
	this.loc_ = null;		
}

function infoclick(){
	myGame.infoWindow_.close();
	if(!myGame.tempSel){
		return;
	}
	myGame.selectMarker(myGame.tempSel);
	myGame.sliderChanged(0.007);
	myGame.stage_.draw();
}

ItemPoint.prototype.init = function(_overlay, _layer) {

	this.overlay_ = _overlay;
	this.loc_ = _overlay.MapPoint(this.latlong_.lat(), this.latlong_.lng());

	this.marker_ = new google.maps.Marker({
      		position: this.latlong_,
      		map: _overlay.map_,
      		title: this.title_,
      		visible: false,
      		icon: this.icon_
  	});
	
  	this.circle_ = new Kinetic.Circle({
		x: this.loc_.x,
		y: this.loc_.y,
		radius: this.radius_,
		fill: this.colourVal_, 
		opacity: 0.3,
		stroke: this.colourVal_,
		strokeWidth: 0.0005,
		visible: false        
	});
	_layer.add(this.circle_);	

	this.marker_.set('mContent', this);
	// handle clicking on marker
	google.maps.event.addListener(this.marker_, 'click', function(evt){
		// show the detail info, except if the marker has already been chosen, do show the add button
		var mContent = this.get('mContent');
		myGame.tempSel = mContent;

		var contString = '<div id="pname">' + mContent.name_ + '</div>' +
						 '<img id="popimg" height="100" src="' + mContent.img_ + '"/>' +
						 '<div id="pdesc">' + mContent.desc_ + '</div>';
		if(!mContent.chosen_){					
			//contString += '<div id="pchoose" class="btn">Add to Itinerary</div>';
			contString += '<input type="button" onclick="infoclick()" value="Add to Itinerary">';
		}
		mContent.game_.infoWindow_.setContent(contString);		
		mContent.game_.infoWindow_.open(_overlay.map_, this);		
	});
}

ItemPoint.prototype.showCircle = function(){
	this.circle_.show();
}
ItemPoint.prototype.showMarker = function(){
	this.marker_.setVisible(true);
}
ItemPoint.prototype.hideCircle = function(){
	this.circle_.hide();
}
ItemPoint.prototype.hideMarker = function(){
	this.marker_.setVisible(false);
}

ItemPoint.prototype.select = function(){
	var blackIcon = 'http://maps.google.com/mapfiles/marker_black.png';
	this.marker_.setIcon(blackIcon);
}

ItemPoint.prototype.setColour = function(_colour){
	
}

ItemPoint.prototype.setRadius = function(_radius){
	this.circle_.setAttr('radius', _radius);	
}

// Game class
function Game(_url){

this.catInfo_ = {
	'RESTAURANT' : {
		'colour' : 'red',
		'colourVal' : '#FF0000',
		'icon' : 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/red.png',
		'label' : 'Restaurants',
		'state' : true
	},
	'ATTRACTION' : {
		'colour' : 'green',
		'colourVal' : '#00FF00',
		'icon' : 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/green.png',
		'label' : 'Attractions',
		'state' : true
	},
	'ACCOM' : {
		'colour' : 'blue',
		'colourVal' : '#0000FF',		
		'icon' : 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/blue.png',
		'label' : 'Accommodation',
		'state' : true	
	},
	'EVENT' : {
		'colour' : 'purple',
		'colourVal' : '#9000ff',
		'icon' : 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/purple.png',
		'label' : 'Events',
		'state' : true
	},
	'TOUR' : {
		'colour' : 'orange',
		'colourVal' : '#ffa800',
		'icon' : 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/orange.png',
		'label' : 'Tours',
		'state' : true
	},
	'JOURNEY' : {
		'colour' : 'yellow',
		'colourVal' : '#FFFF00',
		'icon' : 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/yellow.png',
		'label' : 'Journeys',
		'state' : true
	},
	/*'HIRE' : {

	},
	
	'INFO' : {

	},
	'DESTINFO' : {

	},
	'TRANSPORT' : {

	}*/
};

	this.curSelection_ = null;
	this.stage_ = null;
	this.overlay_ = null;

	this.curSliderValue_ = 0.007;

	this.data_ = null;
	var that = this;
	$.ajax({
        url: _url,
        success: function(result) {
       		that.data_ = result;
        },
        async: false
    });

    this.markerList_ = [];
    this.layers_ = [];

    this.infoWindow_ = new google.maps.InfoWindow({
			content: ''
		});

    // go through the data and setup the points/layers/etc
    var products = this.data_['products'];
	for(var i=0;i<products.length;i++){

		var locs = products[i]['nearestLocation'].split(',');		

		var info = this.catInfo_[products[i]['productCategoryId']];
		if(info){

			var point = new ItemPoint(this, products[i],
				{ lat: locs[0], lng: locs[1],
				  catinfo: info,
				  radius: 0.007,
				  catid: products[i]['productCategoryId']
				});

			// add to the correct layer
			if(!(products[i]['productCategoryId'] in this.layers_)){
				this.layers_['productCategoryId'] = [];
			}
			this.layers_['productCategoryId'].push(point);	
		
			// add to global list
			this.markerList_.push(point);			
		}
	}
};


Game.prototype.toggleCat = function(_cat, _show){

	var pos = this.curSelection_.latlong_;
	// go through each marker
	for(var i=0;i<this.markerList_.length;i++){
		// if it is in the given category
		if(this.catInfo_[this.markerList_[i].cat_]['label'] == _cat){
			if(_show){
				// if it is inside the circle
				var target = this.markerList_[i].latlong_;
				var dist = google.maps.geometry.spherical.computeDistanceBetween(pos, target);
		
				if(dist < this.curSliderValue_ * 130000){
					this.markerList_[i].showMarker();
				}
			}else{
				this.markerList_[i].hideMarker();
			}

			this.catInfo_[this.markerList_[i].cat_]['state'] = _show;
		}
	}
}

Game.prototype.getData = function(){
	return this.data_;
}

Game.prototype.selectMarker = function(_marker){
	if(this.curSelection_){	
		this.curSelection_.hideCircle();
	}	
	this.curSelection_ = _marker;
	_marker.select();
	_marker.showMarker();
	_marker.showCircle();	

	this.overlay_.map_.panTo(_marker.latlong_);

	// add marker to itinaray lis
	$('#itinlist .active').removeClass('active');
	$('#itinlist').append('<li class="active"><a href="#">' + _marker.name_ + '</a></li>');

	//this.sliderChanged(0.007);
	this.stage_.draw();	
}

Game.prototype.load = function(_overlay) {

	this.overlay_ = _overlay;
	this.stage_ = _overlay.getStage();
	var layer = new Kinetic.Layer();
	this.stage_.add(layer);

	for(var i=0;i<this.markerList_.length;i++){
		this.markerList_[i].init(_overlay, layer);
		if(i==0){
			this.selectMarker(this.markerList_[i]);
		}		
	}
}

Game.prototype.sliderChanged = function(_value){
	if(!this.curSelection_){
		return;
	}

	this.curSelection_.setRadius(_value);

	// need to calculate which points to show within the radius
	// get position and radius information
	var pos = this.curSelection_.latlong_;	
	
	for(var i=0;i<this.markerList_.length;i++){

		var target = this.markerList_[i].latlong_;

		var dist = google.maps.geometry.spherical.computeDistanceBetween(pos, target);
		
		var shouldShow = this.catInfo_[this.markerList_[i].cat_]['state'];

		if(dist < _value * 130000 && shouldShow){
			this.markerList_[i].showMarker();
		}else{
			this.markerList_[i].hideMarker();
		}				
	}

	this.stage_.draw();

	this.curSliderValue_ = _value;
}