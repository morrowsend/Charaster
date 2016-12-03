// Canvases.
charaster.gridCanvas = document.getElementById("grid");
charaster.gridContext = charaster.gridCanvas.getContext("2d");
charaster.rasterCanvas = document.getElementById("raster");
charaster.rasterContext = charaster.rasterCanvas.getContext("2d");
charaster.cursorCanvas = document.getElementById("cursor");
charaster.cursorContext = charaster.cursorCanvas.getContext("2d");

// Info.
charaster.cursorPos = document.getElementById("cursorPos");
charaster.gridSize = document.getElementById("gridSize");
charaster.gridSize.innerHTML = "[" + charaster.gridWidth + ", " + charaster.gridHeight + "]";

// Chrome.
charaster.body = document.getElementById("body");
charaster.controls = document.getElementById("controls");
charaster.info = document.getElementById("info");
charaster.bars = document.getElementsByClassName("bar");
charaster.foreground = document.getElementById("foreground");
charaster.icons = document.getElementsByClassName("icon");
charaster.iconStrokes = document.getElementsByClassName("iconStroke");

var draw = false;
var drawList = new Array();

// Based on http://tech-algorithm.com/articles/drawing-line-using-bresenham-algorithm/
function rasterLine(x0, y0, x1, y1) {
  var width = x1 - x0;
  var height = y1 - y0;
  var slopeX0 = 0;
  var slopeY0 = 0;
  var slopeX1 = 0;
  var slopeY1 = 0;

  // Octant.
  if (width < 0) {
    slopeX0 = -1;
  } else if (width > 0) {
    slopeX0 = 1;
  }
  if (height < 0) {
    slopeY0 = -1;
  } else if (height > 0) {
    slopeY0 = 1;
  }
  if (width < 0) {
    slopeX1 = -1;
  } else if (width > 0) {
    slopeX1 = 1;
  }
  intWidth = Math.abs(width);
  intHeight = Math.abs(height);
  var longest = intWidth;
  var shortest = intHeight;
  if (longest <= shortest) {
    longest = intHeight
    shortest = intWidth
    if (height < 0) {
      slopeY1 = -1;
    } else if (height > 0) {
      slopeY1 = 1;
    }
    slopeX1 = 0;
  }

  // Drawing.
  var list = [];
  var numerator = longest >> 1;
  for (var i = 0; i <= longest; i++) {
    list.push(new Point(x0, y0));
    numerator += shortest;
    if (numerator >= longest) {
      numerator -= longest;
      x0 += slopeX0;
      y0 += slopeY0;
    } else {
      x0 += slopeX1;
      y0 += slopeY1;
    }
  }
  return list;
}

function getMousePos(canvas, e) {
  var rect = canvas.getBoundingClientRect();
  return new Point(e.clientX - rect.left, e.clientY - rect.top);
}

// Snap a given value to the grid interval.
function snap(pos, grid) {
  for (var i = 0; i < Math.max(charaster.rasterCanvas.width, charaster.rasterCanvas.height); i += grid) {
    if (pos <= i) {
      return i;
    }
  }
}

// Snap a given point to the grid.
function snapPos(point) {
  var x = snap(point.x, charaster.fontWidth);
  var y = snap(point.y, charaster.fontHeight);
  return new Point(x, y);
}

// When a button is clicked change the mode and visual style of it.
function buttonMode(id, mode, activate) {
  var button = document.getElementById(id);
  button.addEventListener('click', function(e) {
    var reset = document.getElementsByClassName("icon");
    for (var i = 0; i < reset.length; i++) {
      reset[i].style.fill = charaster.theme.icon;
    }
    var reset = document.getElementsByTagName("svg");
    for (var i = 0; i < reset.length; i++) {
      reset[i].style.background = "none";
    }
    button.style.background = charaster.theme.iconActive;
    button.getElementsByClassName("icon")[0].style.fill = charaster.theme.iconActiveText;
    button.style.borderRadius = "2px";
    charaster.mode = mode;
  }, false);
  if (activate) {
    button.style.background = charaster.theme.iconActive;
    button.getElementsByClassName("icon")[0].style.fill = charaster.theme.iconActiveText;
    button.style.borderRadius = "2px";
  }
}

window.addEventListener("load", function(e) {
  charaster.applyTheme(charaster.theme.name);
  charaster.drawRaster();
  charaster.drawCursor();
  charaster.drawGrid();
  buttonMode("textMode", "TEXT", false);
  buttonMode("eraserMode", "ERASER", false);
  buttonMode("pencilMode", "PENCIL", true);
  for (var i = 0; i < charaster.theme.colors.length; i++) {
    var color = document.getElementById("color" + (i + 1));
    color.style.backgroundColor = charaster.theme.colors[i];
    color.style.borderColor = charaster.theme.barBorder;
    color.addEventListener('click', function(e) {
      var index = e.target.id.replace("color", "") - 1;
      charaster.foreground = charaster.theme.colors[index];
      console.log(index + " " + charaster.theme.colors[index] + " " + charaster.foreground);
    }, false);
  }
}, false);


window.addEventListener("keydown", function(e) {
  if([8].indexOf(e.keyCode) > -1) {
    e.preventDefault();
  }
  if (e.keyCode == 46) {
    charaster.setCell(new Cell(charaster.cursor, null)); // Delete.
  }
  if (charaster.mode == "TEXT") {
    if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();
    }
    if (e.keyCode == 39 && charaster.cursor.x < charaster.gridWidth - 1) {
      charaster.moveCursorRelative(1, 0);   // Right.
    } else if (e.keyCode == 40 && charaster.cursor.y < charaster.gridHeight - 1) {
      charaster.moveCursorRelative(0, 1);   // Down.
    } else if (e.keyCode == 37 && charaster.cursor.x > 0) {
      charaster.moveCursorRelative(-1, 0);  // Left.
    } else if (e.keyCode == 38 && charaster.cursor.y > 0) {
      charaster.moveCursorRelative(0, -1);  // Up.
    } else if (e.keyCode == 8) {
      charaster.setCell(new Cell(charaster.cursor, null)); // Delete.
      charaster.moveCursorRelative(-1, 0);  // Left.
    }
  }
}, false);

window.addEventListener("keypress", function(e) {
  if([13].indexOf(e.keyCode) > -1) {
    return;
  }
  charaster.character = String.fromCharCode(e.keyCode);
  var preview = document.getElementById("preview");
  preview.value = charaster.character;
  preview.style.backgroundColor = charaster.theme.background;
  preview.style.color = charaster.theme.foreground;
  if (charaster.mode == "TEXT") {
    charaster.setCell(new Cell(charaster.cursor, charaster.character));
    charaster.moveCursorRelative(1, 0);
  }
}, false);

charaster.cursorCanvas.addEventListener('mousemove', function(e) {
  if (charaster.mode == "PENCIL" || charaster.mode == "ERASER") {
    var pos = getMousePos(charaster.rasterCanvas, e);
    charaster.cursor = charaster.coordToGrid(snapPos(pos));
    charaster.drawCursor();
    if (draw) {
      var cell = new Cell(charaster.cursor, charaster.character);
      if (drawList.length >= 1 && !drawList[drawList.length - 1].equality(cell)) {
        drawList.push(cell);
        if (drawList.length >= 2) {
          var line = rasterLine(
            drawList[0].point.x, drawList[0].point.y,
            drawList[1].point.x, drawList[1].point.y
          );

          // Draw lines between cells.
          for (var i = 0; i < line.length; i++) {
            var character = null;
            if (charaster.mode == "PENCIL") {
              character = charaster.character;
            }
            charaster.setCell(new Cell(line[i], character));
          }
          drawList.shift();
        }
      } else if (drawList.length == 0) {
        drawList.push(cell);
      }
    }
  }
}, false);

charaster.cursorCanvas.addEventListener('mouseleave', function(e) {
  draw = false;
  drawList = [];
}, false);

charaster.cursorCanvas.addEventListener('click', function(e) {
  if (charaster.mode == "PENCIL" || charaster.mode == "ERASER") {
    var pos = getMousePos(charaster.rasterCanvas, e);
    charaster.cursor = charaster.coordToGrid(snapPos(pos));
    var character = null;
    if (charaster.mode == "PENCIL") {
      character = charaster.character;
    }
    charaster.setCell(new Cell(charaster.cursor, character));
  }
}, false);

charaster.cursorCanvas.addEventListener('mousedown', function(e) {
  if (charaster.mode == "PENCIL" || charaster.mode == "ERASER") {
    draw = true;
    var cell = new Cell(charaster.cursor, charaster.character);
    charaster.setCell(cell);
  }
}, false);

charaster.cursorCanvas.addEventListener('mouseup', function(e) {
  if (charaster.mode == "PENCIL" || charaster.mode == "ERASER") {
    draw = false;
    drawList = [];
  }
}, false);

window.addEventListener('copy', function(e) {
  alert(charaster.getCell(charaster.cursor));
}, false);


window.addEventListener('resize', function(e) {
  var top = document.getElementById("controls").clientHeight + 1;
  charaster.gridCanvas.style.top = top + "px";
  charaster.rasterCanvas.style.top = top + "px";
  charaster.cursorCanvas.style.top = top + "px";
}, false);