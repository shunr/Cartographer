var Cartographer = (function () {

    var editor = {};
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var handleRadius, img, canvas, map, areaIndex, drag, mode;

    var defaults = {
        imageId: "",
        handleRadius: 4,
        mapId: ""
    };

    editor.launch = function () {
        init();
        var options = {};
        if (arguments[0] && typeof arguments[0] === "object") {
            options = extendDefaults(defaults, arguments[0]);
        }
        handleRadius = options.handleRadius;
        img = document.getElementById(options.imageId);
        canvas.style.cssText = window.getComputedStyle(img).cssText;
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);
        img.style.display = "none";
        insertAfter(img, canvas);
        editor.importMap(options.mapId);
        document.addEventListener("mouseup", mouseUp);
        canvas.addEventListener("mousedown", mouseDown);
        canvas.addEventListener("mousemove", mouseMove);
        canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault();
        }, false);
    };

    function init() {
        map = [];
        areaIndex = 0;
        mode = "none";
        drag = null;
        if (img) {
            img.style.display = "initial";
        }
        canvas.remove();
        document.removeEventListener("mouseup", mouseUp);
        canvas.removeEventListener("mousedown", mouseDown);
        canvas.removeEventListener("mousemove", mouseMove);
    }

    editor.stop = function () {
        init();
    };

    editor.newShape = function (type) {
        mode = type;
        if (areaIndex < map.length) {
            areaIndex = map.length;
        }
        renderMap();
    };

    editor.deleteShape = function () {
        mode = "none";
        if (areaIndex < map.length) {
            map.splice(areaIndex, 1);
        }
        areaIndex = Math.max(map.length - 1, 0);
        renderMap();
    };

    function isRedundantPoint(x, y) {
        for (var n = -1; n <= 1; n++) {
            for (var m = -1; m <= 1; m++) {
                if (!ctx.isPointInPath(x + n, y + m, "evenodd")) {
                    return false;
                }
            }
        }
        return true;
    }

    function mouseShapePoint(e, x, y, type) {
        var shape = map[areaIndex];
        if (e.button == 0) {
            if (areaIndex >= map.length) {
                shape = map[map.push({
                    shape: type,
                    coords: [{
                        x: x,
                        y: y
                    }, {
                            x: x,
                            y: y
                        }]
                }) - 1];
                drag = shape.coords[1];
            }
        }
        renderMap();
    }

    function mousePolyPoint(e, x, y) {
        var shape = map[areaIndex];
        if (e.shiftKey && e.button == 0) {
            if (areaIndex >= map.length) {
                shape = map[map.push({
                    shape: "poly",
                    coords: []
                }) - 1]
            }
            shape.coords.push({
                x: x,
                y: y
            });
            traceSelection(shape);
            for (i in shape.coords) {
                if (isRedundantPoint(shape.coords[i].x, shape.coords[i].y)) {
                    shape.coords.splice(i, 1);
                }
            }
        } else if (e.button == 2 && shape && shape.coords.length > 3) {
            mouseWithinRadius(shape, x, y, function (i) {
                shape.coords.splice(i, 1);
            });
        }
        renderMap();
    }

    function mouseWithinRadius(shape, mouseX, mouseY, callback) {
        for (var i = shape.coords.length - 1; i >= 0; i--) {
            if (euclidianDist(shape.coords[i].x, shape.coords[i].y, mouseX, mouseY) <= handleRadius + 1) {
                return callback(i);
            }
        }
    }

    function renderMap() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        for (var i = 0; i < map.length; i++) {
            renderSelection(map[i], (i == areaIndex) ? 1 : 0.5);
        }
    }

    function mouseDown(e) {
        var x = e.offsetX;
        var y = e.offsetY;

        if (mode == "poly" || (map[areaIndex] && map[areaIndex].shape == "poly")) {
            mousePolyPoint(e, x, y);
        } else if (mode == "rect" || mode == "circle") {
            mouseShapePoint(e, x, y, mode);
        }

        if (map[areaIndex]) {
            mouseWithinRadius(map[areaIndex], x, y, function (i) {
                drag = map[areaIndex].coords[i];
            });
        }

        if (e.button == 0 && e.shiftKey == false && map.length > 0 && !drag) {
            mode = "none";
            if (areaIndex >= map.length) {
                areaIndex = Math.max(map.length - 1, 0);
            }
            for (var i = map.length - 1; i >= 0; i--) {
                traceSelection(map[i]);
                if (isRedundantPoint(x, y)) {
                    areaIndex = i;
                    break;
                } else {
                    mouseWithinRadius(map[i], x, y, function () {
                        areaIndex = i;
                    });
                }
            }

        }
    }

    function mouseUp(e) {
        drag = null;
    }

    function mouseMove(e) {
        var x = e.offsetX;
        var y = e.offsetY;
        canvas.style.cursor = "default";
        if (map.length > areaIndex) {
            mouseWithinRadius(map[areaIndex], x, y, function (i) {
                canvas.style.cursor = "all-scroll";
            });
            if (drag) {
                var index = map[areaIndex].coords.indexOf(drag);
                var other;
                if (map[areaIndex].coords.length == 2) {
                    other = (index == 0) ? map[areaIndex].coords[1] : map[areaIndex].coords[0];
                }

                if (e.shiftKey && other) {
                    other.x += x - drag.x;
                    other.y += y - drag.y;
                }
                drag.x = x;
                drag.y = y;

            }
        }
        renderMap();
    }

    function traceSelection(shape) {
        if (shape.coords) {
            if (shape.shape == "poly") {
                ctx.beginPath();
                ctx.moveTo(shape.coords.last().x, shape.coords.last().y);
                for (i in shape.coords) {
                    ctx.lineTo(shape.coords[i].x, shape.coords[i].y);
                }
                ctx.closePath();
            } else if (shape.shape == "rect") {
                ctx.beginPath();
                ctx.rect(shape.coords[0].x, shape.coords[0].y, (shape.coords[1].x - shape.coords[0].x), (shape.coords[1].y - shape.coords[0].y));
                ctx.closePath();
            } else if (shape.shape == "circle") {
                ctx.beginPath();
                ctx.arc(shape.coords[0].x, shape.coords[0].y, euclidianDist(shape.coords[0].x, shape.coords[0].y, shape.coords[1].x, shape.coords[1].y), 0, 2 * Math.PI, true);
                ctx.closePath();
            }
        }
    }

    function renderSelection(shape, alpha) {
        ctx.save();
        if (!alpha) {
            alpha = 1;
        }
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = "luminosity";
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.strokeStyle = "rgba(240,240,240,1)";
        ctx.shadowColor = "black";
        ctx.lineWidth = 3;
        traceSelection(shape);
        ctx.fill("evenodd");
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.fillStyle = "white";
        if (shape.coords.length > 0) {
            for (i in shape.coords) {
                ctx.beginPath();
                ctx.arc(shape.coords[i].x, shape.coords[i].y, handleRadius, 0, 2 * Math.PI, true);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    editor.importMap = function (mapId) {
        el = document.getElementById(mapId);
        if (!el) {
            return;
        }
        map = [];
        areaIndex = 0;
        mode = "none";
        drag = null;
        areas = el.getElementsByTagName("area");
        for (var i = 0; i < areas.length; i++) {
            shape = {coords: []};
            shape.shape = areas[i].shape;
            var coords = areas[i].coords.split(",");
            for (var c = 0; c < coords.length; c+=2) {
                shape.coords.push({
                    x: coords[c],
                    y: coords[c+1]
                });
            }
            map.push(shape);
        }
        renderMap();
    }

    editor.exportMap = function (type) {
        var out = [];
        if (type == "map") {
            for (var i = 0; i < map.length; i++) {
                var coords = "";
                for (var c = 0; c < map[i].coords.length; c++) {
                    coords += (map[i].coords[c].x + "," + map[i].coords[c].y + ((c < map[i].coords.length - 1) ? "," : ""));
                }
                out.push("<area shape='" + map[i].shape + "' coords='" + coords + "'>");
            }
        } else if (type == "json" || !type) {
            out = map;
        }
        return out;
    }

    /*UTILS*/
    function euclidianDist(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
    if (!Array.prototype.last) {
        Array.prototype.last = function () {
            return this[this.length - 1];
        };
    }

    function insertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function extendDefaults(source, properties) {
        var property;
        for (property in properties) {
            if (properties.hasOwnProperty(property)) {
                source[property] = properties[property];
            }
        }
        return source;
    }
    /* END UTILS */

    return editor;

} ());
