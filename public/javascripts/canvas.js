$(function () {
  
  var $canvas    = $('#canvas'),
      $slider    = $('#slider'),
      $toolbar   = $('#toolbar'),
      $colorList = $('#color-list'),
      $win       = $(window),
      socket     = io.connect(),
      thickness  = 7,
      color      = $colorList.find('.selected').data('color'),
      isPenDown  = false,
      xy         = [],
      startX, 
      startY;

  /**
   * Resize the canvas element to fit the
   * available space.
   *
   * Resizing the canvas is also known to
   * erase any drawing.
   *
   * @api private
   */
  function fitCanvas() {
    $canvas.attr({
      height : $win.height() - $toolbar.height(),
      width  : $win.width()
    });
  }

  /**
   * The pen touches the canvas.
   * It happens on mousedown and touchstart event.
   * 
   * @param {object} e (jQuery event)
   *
   * @api private
   */
  function placePen(e) {
    isPenDown = true;
    xy        = [];
    startX    = e.pageX;
    startY    = e.pageY;
  }

  /**
   * The pen is moved on the canvas.
   * It happens on mousemove and touchmove event.
   *
   * The pen has to touch the canvas first.
   * 
   * @param {object} e   (on touch, this is e.originalEvent)
   * @param {object} jQe (jQuery event)
   *
   * @api private
   */
  function movePen(e, jQe) {
    if(!isPenDown) return;

    var jQe = jQe || e;
    jQe.preventDefault();
      
    $canvas.drawLine({
      strokeStyle: color,
      strokeWidth: thickness,
      rounded: true,
      x1: startX,
      y1: startY,
      x2: e.pageX,
      y2: e.pageY
    });
    
    startX = e.pageX;
    startY = e.pageY;
    
    xy.push({
      x: e.pageX,
      y: e.pageY,
      color: color,
      thickness: thickness
    });

    //we need at least 2 points to draw a line
    if(xy.length > 1)
      socket.emit('draw', xy);
  }

  /**
   * The pen is raised from the canvas.
   * It happens on mouseup, mouseout, touchend, touchcancel.
   * 
   * @api private
   */
  function removePen() {
    isPenDown = false;
  }

  /**
   * Init the app.
   * Binds the events, inits the slider and starts the app.
   * 
   * @api private
   */
  function initApp(){
    //canvas events
    $canvas.on({
      //touch events
      touchstart  : function(e){ placePen(e.originalEvent.touches[0]); },
      touchmove   : function(e){ movePen(e.originalEvent.touches[0], e); },
      touchend    : function() { removePen(); },
      touchcancel : function() { removePen(); },
      //mouse events
      mousedown   : function(e){ placePen(e); },
      mousemove   : function(e){ movePen(e);  },
      mouseup     : function() { removePen(); },
      mouseout    : function() { removePen(); }
    });

    //color selection events
    $colorList.on('click touchstart', 'a', function(e){
      e.preventDefault();
      $colorList.find('.selected').removeClass('selected');
      $(this).addClass('selected');
      color = $(e.target).data('color');
    });

    //draw received lines in real time
    socket.on('draw', function(coords){
      var params = {
        strokeStyle: coords[0].color,
        strokeWidth: coords[0].thickness,
        rounded: true
      };
      
      $.each(coords, function(i, c){
        params['x'+(i+1)] = c.x;
        params['y'+(i+1)] = c.y;
      });

      $canvas.drawLine(params);
    });

    //display a message when a user connects
    socket.on('user connected', function(){
      $.jGrowl("New user connected");
    });

    //resize the canvas
    $(window).on('resize', fitCanvas);
    fitCanvas();

    //avoid bouncing on scrollmove
    $toolbar.on('touchmove', function(e){ e.preventDefault(); });

    //init thickness slider
    $slider.slider({
      step:  1,
      min:   1,
      max:   50,
      value: thickness,
      slide: function() {
        //update thickness value everytime we slide
        thickness = $slider.slider('value');
      }
    });

    //check for canvas support and, maybe later, provide fallback
    if(!Modernizr.canvas)
      $('body').html('Your browser sucks.');
  }

  initApp();

});
