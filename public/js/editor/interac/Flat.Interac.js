var Flat = Flat || {};

(function() {
	"use strict";

	Flat.Interac = function(data, ctx, render, drawer, socket, RealTime) {
		this.data = data;
		this.render = render;
		this.drawer = drawer;
		this.Socket = socket;
		this.RealTime = RealTime;
		this.Cursor = new Flat.Cursor(data, ctx, socket);
		this.ActionFocus = null;
	};
}).call(this);